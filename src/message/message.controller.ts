import {
  Body,
  Controller,
  Post,
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
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { CloudinaryResponse } from 'src/cloudinary/cloudinary-response'

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
      fileFilter: filterImageConfig()
    })
  )
  async newMessage(
    @GetUserRequest() user: UserDocument,
    @Body() newMessageDto: NewMessageDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    let newMessage
    if (files) {
      console.log(files)
      const uploadFilePromises = files.map(file => {
        return this.cloudinaryService.uploadFile(file, 'image-chat')
      })

      const cloudImages = await Promise.all(uploadFilePromises)
      const imageUrls = cloudImages.map((image: CloudinaryResponse) => image.secure_url)

      newMessage = await this.messageService.createMessage(user._id, newMessageDto, imageUrls)
    } else {
      newMessage = await this.messageService.createMessage(user._id, newMessageDto)
    }
    return {
      success: true,
      message: 'Message sent successfully',
      metadata: newMessage
    }
  }
}
