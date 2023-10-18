import { Controller, Get } from '@nestjs/common'
import { User } from './schemas/user.schema'
import { UserService } from './user.service'

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  //create route get all user with mongoose call service
  @Get()
  async getAllUser(): Promise<User[]> {
    return await this.userService.getAllUser()
  }
}
