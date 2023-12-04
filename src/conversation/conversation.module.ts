import { Module } from '@nestjs/common'
import { ConversationController } from './conversation.controller'
import { ConversationService } from './conversation.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Conversation, ConversationSchema } from './schemas/conversation.schema'
import { PusherModule } from 'src/pusher/pusher.module'
import { Message, MessageSchema } from 'src/message/schemas/message.schema'
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module'
import { MessageService } from 'src/message/message.service'
import { User, UserSchema } from 'src/user/schemas/user.schema'

@Module({
  imports: [
    PusherModule,
    CloudinaryModule,
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [ConversationController],
  providers: [ConversationService, MessageService]
})
export class ConversationModule {}
