import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Welcome to the Agora API! access to /api for more apis info. tks!!!'
    }
  }
}
