/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

describe('AuthController', () => {
  let controller: AuthController

  const mockAuthService = {
    register: jest.fn(dto => {
      return {
        _id: 'objectid',
        ...dto
      }
    }),
    login: jest.fn(dto => {
      return {
        token: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        },
        userId: 'objectid'
      }
    }),
    refreshToken: jest.fn(refreshToken => {
      return {
        token: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      }
    }),
    verifyAccount: jest.fn(token => {
      return {}
    }),
    forgotPassword: jest.fn(email => {
      return {}
    }),
    resetPassword: jest.fn(dto => {
      return {}
    })
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService]
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile()

    controller = app.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should register user success', async () => {
    const dto = {
      firstName: 'test',
      lastName: 'test',
      email: 'test@gmail.com',
      password: '123456'
    }
    expect(await controller.register(dto)).toEqual({
      success: true,
      message: 'Register account success!!'
    })
  })

  it('should login user success', async () => {
    const dto = {
      email: 'test@gmail.com',
      password: '123456'
    }

    expect(await controller.login(dto)).toEqual({
      success: true,
      message: 'Login account success!!',
      metadata: {
        token: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        },
        userId: 'objectid'
      }
    })
  })

  it('should refresh token success', async () => {
    expect(await controller.refreshToken({ refreshToken: 'refresh-token' })).toEqual({
      success: true,
      message: 'refresh token success!!',
      metadata: {
        token: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      }
    })
  })

  it('should verify success', async () => {
    expect(await controller.verifyAccount('objectid', 'token')).toEqual({
      success: true,
      message: 'Verify account success!!'
    })
  })

  it('should forgot password success', async () => {
    expect(await controller.forgotPassword({ email: 'test@gmail.com' })).toEqual({
      success: true,
      message: 'Check your email to reset password!!'
    })
  })

  it('should reset password success', async () => {
    expect(await controller.resetPassword({ password: 'test@gmail.com' }, 'token')).toEqual({
      success: true,
      message: 'Reset password success!!'
    })
  })
})
