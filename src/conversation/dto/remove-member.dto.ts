import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, Validate } from 'class-validator'
import { IsObjectId } from 'src/decorators/isObjectId.validate'

export class RemoveMemberDto {
  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsObjectId)
  memberId: string
}
