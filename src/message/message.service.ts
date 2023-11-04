import { NewMessageDto } from './dto/new-message.dto'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Message } from './schemas/message.schema'
import { Model, Types } from 'mongoose'
import { Conversation } from 'src/conversation/schemas/conversation.schema'
import { PusherService } from 'src/pusher/pusher.service'

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private pusherService: PusherService
  ) {}

  async createMessage(userId: Types.ObjectId, newMessageDto: NewMessageDto, images?: string[]) {
    const { conversationId, content } = newMessageDto

    const conversation = await this.conversationModel
      .findById(new Types.ObjectId(conversationId))
      .populate('members', '_id')

    console.log(conversation)

    if (!conversation) {
      throw new BadRequestException('Conversation not found')
    }

    let newMessage = await this.messageModel.create({
      content,
      sender: userId,
      images: images || null
    })

    newMessage = await newMessage.populate('sender', 'firstName lastName avatar _id email')

    this.pusherService.trigger(conversationId, 'message:new', newMessage)

    await conversation.updateOne({
      $set: {
        lastMessageAt: new Date()
      },
      $push: {
        messages: newMessage._id
      }
    })

    conversation.members.forEach(member => {
      this.pusherService.trigger(member['_id'].toString(), 'conversation:update', {
        conversationId,
        lastMessage: newMessage
      })
    })

    return newMessage
  }
}
