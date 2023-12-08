import * as path from 'path'
import * as fs from 'fs'

import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { v2 } from 'cloudinary'
import { CloudinaryResponse } from './cloudinary-response'

export enum ImageType {
  AVATAR = 'avatars',
  CHAT = 'chats',
  THUMB = 'thumbs'
}

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File, type: ImageType): Promise<CloudinaryResponse> {
    const folderPath = `agora/images/${type}/`

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
      throw new InternalServerErrorException('Could not upload file')
    }
  }

  async destroyFile(url: string, type: ImageType): Promise<CloudinaryResponse> {
    // agora/images/avatars/ --> path in cloudiary folder
    const publish_id: string =
      `agora/images/${type}/` + url.split(`agora/images/${type}/`)[1].split('.')[0]

    try {
      const response = await v2.uploader.destroy(publish_id)
      return response
    } catch (error) {
      throw new InternalServerErrorException('Could not remove file')
    }
  }

  public clearFile(filePath: string): boolean {
    filePath = path.join(__dirname, '..', '..', filePath)
    fs.unlink(filePath, err => {
      console.log(err)
    })

    return true
  }
}
