import * as path from 'path'
import * as fs from 'fs'

import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { v2 } from 'cloudinary'
import { CloudinaryResponse } from './cloudinary-response'

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    type: 'image-avt' | 'image-chat'
  ): Promise<CloudinaryResponse> {
    let folderPath = 'agora/images/avatars/'

    if (type === 'image-avt') {
      folderPath = 'agora/images/avatars/'
    } else {
      folderPath = 'agora/images/chats/'
    }

    try {
      const cloudFile = await v2.uploader.upload(file.path, {
        folder: folderPath,
        resource_type: 'auto'
      })
      if (cloudFile) {
        this.clearFile(file.path)
      }
      return cloudFile
    } catch (error) {
      throw new InternalServerErrorException("Couldn't upload file")
    }
  }

  async destroyFile(url: string, type: 'image-avt' | 'image-chat'): Promise<CloudinaryResponse> {
    // agora/images/avatars/ --> path in cloudiary folder
    let publish_id: string

    if (type === 'image-avt') {
      publish_id = 'agora/images/avatars/' + url.split('agora/images/avatars/')[1].split('.')[0]
    } else {
      publish_id = 'agora/images/chats/' + url.split('agora/images/chats/')[1].split('.')[0]
    }

    try {
      const response = await v2.uploader.destroy(publish_id)
      return response
    } catch (error) {
      throw new InternalServerErrorException("Couldn't remove file")
    }
  }

  public clearFile(filePath: string): boolean {
    filePath = path.join(__dirname, '..', '..', filePath)
    fs.unlink(filePath, err => {
      if (err) {
        return false
      }
    })

    return true
  }
}
