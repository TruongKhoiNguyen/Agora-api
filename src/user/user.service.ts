import { Injectable } from '@nestjs/common'
import { User } from './schemas/user.schema'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  //get all user with mongoose
  async getAllUser(): Promise<any> {
    return await this.userModel.find()
  }

  async updateAvatar(userId: Types.ObjectId, avatar: string): Promise<any> {
    return await this.userModel.updateOne({ _id: userId }, { avatar })
  }
}
