import { BadRequestException, Injectable } from '@nestjs/common'
import { Model, Types } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { Conversation } from './schemas/conversation.schema'
import { UserDocument } from 'src/user/schemas/user.schema'
import { ConversationTag, PusherService } from 'src/pusher/pusher.service'
import { Message } from 'src/message/schemas/message.schema'
import { CloudinaryService, ImageType } from 'src/cloudinary/cloudinary.service'
import { CreateConvDto, UpdateInfoConvDto } from './dto'

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private pusherService: PusherService,
    private cloudinaryService: CloudinaryService
  ) {}

  async createConversation(user: UserDocument, createConvDto: CreateConvDto) {
    const { isGroup, members, name } = createConvDto

    if (isGroup && members.length < 2) {
      throw new BadRequestException('Invalid data')
    }

    if (isGroup) {
      let newGroupConversation = await this.conversationModel.create({
        name,
        admins: [user._id],
        members: [...members, user._id],
        isGroup,
        lastMessageAt: new Date()
      })

      newGroupConversation = await newGroupConversation.populate(
        'members',
        'firstName lastName avatar _id email'
      )

      newGroupConversation.members.forEach(member => {
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
      admins: [user._id, friendId],
      lastMessageAt: new Date(),
      members: [user._id, friendId]
    })

    newSingleConversation = await newSingleConversation.populate(
      'members',
      'firstName lastName avatar _id email'
    )

    newSingleConversation.members.forEach(member => {
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
      .populate({
        path: 'messages',
        populate: {
          path: 'seenUsers',
          select: 'firstName lastName avatar _id email'
        }
      })
      .sort({ lastMessageAt: -1 })

    return conversations
  }

  async getConversationWithId(userId: Types.ObjectId, conversationId: string) {
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
      .populate({
        path: 'messages',
        populate: {
          path: 'seenUsers',
          select: 'firstName lastName avatar _id email'
        }
      })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation or permission denied')
    }

    return conversation
  }

  async seenConversation(userId: Types.ObjectId, conversationId: string) {
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

    if (lastMessage.sender['_id'].toString() === userId.toString()) {
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

    this.pusherService.trigger(userId.toString(), 'conversation:update', {
      tag: ConversationTag.SEEN,
      conversationId,
      lastMessage: updatedMessage
    })

    this.pusherService.trigger(conversationId, 'message:update', {
      updatedMessage
    })

    return true
  }

  async updateThumb(conversationId: string, userId: Types.ObjectId, file: Express.Multer.File) {
    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      admins: { $in: [userId] }
    })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation or permission denied')
    }

    if (!conversation.isGroup) {
      throw new BadRequestException('Invalid conversation')
    }

    const promises = []

    promises.push(this.cloudinaryService.uploadFile(file, ImageType.THUMB))

    if (conversation.thumb) {
      promises.push(this.cloudinaryService.destroyFile(conversation.thumb, ImageType.THUMB))
    }

    const result = await Promise.all(promises)

    await conversation.updateOne({
      thumb: result[0].secure_url
    })

    conversation.members.forEach(member => {
      this.pusherService.trigger(member.toString(), 'conversation:update', {
        tag: ConversationTag.UPDATE_INFO,
        conversationId,
        name: result[0].secure_url
      })
    })
  }

  async updateInfo(
    conversationId: string,
    userId: Types.ObjectId,
    updateInfoConvDto: UpdateInfoConvDto
  ) {
    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      admins: { $in: [userId] }
    })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation or permission denied')
    }

    if (!conversation.isGroup) {
      throw new BadRequestException('Invalid conversation')
    }

    await conversation.updateOne({
      name: updateInfoConvDto.name
    })

    conversation.members.forEach(member => {
      this.pusherService.trigger(member.toString(), 'conversation:update', {
        tag: ConversationTag.UPDATE_INFO,
        conversationId,
        updateInfo: updateInfoConvDto
      })
    })
  }

  async addMembers(conversationId: string, userId: Types.ObjectId, memberIds: string[]) {
    memberIds.forEach(memberId => {
      if (userId.toString() === memberId.toString()) {
        throw new BadRequestException('Invalid input')
      }
    })

    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      admins: { $in: [userId] }
    })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation or permission denied')
    }

    if (!conversation.isGroup) {
      throw new BadRequestException('Invalid conversation')
    }

    const newMembers = [
      ...new Set([...conversation.members.map(member => member.toString()), ...memberIds])
    ]

    await conversation.updateOne({
      members: newMembers.map(member => new Types.ObjectId(member))
    })

    newMembers.forEach(member => {
      this.pusherService.trigger(member, 'conversation:update', {
        tag: ConversationTag.ADD_MEMBERS,
        conversationId,
        members: newMembers.map(member => new Types.ObjectId(member))
      })
    })
  }

  async removeMembers(conversationId: string, userId: Types.ObjectId, memberId: string) {
    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      admins: { $in: [userId] },
      members: { $in: [new Types.ObjectId(memberId)] }
    })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation or permission denied')
    }

    if (!conversation.isGroup) {
      throw new BadRequestException('Invalid conversation')
    }

    if (conversation.admins.some(admin => admin.toString() === memberId.toString())) {
      throw new BadRequestException('Cannot remove admin')
    }

    const newMembers = conversation.members.filter(member => {
      if (!(member.toString() !== memberId)) {
        this.pusherService.trigger(member.toString(), 'conversation:update', {
          tag: ConversationTag.IS_LEAVE_CONVERSATION,
          conversationId
        })
      }

      return member.toString() !== memberId
    })

    await conversation.updateOne({
      members: newMembers
    })

    newMembers.forEach(member => {
      this.pusherService.trigger(member.toString(), 'conversation:update', {
        tag: ConversationTag.REMOVE_MEMBERS,
        conversationId,
        members: newMembers
      })
    })
  }

  async leaveConversation(conversationId: string, userId: Types.ObjectId) {
    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      members: { $in: [userId] }
    })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation')
    }

    if (!conversation.isGroup) {
      throw new BadRequestException('Invalid conversation')
    }

    if (
      conversation.admins.length === 1 &&
      conversation.admins[0].toString() === userId.toString()
    ) {
      throw new BadRequestException('Cannot leave conversation')
    }

    const newMembers = conversation.members.filter(member => {
      if (!(member.toString() !== userId.toString())) {
        this.pusherService.trigger(member.toString(), 'conversation:update', {
          tag: ConversationTag.IS_LEAVE_CONVERSATION,
          conversationId
        })
      }

      return member.toString() !== userId.toString()
    })

    await conversation.updateOne({
      members: newMembers,
      $pull: {
        admins: userId
      }
    })

    newMembers.forEach(member => {
      this.pusherService.trigger(member.toString(), 'conversation:update', {
        tag: ConversationTag.LEAVE_CONVERSATION,
        conversationId,
        members: newMembers
      })
    })
  }

  async addAdmins(conversationId: string, userId: Types.ObjectId, adminId: string) {
    if (userId.toString() === adminId.toString()) {
      throw new BadRequestException('Cannot add yourself')
    }

    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      admins: { $in: [userId] },
      members: { $in: [new Types.ObjectId(adminId)] }
    })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation or permission denied')
    }

    if (!conversation.isGroup) {
      throw new BadRequestException('Invalid conversation')
    }

    if (conversation.admins.some(admin => admin.toString() === adminId.toString())) {
      throw new BadRequestException('User is already an admin')
    }

    await conversation.updateOne(
      {
        $push: {
          admins: new Types.ObjectId(adminId)
        }
      },
      { new: true }
    )

    conversation.members.forEach(member => {
      this.pusherService.trigger(member.toString(), 'conversation:update', {
        tag: ConversationTag.UPDATE_ADMINS,
        conversationId,
        admins: [...conversation.admins, new Types.ObjectId(adminId)]
      })
    })
  }

  async getAllImages(conversationId: string, userId: Types.ObjectId) {
    const conversation = await this.conversationModel
      .findOne({
        _id: new Types.ObjectId(conversationId),
        members: { $in: [userId] }
      })
      .populate('messages', '_id sender content images createdAt')
      .populate({
        path: 'messages',
        populate: {
          path: 'sender',
          select: 'firstName lastName avatar _id'
        }
      })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation or permission denied')
    }

    const images = conversation.messages.reduce((prev, message) => {
      if (message.images.length > 0) {
        message.images.forEach(image => {
          prev.push({
            messageId: message['_id'].toString(),
            sender: message.sender,
            image,
            createdAt: message['createdAt']
          })
        })
      }
      return prev
    }, [])

    return images
  }

  async getAllLinks(conversationId: string, userId: Types.ObjectId) {
    const regex = /(https?:\/\/[^\s]+)/g
    const conversation = await this.conversationModel
      .findOne({
        _id: new Types.ObjectId(conversationId),
        members: { $in: [userId] }
      })
      .populate('messages', '_id sender content createdAt')
      .populate({
        path: 'messages',
        populate: {
          path: 'sender',
          select: 'firstName lastName avatar _id'
        }
      })

    if (!conversation) {
      throw new BadRequestException('Invalid conversation or permission denied')
    }

    const links = conversation.messages.reduce((prev, message) => {
      const matches = message.content.match(regex)
      if (matches) {
        matches.forEach(match => {
          prev.push({
            messageId: message['_id'].toString(),
            sender: message.sender,
            link: match,
            createdAt: message['createdAt']
          })
        })
      }
      return prev
    }, [])

    return links
  }
}
