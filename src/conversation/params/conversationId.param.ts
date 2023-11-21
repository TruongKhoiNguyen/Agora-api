import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, Validate } from 'class-validator'
import { IsObjectId } from 'src/decorators/isObjectId.validate'

export class ConversationIdParam {
  @ApiProperty()
  @IsNotEmpty()
  @Validate(IsObjectId)
  conversationId: string
}
