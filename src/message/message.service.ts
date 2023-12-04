import { NewMessageDto } from './dto/new-message.dto'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import mongoose, { Model, Types } from 'mongoose'
import { Message, MessageTypes } from './schemas/message.schema'
import { Conversation } from 'src/conversation/schemas/conversation.schema'
import { ConversationTag, PusherService } from 'src/pusher/pusher.service'
import { BASIC_INFO_SELECT } from 'src/user/schemas/user.schema'

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private pusherService: PusherService
  ) {}

  async createMessage(
    userId: Types.ObjectId,
    newMessageDto: NewMessageDto,
    images?: string[],
    type?: MessageTypes
  ) {
    const { conversationId, content } = newMessageDto

    const conversation = await this.conversationModel
      .findById(new Types.ObjectId(conversationId))
      .populate('members', '_id')

    if (!conversation) {
      throw new BadRequestException('Conversation not found')
    }

    if (!images && !content) {
      throw new BadRequestException('Content or images is required')
    }

    let newMessage = await this.messageModel.create({
      content,
      sender: userId,
      images: images || [],
      type: type ? type : MessageTypes.TEXT,
      conversationId
    })

    newMessage = await newMessage.populate('sender', BASIC_INFO_SELECT)

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
        tag: ConversationTag.NEW_MESSAGE,
        conversationId,
        lastMessage: newMessage
      })
    })

    return newMessage
  }

  async getAllMessages(userId: Types.ObjectId, conversationId: string) {
    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      members: { $in: [userId] }
    })

    if (!conversation) {
      throw new BadRequestException('Conversation not found or you are not a member')
    }

    const messages = await this.messageModel
      .find({
        conversationId,
        _id: {
          $gt: new Types.ObjectId('655b1bc30255a0bb1d89b05f')
        }
      })
      .populate('sender', BASIC_INFO_SELECT)
      .populate('seenUsers', BASIC_INFO_SELECT)

    return messages
  }

  async getMessages(
    userId: Types.ObjectId,
    conversationId: string,
    next: string,
    limit: number = 10
  ) {
    if (next && !mongoose.Types.ObjectId.isValid(next)) {
      throw new BadRequestException('Invalid objectId')
    }

    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      members: { $in: [userId] }
    })

    if (!conversation) {
      throw new BadRequestException('Conversation not found or you are not a member')
    }

    const filter = next
      ? {
          conversationId,
          _id: {
            $lt: new Types.ObjectId(next)
          }
        }
      : { conversationId }

    const messages = await this.messageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', BASIC_INFO_SELECT)
      .populate('seenUsers', BASIC_INFO_SELECT)

    return messages
  }

  async typingMessage(userId: Types.ObjectId, conversationId: string) {
    try {
      const conversation = await this.conversationModel.findById(new Types.ObjectId(conversationId))

      if (!conversation) {
        throw new BadRequestException('Conversation not found')
      }

      this.pusherService.trigger(conversationId, 'message:typing', { userId })

      return {
        success: true,
        message: 'Typing event create successfully'
      }
    } catch (err) {
      throw new BadRequestException('Invalid conversationId')
    }
  }
}
