import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, MaxLength } from 'class-validator'

export class UpdateInfoConvDto {
  @ApiProperty()
  @MaxLength(50)
  @IsNotEmpty()
  name: string
}
