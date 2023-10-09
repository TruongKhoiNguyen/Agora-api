import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @MinLength(6)
  password: string
}
