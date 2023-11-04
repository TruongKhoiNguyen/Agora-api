import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { User } from 'src/user/schemas/user.schema'

export type MessageDocument = HydratedDocument<Message>

@Schema({
  timestamps: true
})
export class Message {
  @Prop()
  content: string

  @Prop()
  images: string[]

  @Prop({ type: Types.ObjectId, ref: User.name, isRequired: true })
  sender: string

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }] })
  seenUsers: User[]
}

export const MessageSchema = SchemaFactory.createForClass(Message)
