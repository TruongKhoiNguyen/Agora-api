import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNotEmpty, MaxLength, Validate } from 'class-validator'
import { IsObjectId } from 'src/decorators/isObjectId.validate'

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
  @IsArray()
  @Validate(IsObjectId, { each: true })
  members: string[]
}
