import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, MinLength } from 'class-validator'

export class ResetPassDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  password: string
}
