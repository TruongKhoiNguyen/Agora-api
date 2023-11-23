import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, Validate } from 'class-validator'
import { IsObjectId } from 'src/decorators/isObjectId.validate'

export class AddFrienDto {
  @ApiProperty()
  message: string

  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsObjectId)
  userId: string
}
