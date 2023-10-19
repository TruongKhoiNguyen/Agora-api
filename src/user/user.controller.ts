import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Req,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { UserService } from './user.service'
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { filterImageConfig, storageConfig } from '../helpers/upload-file.config'

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
      const cloudFile = await this.cloudinaryService.uploadFile(file, 'image-avt')

      if (req.user.avatar) {
        await this.cloudinaryService.destroyFile(req.user.avatar, 'image-avt')
      }

      await this.userService.updateAvatar(req.user._id, cloudFile.url)

      return {
        success: true,
        message: 'Upload avatar successfully'
      }
    } catch (err) {
      throw new InternalServerErrorException('Error when upload file')
    }
  }
}
