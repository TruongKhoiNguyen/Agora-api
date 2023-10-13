import { MailerService } from '@nest-modules/mailer'
import { AuthService } from './auth.service'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { ForgotPassDto, LoginDto, RefreshDto, RegisterDto, ResetPassDto } from './dto'
import { Public } from './decorators'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private mailerService: MailerService
  ) {}

  @Public(true)
  @Post('register')
  @UsePipes(ValidationPipe)
  async register(@Body() registerDto: RegisterDto) {
    try {
      await this.authService.register(registerDto)

      return {
        success: true,
        message: 'Register account success!!'
      }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  @Public(true)
  @Post('login')
  @UsePipes(ValidationPipe)
  async login(@Body() loginDto: LoginDto) {
    try {
      const token = await this.authService.login(loginDto)
      return {
        success: true,
        message: 'Login account success!!',
        metadata: token
      }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  @Post('refresh')
  @UsePipes(ValidationPipe)
  async refreshToken(@Body() refreshDto: RefreshDto) {
    try {
      const token = await this.authService.refreshToken(refreshDto)
      return {
        success: true,
        message: 'refresh token success!!',
        metadata: token
      }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  @Get('verify')
  @Public(true)
  @ApiQuery({ name: 'userid', required: true })
  @ApiQuery({ name: 'token', required: true })
  async verifyAccount(@Query('userid') userid: string, @Query('token') token: string) {
    console.log(userid, token)
    try {
      await this.authService.verifyAccount(userid, token)
      return {
        success: true,
        message: 'verify account success!!'
      }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  @Post('forgot-password')
  @Public(true)
  @UsePipes(ValidationPipe)
  async forgotPassword(@Body() forgotPassDto: ForgotPassDto) {
    try {
      await this.authService.forgotPassword(forgotPassDto)
      return {
        success: true,
        message: 'Check your email to reset password!!'
      }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }

  @Post('reset-password')
  @Public(true)
  @ApiQuery({ name: 'token', required: true })
  @UsePipes(ValidationPipe)
  async resetPassword(@Body() resetPassDto: ResetPassDto, @Query('token') token: string) {
    try {
      await this.authService.resetPassword(resetPassDto, token)
      return {
        success: true,
        message: 'Reset password success!!'
      }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }
}
