import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { ConversationIdParam } from './params/conversationId.param'

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
    const result = await this.consversationService.createConversation(user._id, createConvDto)
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

  @Get(':conversationId')
  @UsePipes(ValidationPipe)
  async getConversationWithId(
    @GetUserRequest() user: UserDocument,
    @Param() convIdParam: ConversationIdParam
  ) {
    const conversation = await this.consversationService.getConversationWithId(
      user._id,
      convIdParam.conversationId
    )
    return {
      success: true,
      message: 'Conversation fetched successfully',
      metadata: conversation
    }
  }

  @Post('seen/:conversationId')
  @UsePipes(ValidationPipe)
  async seenConversation(
    @GetUserRequest() user: UserDocument,
    @Param() convIdParam: ConversationIdParam
  ) {
    await this.consversationService.seenConversation(user._id, convIdParam.conversationId)
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
  @UsePipes(ValidationPipe)
  async uploadThumb(
    @Param() convIdParam: ConversationIdParam,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File
  ): Promise<any> {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError)
    }

    if (!file) {
      throw new BadRequestException('File is required')
    }

    await this.consversationService.updateThumb(convIdParam.conversationId, req.user._id, file)

    return {
      success: true,
      message: 'Upload avatar successfully'
    }
  }

  @Patch('update-info/:conversationId')
  @UsePipes(ValidationPipe)
  async updateInfo(
    @Param() convIdParam: ConversationIdParam,
    @GetUserRequest() user: UserDocument,
    @Body() updateInfoConvDto: UpdateInfoConvDto
  ) {
    await this.consversationService.updateInfo(
      convIdParam.conversationId,
      user._id,
      updateInfoConvDto
    )
    return {
      success: true,
      message: 'Update info successfully'
    }
  }

  @Patch('add-members/:conversationId')
  @UsePipes(ValidationPipe)
  async addMembers(
    @Param() convIdParam: ConversationIdParam,
    @GetUserRequest() user: UserDocument,
    @Body() addMembersDto: AddMembersDto
  ) {
    await this.consversationService.addMembers(
      convIdParam.conversationId,
      user._id,
      addMembersDto.members
    )
    return {
      success: true,
      message: 'Add members successfully'
    }
  }

  @Patch('remove-member/:conversationId')
  @UsePipes(ValidationPipe)
  async removeMembers(
    @Param() convIdParam: ConversationIdParam,
    @GetUserRequest() user: UserDocument,
    @Body() removeMembersDto: RemoveMemberDto
  ) {
    await this.consversationService.removeMembers(
      convIdParam.conversationId,
      user._id,
      removeMembersDto.memberId
    )
    return {
      success: true,
      message: 'Remove members successfully'
    }
  }

  @Patch('leave-conversation/:conversationId')
  @UsePipes(ValidationPipe)
  async leaveConversation(
    @Param() convIdParam: ConversationIdParam,
    @GetUserRequest() user: UserDocument
  ) {
    await this.consversationService.leaveConversation(convIdParam.conversationId, user._id)
    return {
      success: true,
      message: 'Leave conversation successfully'
    }
  }

  @Patch('add-admin/:conversationId')
  @UsePipes(ValidationPipe)
  async addAdmins(
    @Param() convIdParam: ConversationIdParam,
    @GetUserRequest() user: UserDocument,
    @Body() addAdminsDto: AddAdminDto
  ) {
    await this.consversationService.addAdmins(
      convIdParam.conversationId,
      user._id,
      addAdminsDto.memberId
    )
    return {
      success: true,
      message: 'Add admins successfully'
    }
  }

  @Get('images/:conversationId')
  @UsePipes(ValidationPipe)
  async getAllImages(
    @Param() convIdParam: ConversationIdParam,
    @GetUserRequest() user: UserDocument
  ) {
    const images = await this.consversationService.getAllImages(
      convIdParam.conversationId,
      user._id
    )
    return {
      success: true,
      message: 'Get all images successfully',
      metadata: images
    }
  }

  @Get('links/:conversationId')
  @UsePipes(ValidationPipe)
  async getAllLinks(
    @Param() convIdParam: ConversationIdParam,
    @GetUserRequest() user: UserDocument
  ) {
    const links = await this.consversationService.getAllLinks(convIdParam.conversationId, user._id)
    return {
      success: true,
      message: 'Get all links successfully',
      metadata: links
    }
  }

  @Get('search/name')
  async search(@Query('keyword') query: string, @GetUserRequest() user: UserDocument) {
    return {
      success: true,
      message: "Search user's conversation successfully",
      metadata: await this.consversationService.search(user._id, query)
    }
  }

  @Get('not-seen/message')
  async getNotSeenMessage(@GetUserRequest() user: UserDocument) {
    return {
      success: true,
      message: 'Get not seen message successfully',
      metadata: await this.consversationService.getNotSeenMessage(user._id)
    }
  }
}
