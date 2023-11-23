import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { MailerService } from '@nest-modules/mailer'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

import { Status, User } from 'src/user/schemas/user.schema'
import { ForgotPassDto, LoginDto, RefreshDto, RegisterDto, ResetPassDto } from './dto'
import { Key } from 'src/user/schemas/key.schema'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PusherService } from 'src/pusher/pusher.service'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Key.name) private keyModel: Model<Key>,
    private jwtSercive: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
    private pusherService: PusherService
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    const user = await this.userModel.findOne({ email: registerDto.email }).lean()

    if (user) {
      throw new HttpException('Email already have an account', HttpStatus.BAD_REQUEST)
    }

    const hashPassword = await this.bcryptHash(registerDto.password)

    const newUser = await this.userModel.create({
      ...registerDto,
      displayName: `${registerDto.firstName} ${registerDto.lastName}`,
      password: hashPassword
    })

    if (newUser && !(this.configService.get('MAIL_DISABLE') === 'true')) {
      const hashed = await this.bcryptHash(newUser._id.toString())
      const verifyUrl = `${this.configService.get<string>(
        'APP_URL'
      )}/api/v1/auth/verify?userid=${newUser._id.toString()}&token=${hashed}`

      await this.mailerService.sendMail({
        to: registerDto.email,
        subject: 'Welcome to Agora',
        template: './verify',
        context: {
          name: registerDto.firstName,
          verifyUrl
        }
      })
    }

    return newUser
  }

  async login(loginDto: LoginDto): Promise<any> {
    // check email
    const user = await this.userModel.findOne({ email: loginDto.email }).select('+password').lean()

    if (!user) {
      throw new BadRequestException('Email is not registred.')
    }

    // match password
    const checkPass = bcrypt.compareSync(loginDto.password, user.password)
    if (!checkPass) {
      throw new BadRequestException('Password is not correct')
    }

    // create token
    const refreshSecretKey = randomBytes(64).toString('hex')
    const accessSecretKey = randomBytes(64).toString('hex')

    // generate token
    const token = await this.generateToken(
      { id: user._id, email: user.email },
      refreshSecretKey,
      accessSecretKey
    )

    // create Key
    await this.createKey(user._id, refreshSecretKey, accessSecretKey, token.refreshToken)

    return {
      token,
      userId: user._id.toString()
    }
  }

  async verifyAccount(userid: string, token: string) {
    const checked = bcrypt.compareSync(userid, token)

    if (!checked) {
      throw new BadRequestException('Verify account failed')
    }

    const result = await this.userModel.updateOne({ _id: userid }, { status: Status.ACTIVE })

    return result
  }

  async refreshToken({ refreshToken }: RefreshDto): Promise<any> {
    const foundToken = await this.keyModel.findOne({ refreshTokenUseds: refreshToken })

    // token is used
    if (foundToken) {
      const { id, email } = await this.jwtSercive.verify(refreshToken, {
        secret: foundToken.refreshSecretKey
      })
      console.log('bad-refresh:::\n', { id, email })
      await this.keyModel.deleteOne({ user: foundToken.user })
      throw new ForbiddenException('Something wrong happened!! Pls login again tks!')
    }

    const key = await this.keyModel.findOne({ refreshToken }).lean()

    const { id, email } = await this.jwtSercive.verify(refreshToken, {
      secret: key.refreshSecretKey
    })

    const foundUser = await this.userModel.findOne({ email })
    if (!foundUser) {
      throw new UnauthorizedException('User not registered')
    }

    const token = await this.generateToken({ id, email }, key.refreshSecretKey, key.accessSecretKey)

    await this.keyModel.updateOne(key, {
      $set: {
        refreshToken: token.refreshToken
      },
      $addToSet: {
        refreshTokenUseds: refreshToken
      }
    })

    return {
      token
    }
  }

  async forgotPassword(forgotPassDto: ForgotPassDto) {
    const user = await this.userModel.findOne({ email: forgotPassDto.email }).lean()

    if (!user) {
      throw new NotFoundException('Email not registered!!!')
    }

    //generate password reset token
    const token = this.jwtSercive.sign(
      {
        id: user._id.toString()
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_RESET_PASS_TOKEN_EXP_IN')
      }
    )

    // Send the password reset email
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Agora reset password',
      template: './reset-password',
      context: {
        name: user.firstName,
        resetPassUrl: `${this.configService.get<string>('FE_URL')}/reset-password?token=${token}`
      }
    })

    return true
  }

  async resetPassword(resetPassDto: ResetPassDto, token: string) {
    const { id } = await this.jwtSercive.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET')
    })

    const user = await this.userModel
      .findOne({
        _id: new Types.ObjectId(id)
      })
      .lean()

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token')
    }

    const hashPassword = await this.bcryptHash(resetPassDto.password)

    const result = await this.userModel.updateOne(user, {
      $set: {
        password: hashPassword
      }
    })
    return result
  }

  async authPusher(socketId: string, channelName: string, accessToken: string, userId: string) {
    const userData = await this.verifyToken(accessToken, userId)

    return this.pusherService.authorizeChannel(socketId, channelName, {
      user_id: userId,
      user_info: {
        email: userData.email
      }
    })
  }

  async verifyToken(token: string, userId: string) {
    try {
      const key = await this.keyModel.findOne({ user: new Types.ObjectId(userId) }).lean()

      return await this.jwtSercive.verify(token, {
        secret: key.accessSecretKey
      })
    } catch (error) {
      throw new UnauthorizedException()
    }
  }

  async generateToken(
    payload: { id: Types.ObjectId; email: string },
    refreshSecretKey: string,
    accessSecretKey: string
  ): Promise<any> {
    const accessToken = await this.jwtSercive.signAsync(payload, {
      secret: accessSecretKey,
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXP_IN')
    })
    const refreshToken = await this.jwtSercive.signAsync(payload, {
      secret: refreshSecretKey,
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXP_IN')
    })

    return { accessToken, refreshToken }
  }

  async bcryptHash(payload: string): Promise<any> {
    const saltRound = 10
    const salt = await bcrypt.genSalt(saltRound)
    const hash = await bcrypt.hash(payload, salt)

    return hash
  }

  async createKey(
    userId: Types.ObjectId,
    refreshSecretKey: string,
    accessSecretKey: string,
    refreshToken: string
  ): Promise<any> {
    try {
      const filter = { user: userId }
      const update = {
        refreshSecretKey,
        accessSecretKey,
        refreshToken
      }
      const options = { upsert: true, new: true }

      const key = await this.keyModel.findOneAndUpdate(filter, update, options).lean()

      return key
    } catch (error) {
      throw new UnauthorizedException()
    }
  }
}
