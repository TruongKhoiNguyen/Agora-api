import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, Validate } from 'class-validator'
import { IsObjectId } from 'src/decorators/isObjectId.validate'

export class NewMessageDto {
  @ApiProperty()
  content: string

  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsObjectId)
  conversationId: string
}
