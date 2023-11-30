import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class ForgotPassDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string
}
