import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNotEmpty, Validate } from 'class-validator'
import { IsObjectId } from 'src/decorators/isObjectId.validate'

export class AddMembersDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  @Validate(IsObjectId, { each: true })
  members: string[]
}
