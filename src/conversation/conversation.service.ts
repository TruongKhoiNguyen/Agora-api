import { BadRequestException, Injectable } from '@nestjs/common'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { Conversation } from './schemas/conversation.schema'
import { UserDocument } from 'src/user/schemas/user.schema'
import { CreateConvDto } from './dto/create-conv.dto'
import { PusherService } from 'src/pusher/pusher.service'
import { Message } from 'src/message/schemas/message.schema'

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private pusherService: PusherService
  ) {}

  async createConversation(user: UserDocument, createConvDto: CreateConvDto) {
    const { isGroup, members, name } = createConvDto

    if (isGroup && members.length < 2) {
      throw new BadRequestException('Invalid data')
    }

    if (isGroup) {
      let newGroupConversation = await this.conversationModel.create({
        name,
        members: [...members, user._id],
        isGroup
      })

      newGroupConversation = await newGroupConversation.populate(
        'members',
        'firstName lastName avatar _id email'
      )

      newGroupConversation.members.forEach(member => {
        console.log(member['_id'].toString())
        this.pusherService.trigger(
          member['_id'].toString(),
          'conversation:new',
          newGroupConversation
        )
      })

      return newGroupConversation
    }

    const friendId = members[0]

    const existingConversations = await this.conversationModel.find({
      $or: [
        {
          members: { $eq: [user._id, friendId] }
        },
        {
          members: { $eq: [friendId, user._id] }
        }
      ]
    })

    if (existingConversations.length > 0) {
      throw new BadRequestException('Conversation already exists')
    }

    let newSingleConversation = await this.conversationModel.create({
      name,
      members: [user._id, friendId]
    })

    newSingleConversation = await newSingleConversation.populate(
      'members',
      'firstName lastName avatar _id email'
    )

    newSingleConversation.members.forEach(member => {
      console.log(member['_id'].toString())
      this.pusherService.trigger(
        member['_id'].toString(),
        'conversation:new',
        newSingleConversation
      )
    })

    return newSingleConversation
  }

  async getConversationWithUserId(userId: Types.ObjectId) {
    const conversations = await this.conversationModel
      .find({ members: { $in: [userId] } })
      .lean()
      .populate('members', 'firstName lastName avatar _id email')
      .populate({
        path: 'messages',
        populate: {
          path: 'sender',
          select: 'firstName lastName avatar _id email'
        }
      })
      .sort({ lastMessageAt: -1 })

    return conversations
  }

  async seenConversation(userId: Types.ObjectId, conversationId: string) {
    console.log(conversationId)
    const conversation = await this.conversationModel
      .findOne({
        _id: new Types.ObjectId(conversationId),
        members: { $in: [userId] }
      })
      .populate('members', 'firstName lastName avatar _id email')
      .populate({
        path: 'messages',
        populate: {
          path: 'sender',
          select: 'firstName lastName avatar _id email'
        }
      })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation')
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1]

    if (!lastMessage) {
      return true
    }

    console.log(lastMessage)

    if (lastMessage.sender['_id'].toString() === userId.toString()) {
      console.log('sender')
      return true
    }

    const hasSeen = lastMessage.seenUsers.some(seenUser => {
      return seenUser.toString() === userId.toString()
    })
    if (hasSeen) return true

    const updatedMessage = await this.messageModel
      .findOneAndUpdate({ _id: lastMessage['id'] }, { $push: { seenUsers: userId } }, { new: true })
      .populate('sender', 'firstName lastName avatar _id email')
      .populate('seenUsers', 'firstName lastName avatar _id email')
      .exec()

    console.log(updatedMessage)

    this.pusherService.trigger(userId.toString(), 'conversation:update', {
      conversationId,
      lastMessage: lastMessage
    })

    this.pusherService.trigger(conversationId, 'message:update', {
      updatedMessage
    })

    return true
  }
}
