import { Status } from './../user/schemas/user.schema'
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

import { User } from 'src/user/schemas/user.schema'
import { ForgotPassDto, LoginDto, RefreshDto, RegisterDto, ResetPassDto } from './dto'
import { Key } from 'src/user/schemas/key.schema'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Key.name) private keyModel: Model<Key>,
    private jwtSercive: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    const user = await this.userModel.findOne({ email: registerDto.email }).lean()

    if (user) {
      throw new HttpException('Email already have an account', HttpStatus.BAD_REQUEST)
    }

    const hashPassword = await this.bcrypHash(registerDto.password)

    const newUser = await this.userModel.create({
      ...registerDto,
      password: hashPassword
    })

    if (newUser) {
      const hashed = await this.bcrypHash(newUser._id.toString())
      await this.mailerService.sendMail({
        to: registerDto.email,
        subject: 'Welcome to Agora',
        template: './verify',
        context: {
          name: registerDto.firstName,
          verifyUrl: `http://${this.configService.get<string>(
            'APP_HOST'
          )}:${this.configService.get<string>(
            'APP_PORT'
          )}/api/v1/auth/verify?userid=${newUser._id.toString()}&token=${hashed}`
        }
      })
    }

    return newUser
  }

  async login(loginDto: LoginDto): Promise<any> {
    // check email
    const user = await this.userModel.findOne({ email: loginDto.email }).select('+password').lean()

    if (!user) {
      throw new HttpException('Email is not registred.', HttpStatus.BAD_REQUEST)
    }

    // match password
    const checkPass = bcrypt.compareSync(loginDto.password, user.password)
    if (!checkPass) {
      throw new HttpException('Password is not correct', HttpStatus.UNAUTHORIZED)
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
      token
    }
  }

  async verifyAccount(userid: string, token: string) {
    const checked = await bcrypt.compare(userid, token)

    if (!checked) {
      throw new BadRequestException('Verify account failed')
    }

    const user = await this.userModel.findById(new Types.ObjectId(userid)).lean()

    return await this.userModel.updateOne(user, {
      $set: {
        status: Status.ACTIVE
      }
    })
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

    const foundUser = await this.userModel.findOne({ email }).lean()
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
    return await this.mailerService.sendMail({
      to: user.email,
      subject: 'Agora reset password',
      template: './reset-password',
      context: {
        name: user.firstName,
        resetPassUrl: `http://${this.configService.get<string>(
          'APP_HOST'
        )}:${this.configService.get<string>('APP_PORT')}/api/v1/auth/reset-password?token=${token}`
      }
    })
  }

  async resetPassword(resetPassDto: ResetPassDto, token: string) {
    const { id } = await this.jwtSercive.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET')
    })

    const user = await this.userModel.findById(new Types.ObjectId(id)).lean()

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token')
    }

    const hashPassword = await this.bcrypHash(resetPassDto.password)

    return await this.userModel.updateOne(user, {
      $set: {
        password: hashPassword
      }
    })
  }

  public async generateToken(
    payload: { id: Types.ObjectId; email: string },
    refreshSecretKey: string,
    accessSecretKey: string
  ) {
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

  private async bcrypHash(payload: string): Promise<string> {
    const saltRound = 10
    const salt = await bcrypt.genSalt(saltRound)
    const hash = await bcrypt.hash(payload, salt)

    return hash
  }

  private async createKey(
    userId: Types.ObjectId,
    refreshSecretKey: string,
    accessSecretKey: string,
    refreshToken: string
  ) {
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
