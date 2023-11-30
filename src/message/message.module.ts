import { Module } from '@nestjs/common'
import { MessageController } from './message.controller'
import { MessageService } from './message.service'
import { PusherModule } from 'src/pusher/pusher.module'
import { MongooseModule } from '@nestjs/mongoose'
import { Message, MessageSchema } from './schemas/message.schema'
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module'
import { Conversation, ConversationSchema } from 'src/conversation/schemas/conversation.schema'

@Module({
  imports: [
    PusherModule,
    CloudinaryModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema }
    ])
  ],
  controllers: [MessageController],
  providers: [MessageService]
})
export class MessageModule {}
