import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { Message } from 'src/message/schemas/message.schema'
import { User } from 'src/user/schemas/user.schema'

export type ConversationDocument = HydratedDocument<Conversation>

@Schema({
  timestamps: true
})
export class Conversation {
  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }] })
  admins: User[]

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }] })
  members: User[]

  @Prop({ type: [{ type: Types.ObjectId, ref: Message.name }] })
  messages: Message[]

  @Prop({ isRequired: true })
  name: string

  @Prop({ default: false })
  isGroup: boolean

  @Prop({ type: Date, default: new Date() })
  lastMessageAt: Date

  @Prop({ isRequired: false })
  thumb: string
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation)
