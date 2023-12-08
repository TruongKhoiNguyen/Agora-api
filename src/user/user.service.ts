import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { BASIC_INFO_SELECT, User, UserDocument } from './schemas/user.schema'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { AddFrienDto } from './dto/add-friend.dto'
import { FriendTag, PusherService } from 'src/pusher/pusher.service'
import { FriendIdDto } from './dto/friend-id.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private pusherService: PusherService
  ) {}

  //get all user with mongoose
  async getAllUser(): Promise<any> {
    return await this.userModel.find()
  }

  async getCurrUser(userId: Types.ObjectId): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .populate('friends', BASIC_INFO_SELECT)
      .populate('friendRequests.sender', BASIC_INFO_SELECT)

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async updateAvatar(userId: Types.ObjectId, avatar: string): Promise<any> {
    return await this.userModel.updateOne({ _id: userId }, { avatar })
  }

  async search(query: string): Promise<any> {
    const promises = [
      this.userModel.find({
        $or: [
          {
            firstName: {
              $regex: query,
              $options: 'i'
            }
          }
        ]
      }),
      this.userModel.find({
        $or: [
          {
            email: {
              $regex: query,
              $options: 'i'
            }
          }
        ]
      })
    ]

    const result = await Promise.all(promises)

    return [...result[0], ...result[1]]
  }

  async addFriend(user: UserDocument, addFriendto: AddFrienDto) {
    const { userId: friendId, message } = addFriendto

    if (user._id.toString() === friendId) {
      throw new BadRequestException('Invalid input')
    }

    const friend = await this.userModel.findById(friendId)

    if (!friend) {
      throw new NotFoundException('user not found')
    }

    user.friends.map(item => {
      if (item['_id'].toString() === friendId) {
        console.log(item)
        throw new BadRequestException('Friend already exists')
      }
    })

    user.friendRequests.map(item => {
      if (item.sender.toString() === friendId) {
        throw new BadRequestException('Friend request is pending acceptance')
      }
    })

    friend.friendRequests.map(item => {
      if (item.sender.toString() === user._id.toString()) {
        throw new BadRequestException('Friend request already sent')
      }
    })

    const friendRequest = {
      sender: user._id,
      message: message ? message : undefined
    }

    await friend.updateOne({
      $push: {
        friendRequests: friendRequest
      }
    })

    // push event to friend
    this.pusherService.trigger(friendId, 'friend:request', {
      tag: FriendTag.ADD_FRIEND,
      friendRequest
    })

    return true
  }

  async acceptFriend(user: UserDocument, { userId: friendId }: FriendIdDto) {
    if (user._id.toString() === friendId) {
      throw new BadRequestException('Invalid input')
    }

    const friend = await this.userModel.findById(friendId)

    if (!friend) {
      throw new NotFoundException('user not found')
    }

    const friendRequest = user.friendRequests.find(item => item.sender.toString() === friendId)

    if (!friendRequest) {
      throw new BadRequestException('Friend request not found')
    }

    await user.updateOne({
      $push: {
        friends: friend._id
      },
      $pull: {
        friendRequests: {
          sender: friend._id
        }
      }
    })

    await friend.updateOne({
      $push: {
        friends: user._id
      }
    })

    // push event to friend
    this.pusherService.trigger(friendId, 'friend:request', {
      tag: FriendTag.ACCEPT_FRIEND_REQUEST,
      newFriend: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      }
    })

    return {
      _id: friend._id,
      firstName: friend.firstName,
      lastName: friend.lastName,
      avatar: friend.avatar
    }
  }

  async rejectFriendRequest(user: UserDocument, { userId: friendId }: FriendIdDto) {
    if (user._id.toString() === friendId) {
      throw new BadRequestException('Invalid input')
    }

    const friendRequest = user.friendRequests.find(item => item.sender.toString() === friendId)

    if (!friendRequest) {
      throw new BadRequestException('Friend request not found')
    }

    await user.updateOne({
      $pull: {
        friendRequests: {
          sender: new Types.ObjectId(friendId)
        }
      }
    })

    return true
  }

  async cancelFriendRequest(user: UserDocument, { userId: friendId }: FriendIdDto) {
    if (user._id.toString() === friendId) {
      throw new BadRequestException('Invalid input')
    }

    const friend = await this.userModel.findById(friendId)

    if (!friend) {
      throw new NotFoundException('user not found')
    }

    const friendRequest = friend.friendRequests.find(
      item => item.sender.toString() === user._id.toString()
    )

    if (!friendRequest) {
      throw new BadRequestException('Friend request not found')
    }

    await friend.updateOne({
      $pull: {
        friendRequests: {
          sender: user._id
        }
      }
    })

    this.pusherService.trigger(friendId, 'friend:request', {
      tag: FriendTag.CANCEL_FRIEND_REQUEST,
      friendId: user._id
    })

    return true
  }

  async removeFriend(user: UserDocument, { userId: friendId }: FriendIdDto) {
    if (user._id.toString() === friendId) {
      throw new BadRequestException('Invalid input')
    }

    const friend = await this.userModel.findById(friendId)

    if (!friend) {
      throw new NotFoundException('user not found')
    }

    const isFriend = user.friends.find(item => item['_id'].toString() === friendId)
    if (!isFriend) {
      throw new BadRequestException('Not friend')
    }

    await user.updateOne({
      $pull: {
        friends: friend._id
      }
    })

    await friend.updateOne({
      $pull: {
        friends: user._id
      }
    })

    return true
  }
}
