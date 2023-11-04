import { Module } from '@nestjs/common'
import { ConversationController } from './conversation.controller'
import { ConversationService } from './conversation.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Conversation, ConversationSchema } from './schemas/conversation.schema'
import { PusherModule } from 'src/pusher/pusher.module'
import { Message, MessageSchema } from 'src/message/schemas/message.schema'

@Module({
  imports: [
    PusherModule,
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }])
  ],
  controllers: [ConversationController],
  providers: [ConversationService]
})
export class ConversationModule {}
