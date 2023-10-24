import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { Public } from './auth/decorators'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public(true)
  getHello() {
    return this.appService.getHello()
  }
}
