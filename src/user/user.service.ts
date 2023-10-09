import { Injectable } from '@nestjs/common'
import { User } from './schemas/user.schema'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  //get all user with mongoose
  async getAllUser(): Promise<User[]> {
    return await this.userModel.find()
  }
}
