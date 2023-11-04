import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ConversationService } from './conversation.service'
import { CreateConvDto } from './dto/create-conv.dto'
import { UserDocument } from 'src/user/schemas/user.schema'
import { GetUserRequest } from 'src/auth/decorators'

@ApiTags('conversation')
@Controller('conversations')
export class ConversationController {
  constructor(private consversationService: ConversationService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async createConversation(
    @GetUserRequest() user: UserDocument,
    @Body() createConvDto: CreateConvDto
  ) {
    const result = await this.consversationService.createConversation(user, createConvDto)
    return {
      success: true,
      message: 'Conversation created successfully',
      metadata: result
    }
  }

  @Get()
  async getConversationWithUserId(@GetUserRequest() user: UserDocument) {
    const conversations = await this.consversationService.getConversationWithUserId(user._id)
    return {
      success: true,
      message: 'Conversation fetched successfully',
      metadata: conversations
    }
  }

  @Post('seen/:conversationId')
  async seenConversation(
    @GetUserRequest() user: UserDocument,
    @Param('conversationId') conversationId: string
  ) {
    await this.consversationService.seenConversation(user._id, conversationId)
    return {
      success: true,
      message: 'Conversation seen'
    }
  }
}
