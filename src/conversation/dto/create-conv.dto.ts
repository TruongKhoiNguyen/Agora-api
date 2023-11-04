import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, MaxLength } from 'class-validator'

export class CreateConvDto {
  @ApiProperty()
  @MaxLength(50)
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsNotEmpty()
  isGroup: boolean

  @ApiProperty()
  @IsNotEmpty()
  members: string[]
}
