import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetUserRequest } from 'src/auth/decorators'
import { UserDocument } from 'src/user/schemas/user.schema'
import { NewMessageDto } from './dto/new-message.dto'
import { MessageService } from './message.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { filterImageConfig, storageConfig } from 'src/configs/upload-file.config'
import { CloudinaryService, ImageType } from 'src/cloudinary/cloudinary.service'
import { CloudinaryResponse } from 'src/cloudinary/cloudinary-response'
import { ConversationIdParam } from 'src/conversation/params/conversationId.param'
import { MessageTypes } from './schemas/message.schema'

@ApiTags('Message')
@Controller('messages')
export class MessageController {
  constructor(
    private cloudinaryService: CloudinaryService,
    private messageService: MessageService
  ) {}

  @Post()
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FilesInterceptor('chats', 5, {
      storage: storageConfig('chats'),
      fileFilter: filterImageConfig(1024 * 1024 * 20)
    })
  )
  async newMessage(
    @Req() req: any,
    @GetUserRequest() user: UserDocument,
    @Body() newMessageDto: NewMessageDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError)
    }

    let newMessage

    if (files) {
      const uploadFilePromises = files.map(file => {
        return this.cloudinaryService.uploadFile(file, ImageType.CHAT)
      })

      const cloudImages = await Promise.all(uploadFilePromises)
      const imageUrls = cloudImages.map((image: CloudinaryResponse) => image.secure_url)

      newMessage = await this.messageService.createMessage(
        user._id,
        newMessageDto,
        imageUrls,
        MessageTypes.IMAGE
      )
    } else {
      newMessage = await this.messageService.createMessage(user._id, newMessageDto)
    }

    return {
      success: true,
      message: 'Message sent successfully',
      metadata: newMessage
    }
  }

  @Post('typing')
  async typingMessage(
    @GetUserRequest() user: UserDocument,
    @Body() { conversationId }: { conversationId: string }
  ) {
    await this.messageService.typingMessage(user._id, conversationId)
    return {
      success: true,
      message: 'Typingggg'
    }
  }

  @Get('all/:conversationId')
  @UsePipes(ValidationPipe)
  async getAllMessages(
    @GetUserRequest() user: UserDocument,
    @Param() convIdParam: ConversationIdParam
  ) {
    const messages = await this.messageService.getAllMessages(user._id, convIdParam.conversationId)
    return {
      success: true,
      message: 'Messages fetched successfully',
      metadata: messages
    }
  }

  @Get(':conversationId')
  @UsePipes(ValidationPipe)
  async getMessages(
    @Query('next') next: string,
    @Query('limit') limit: string,
    @GetUserRequest() user: UserDocument,
    @Param() convIdParam: ConversationIdParam
  ) {
    const messages = await this.messageService.getMessages(
      user._id,
      convIdParam.conversationId,
      next,
      limit ? parseInt(limit) : 10
    )
    return {
      success: true,
      message: 'Messages fetched successfully',
      metadata: messages
    }
  }

  @Get('image/:conversationId')
  async getMessagesWithImage(
    @GetUserRequest() user: UserDocument,
    @Query('messid') messageId: string,
    @Query('range') range: string,
    @Param() convIdParam: ConversationIdParam
  ) {
    const messages = await this.messageService.getMessagesRange(
      user._id,
      messageId,
      convIdParam.conversationId,
      range ? parseInt(range) : 25
    )

    return {
      success: true,
      message: 'Messages fetched successfully',
      metadata: messages
    }
  }

  @Get('search/content/:conversationId')
  async search(
    @Query('keyword') query: string,
    @GetUserRequest() user: UserDocument,
    @Param() convIdParam: ConversationIdParam,
    @Query('range') range: string,
    @Query('next') next: string
  ) {
    return {
      success: true,
      message: 'Search message successfully',
      metadata: await this.messageService.search(
        user._id,
        query,
        convIdParam.conversationId,
        next,
        range ? parseInt(range) : 25
      )
    }
  }
}
