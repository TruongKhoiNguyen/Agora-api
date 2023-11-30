import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common'
import { UserService } from './user.service'
import { CloudinaryService, ImageType } from '../cloudinary/cloudinary.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { filterImageConfig, storageConfig } from '../configs/upload-file.config'
import { ApiTags } from '@nestjs/swagger'
import { GetUserRequest, Public } from 'src/auth/decorators'
import { UserDocument } from './schemas/user.schema'
import { AddFrienDto } from './dto/add-friend.dto'
import { FriendIdDto } from './dto/friend-id.dto'

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private cloudinaryService: CloudinaryService
  ) {}

  //create route get all user with mongoose call service
  @Get()
  async getAllUser(): Promise<any> {
    return await this.userService.getAllUser()
  }

  @Get('me')
  async getCurrUser(@GetUserRequest() user: UserDocument): Promise<any> {
    const userData = await this.userService.getCurrUser(user._id)

    return {
      success: true,
      message: 'Get user successfully',
      metadata: userData
    }
  }

  @Get('search')
  @Public(true)
  async search(@Query('keyword') query: string) {
    return {
      success: true,
      message: 'Get user successfully',
      metadata: await this.userService.search(query)
    }
  }

  @Post('upload-avt')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: storageConfig('avatars'),
      fileFilter: filterImageConfig()
    })
  )
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File): Promise<any> {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError)
    }

    if (!file) {
      throw new BadRequestException('File is required')
    }

    try {
      const cloudFile = await this.cloudinaryService.uploadFile(file, ImageType.AVATAR)

      if (req.user.avatar) {
        await this.cloudinaryService.destroyFile(req.user.avatar, ImageType.AVATAR)
      }

      await this.userService.updateAvatar(req.user._id, cloudFile.secure_url)

      return {
        success: true,
        message: 'Upload avatar successfully'
      }
    } catch (err) {
      throw new InternalServerErrorException('Error when upload file')
    }
  }

  @Post('add-friend')
  @UsePipes(ValidationPipe)
  async addFriend(@GetUserRequest() user: UserDocument, @Body() addFriendto: AddFrienDto) {
    await this.userService.addFriend(user, addFriendto)

    return {
      success: true,
      message: 'Add friend successfully'
    }
  }

  @Post('accept-friend')
  @UsePipes(ValidationPipe)
  async acceptFriend(@GetUserRequest() user: UserDocument, @Body() friendIdDto: FriendIdDto) {
    await this.userService.acceptFriend(user, friendIdDto)

    return {
      success: true,
      message: 'Accept friend successfully'
    }
  }

  @Post('reject-friend')
  @UsePipes(ValidationPipe)
  async rejectFriend(@GetUserRequest() user: UserDocument, @Body() friendIdDto: FriendIdDto) {
    await this.userService.rejectFriendRequest(user, friendIdDto)

    return {
      success: true,
      message: 'Reject friend successfully'
    }
  }

  @Post('cancel-friend')
  @UsePipes(ValidationPipe)
  async cancelFriendRequest(
    @GetUserRequest() user: UserDocument,
    @Body() friendIdDto: FriendIdDto
  ) {
    await this.userService.cancelFriendRequest(user, friendIdDto)

    return {
      success: true,
      message: 'Reject friend successfully'
    }
  }

  @Post('remove-friend')
  @UsePipes(ValidationPipe)
  async removeFriend(@GetUserRequest() user: UserDocument, @Body() friendIdDto: FriendIdDto) {
    await this.userService.removeFriend(user, friendIdDto)

    return {
      success: true,
      message: 'remove friend successfully'
    }
  }
}
