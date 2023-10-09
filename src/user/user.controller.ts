import { Controller, Get, Req } from '@nestjs/common'
import { User } from './schemas/user.schema'
import { UserService } from './user.service'

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  //create route get all user with mongoose call service
  @Get()
  async getAllUser(@Req() req: any): Promise<User[]> {
    console.log(req.user)
    return await this.userService.getAllUser()
  }
}
