import { ApiProperty } from '@nestjs/swagger'
import { IsEmail } from 'class-validator'

export class ForgotPassDto {
  @ApiProperty()
  @IsEmail()
  email: string
}
