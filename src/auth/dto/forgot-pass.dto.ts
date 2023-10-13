import { ApiProperty } from '@nestjs/swagger'
import { MinLength } from 'class-validator'

export class ResetPassDto {
  @ApiProperty()
  @MinLength(6)
  password: string
}
