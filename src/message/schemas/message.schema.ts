import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { User } from 'src/user/schemas/user.schema'

export type MessageDocument = HydratedDocument<Message>

export enum MessageTypes {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  UP_ADD_MEMBER = 'ADD_MEMBER',
  UP_RM_MEMBER = 'RM_MEMBER',
  UP_INFO = 'UP_INFO',
  UP_THUMB = 'UP_THUMB',
  UP_ADD_ADMIN = 'ADD_ADMIN',
  UP_LEAVE = 'UP_LEAVE'
}

@Schema({
  timestamps: true
})
export class Message {
  @Prop()
  content: string

  @Prop({ default: MessageTypes.TEXT, enum: MessageTypes })
  type: MessageTypes

  @Prop()
  images: string[]

  @Prop({ type: Types.ObjectId, ref: User.name, isRequired: true })
  sender: string

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }] })
  seenUsers: User[]

  @Prop({ isRequired: true, index: true })
  conversationId: string
}

export const MessageSchema = SchemaFactory.createForClass(Message)
