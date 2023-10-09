import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

import { User, UserDocument } from 'src/user/schemas/user.schema'
import { LoginDto, RegisterDto } from './dto'
import { Key } from 'src/user/schemas/key.schema'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Key.name) private keyModel: Model<Key>,
    private jwtSercive: JwtService,
    private configService: ConfigService
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    const user = await this.userModel.findOne({ email: registerDto.email }).lean()

    if (user) {
      throw new HttpException('Email already have an account', HttpStatus.BAD_REQUEST)
    }

    const hashPassword = await this.hashPassword(registerDto.password)

    return await this.userModel.create({
      ...registerDto,
      password: hashPassword
    })
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

  async refreshToken(user: UserDocument): Promise<any> {
    const key = await this.keyModel.findOne({ user: user._id }).lean()
    const token = await this.generateToken(
      { id: user._id, email: user.email },
      key.refreshSecretKey,
      key.accessSecretKey
    )
    await this.keyModel.updateOne(key, { refreshToken: token.refreshToken })

    return {
      token
    }
  }

  // async refreshToken(refreshToken: string): Promise<any> {
  //   console.log('authService:::refreshToken', refreshToken)
  //   const foundToken = await this.keyModel.findOne({ refreshTokenUseds: refreshToken })
  //   console.log('authService:::foundToken', foundToken)
  //   // token is used
  //   if (foundToken) {
  //     const { id, email } = await this.jwtSercive.verify(refreshToken, {
  //       secret: foundToken.refreshSecretKey
  //     })
  //     console.log('bad-refresh:::\n', { id, email })
  //     const result = await this.keyModel.deleteOne({ user: foundToken.user })
  //     console.log(result)
  //     throw new ForbiddenException('Something wrong happened!! Pls login again tks!')
  //   }

  //   const key = await this.keyModel.findOne({ refreshToken }).lean()
  //   console.log('authService:::key', key)

  //   const { id, email } = await this.jwtSercive.verify(refreshToken, {
  //     secret: key.refreshSecretKey
  //   })

  //   const foundUser = await this.userModel.findOne({ email }).lean()
  //   if (!foundUser) {
  //     throw new UnauthorizedException('User not registered')
  //   }

  //   const token = await this.generateToken({ id, email }, key.accessSecretKey, key.refreshSecretKey)

  //   await this.keyModel.updateOne(key, {
  //     $set: {
  //       refreshToken: token.refreshToken
  //     },
  //     $addToSet: {
  //       refreshTokenUseds: refreshToken
  //     }
  //   })

  //   return {
  //     token
  //   }
  // }

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

  private async hashPassword(password: string): Promise<string> {
    const saltRound = 10
    const salt = await bcrypt.genSalt(saltRound)
    const hash = await bcrypt.hash(password, salt)

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
