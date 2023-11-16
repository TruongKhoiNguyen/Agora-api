/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { getModelToken } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { MailerService } from '@nest-modules/mailer'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { LoginDto } from './dto'
import { Types } from 'mongoose'
import { PusherService } from 'src/pusher/pusher.service'
import { NotFoundError } from 'rxjs'

describe('AuthService', () => {
  let service: AuthService

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    findById: jest.fn()
  }
  const mockKeyModel = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn()
  }
  const mockJwtService = {
    verify: jest.fn(),
    signAsync: jest.fn(),
    sign: jest.fn()
  }
  const mockMailerService = {
    sendMail: jest.fn(() => {
      return {}
    })
  }
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'APP_HOST') {
        return 'localhost'
      }
      if (key === 'APP_PORT') {
        return '3000'
      }
    })
  }
  const mockUserData = {
    firstName: 'test',
    lastName: 'test',
    email: 'test@gmail.com',
    password: '123456'
  }

  const mockPusherService = {}

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel
        },
        {
          provide: getModelToken('Key'),
          useValue: mockKeyModel
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: MailerService,
          useValue: mockMailerService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: PusherService,
          useValue: mockPusherService
        }
      ]
    }).compile()

    service = app.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // test register
  describe('Register account', () => {
    it('should register user success', async () => {
      jest.spyOn(mockUserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      })
      jest.spyOn(mockUserModel, 'create').mockReturnValue(
        Promise.resolve({
          _id: 'objectid',
          ...mockUserData
        })
      )
      expect(await service.register(mockUserData)).toEqual({
        _id: 'objectid',
        ...mockUserData
      })
    })

    it('email already have an account', async () => {
      jest.spyOn(mockUserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserData)
      })

      await expect(service.register(mockUserData)).rejects.toThrow('Email already have an account')
    })
  })

  let dto: LoginDto
  // test login
  describe('Login', () => {
    beforeEach(() => {
      dto = {
        email: 'test@gmail.com',
        password: '123456'
      }
      jest.spyOn(service, 'generateToken').mockResolvedValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      })

      jest.spyOn(service, 'createKey').mockResolvedValue(true)
    })

    it('should login user success', async () => {
      jest.spyOn(mockUserModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: 'objectid',
            ...mockUserData,
            password: bcrypt.hashSync('123456', 10)
          })
        })
      })

      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true)

      const result = await service.login(dto)
      expect(result).toEqual({
        token: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token'
        },
        userId: 'objectid'
      })
    })

    it('should be thorw email not registered', async () => {
      jest.spyOn(mockUserModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null)
        })
      })

      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true)

      try {
        const result = await service.login(dto)
        expect(result).toEqual({
          token: {
            accessToken: 'access_token',
            refreshToken: 'refresh_token'
          },
          userId: 'objectid'
        })
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException)
      }
    })

    it('password should not match', async () => {
      jest.spyOn(mockUserModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUserData)
        })
      })

      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false)

      await expect(service.login(dto)).rejects.toThrow('Password is not correct')
    })
  })

  //test verify account
  describe('Verify account', () => {
    it('should verify success', async () => {
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true)

      jest.spyOn(mockUserModel, 'updateOne').mockResolvedValue({
        acknowledged: true,
        modifiedCount: 1
      })

      const result = await service.verifyAccount('objectid', 'token')

      expect(result).toEqual({
        acknowledged: true,
        modifiedCount: 1
      })
    })

    it('should verify failed', async () => {
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false)

      jest.spyOn(mockUserModel, 'updateOne').mockResolvedValue({
        acknowledged: true,
        modifiedCount: 1
      })

      try {
        await service.verifyAccount('objectid', 'token')
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException)
      }
    })
  })

  // test refresh token
  const mockKeyTokenData = {
    _id: 'objectid',
    accessSecretKey: 'access_secret_key',
    refreshSecretKey: 'refresh_secret_key',
    refreshToken: 'refresh_token',
    refreshTokenUseds: ['refresh_token_old']
  }
  describe('Refresh token', () => {
    it('should refresh token success', async () => {
      jest.spyOn(mockKeyModel, 'findOne').mockResolvedValueOnce(null)
      jest.spyOn(mockKeyModel, 'findOne').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockKeyTokenData)
      })

      jest.spyOn(mockJwtService, 'verify').mockResolvedValue({
        id: 'objectid',
        email: 'test@gmail.com'
      })

      jest.spyOn(mockUserModel, 'findOne').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({
          _id: 'objectid',
          ...mockUserData
        })
      })

      jest.spyOn(mockJwtService, 'signAsync').mockResolvedValueOnce('access_token')
      jest.spyOn(mockJwtService, 'signAsync').mockResolvedValueOnce('refresh_token')

      jest.spyOn(mockKeyModel, 'updateOne').mockResolvedValue({
        acknowledged: true,
        modifiedCount: 1
      })
      expect(await service.refreshToken({ refreshToken: 'refresh_token' })).toMatchObject({
        token: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token'
        }
      })
    })

    it('token is used', async () => {
      jest.spyOn(mockKeyModel, 'findOne').mockResolvedValueOnce({ user: 'test' })
      jest.spyOn(mockJwtService, 'verify').mockResolvedValue({
        id: 'objectid',
        email: 'test@gmail.com'
      })
      jest.spyOn(mockKeyModel, 'deleteOne').mockResolvedValueOnce(null)

      await expect(service.refreshToken({ refreshToken: 'refresh_token' })).rejects.toThrow(
        'Something wrong happened!! Pls login again tks!'
      )
    })

    it('user is not registered', async () => {
      jest.spyOn(mockKeyModel, 'findOne').mockResolvedValueOnce(null)
      jest.spyOn(mockKeyModel, 'findOne').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(mockKeyTokenData)
      })

      jest.spyOn(mockJwtService, 'verify').mockResolvedValue({
        id: 'objectid',
        email: 'test@gmail.com'
      })

      jest.spyOn(mockUserModel, 'findOne').mockReturnValueOnce(null)

      await expect(service.refreshToken({ refreshToken: 'refresh_token' })).rejects.toThrow(
        'User not registered'
      )
    })
  })

  // test forgot password
  describe('Forgot password', () => {
    it('should forgot password success', async () => {
      jest.spyOn(mockJwtService, 'sign').mockReturnValue('reset_password_token')
      jest.spyOn(mockUserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'objectid',
          ...mockUserData
        })
      })
      expect(await service.forgotPassword({ email: 'test@gmail.com' })).toEqual(true)
    })

    it('user not found', async () => {
      jest.spyOn(mockUserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      })

      await expect(service.forgotPassword({ email: 'test@gmail.com' })).rejects.toThrow(
        'Email not registered!!!'
      )
    })
  })

  // test reset password
  describe('Reset password', () => {
    it('should reset password success', async () => {
      jest.spyOn(mockJwtService, 'verify').mockResolvedValue({
        id: '652276aa4268d57ef67b9d7b'
      })

      jest.spyOn(mockUserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: '652276aa4268d57ef67b9d7b',
          ...mockUserData
        })
      })

      jest.spyOn(service, 'bcryptHash').mockResolvedValue('hash_password')

      jest.spyOn(mockUserModel, 'updateOne').mockResolvedValue({
        acknowledged: true,
        modifiedCount: 1
      })

      const result = await service.resetPassword({ password: '123456' }, 'reset_password_token')
      expect(result).toEqual({
        acknowledged: true,
        modifiedCount: 1
      })
    })

    it('invalid or expired reset token', async () => {
      jest.spyOn(mockJwtService, 'verify').mockResolvedValue({
        id: '652276aa4268d57ef67b9d7b'
      })

      jest.spyOn(mockUserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      })

      await expect(
        service.resetPassword({ password: '123456' }, 'reset_password_token')
      ).rejects.toThrow('Invalid or expired password reset token')
    })
  })

  // test generate token
  describe('Generate token', () => {
    jest.spyOn(mockJwtService, 'signAsync').mockResolvedValueOnce('access_token')
    jest.spyOn(mockJwtService, 'signAsync').mockResolvedValueOnce('refresh_token')

    it('should generate token success', async () => {
      expect(
        await service.generateToken(
          { id: new Types.ObjectId('652276aa4268d57ef67b9d7b'), email: 'test@gmail.com' },
          'access_sercet',
          'refresh_secret'
        )
      ).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      })
    })
  })
})
