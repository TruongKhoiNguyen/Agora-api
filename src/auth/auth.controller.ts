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
import { GetUserRequest, Public } from './decorators'
import { UserDocument } from 'src/user/schemas/user.schema'

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
  async refreshToken(
    @GetUserRequest() user: UserDocument
    // @Body('refreshToken') refreshToken: string
  ) {
    try {
      const token = await this.authService.refreshToken(user)
      // const token = await this.authService.refreshToken(refreshToken)
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
