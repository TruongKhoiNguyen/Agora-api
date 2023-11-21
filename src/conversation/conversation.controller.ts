import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ConversationService } from './conversation.service'
import { UserDocument } from 'src/user/schemas/user.schema'
import { GetUserRequest } from 'src/auth/decorators'
import { FileInterceptor } from '@nestjs/platform-express'
import { filterImageConfig, storageConfig } from 'src/configs/upload-file.config'
import {
  AddAdminDto,
  AddMembersDto,
  CreateConvDto,
  RemoveMemberDto,
  UpdateInfoConvDto
} from './dto'

@ApiTags('Conversation')
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

  @Get(':id')
  async getConversationWithId(
    @GetUserRequest() user: UserDocument,
    @Param('id') conversationId: string
  ) {
    const conversation = await this.consversationService.getConversationWithId(
      user._id,
      conversationId
    )
    return {
      success: true,
      message: 'Conversation fetched successfully',
      metadata: conversation
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

  @Patch('update-thumb/:conversationId')
  @UseInterceptors(
    FileInterceptor('thumb', {
      storage: storageConfig('thumbs'),
      fileFilter: filterImageConfig()
    })
  )
  async uploadThumb(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File
  ): Promise<any> {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError)
    }

    if (!file) {
      throw new BadRequestException('File is required')
    }

    await this.consversationService.updateThumb(conversationId, req.user._id, file)

    return {
      success: true,
      message: 'Upload avatar successfully'
    }
  }

  @Patch('update-info/:conversationId')
  async updateInfo(
    @Param('conversationId') conversationId: string,
    @GetUserRequest() user: UserDocument,
    @Body() updateInfoConvDto: UpdateInfoConvDto
  ) {
    await this.consversationService.updateInfo(conversationId, user._id, updateInfoConvDto)
    return {
      success: true,
      message: 'Update info successfully'
    }
  }

  @Patch('add-members/:conversationId')
  async addMembers(
    @Param('conversationId') conversationId: string,
    @GetUserRequest() user: UserDocument,
    @Body() addMembersDto: AddMembersDto
  ) {
    await this.consversationService.addMembers(conversationId, user._id, addMembersDto.members)
    return {
      success: true,
      message: 'Add members successfully'
    }
  }

  @Patch('remove-member/:conversationId')
  async removeMembers(
    @Param('conversationId') conversationId: string,
    @GetUserRequest() user: UserDocument,
    @Body() removeMembersDto: RemoveMemberDto
  ) {
    await this.consversationService.removeMembers(
      conversationId,
      user._id,
      removeMembersDto.memberId
    )
    return {
      success: true,
      message: 'remove members successfully'
    }
  }

  @Patch('leave-conversation/:conversationId')
  async leaveConversation(
    @Param('conversationId') conversationId: string,
    @GetUserRequest() user: UserDocument
  ) {
    await this.consversationService.leaveConversation(conversationId, user._id)
    return {
      success: true,
      message: 'Leave conversation successfully'
    }
  }

  @Patch('add-admin/:conversationId')
  async addAdmins(
    @Param('conversationId') conversationId: string,
    @GetUserRequest() user: UserDocument,
    @Body() addAdminsDto: AddAdminDto
  ) {
    await this.consversationService.addAdmins(conversationId, user._id, addAdminsDto.memberId)
    return {
      success: true,
      message: 'Add admins successfully'
    }
  }
}
