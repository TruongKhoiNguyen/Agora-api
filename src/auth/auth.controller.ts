import { AuthService } from './auth.service'
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { LoginDto, RegisterDto } from './dto'
import { Public } from './decorators'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    try {
      const token = await this.authService.refreshToken(refreshToken)
      return {
        success: true,
        message: 'refresh token success!!',
        metadata: token
      }
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }
}
