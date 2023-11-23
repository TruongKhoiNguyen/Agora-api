import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { User } from 'src/user/schemas/user.schema'

export type NotificationDocument = HydratedDocument<Notification>

enum NotificationType {
  FRIEND = 'friend',
  MESSAGE = 'message',
  GROUP = 'group'
}

enum NotificationCode {
  FRIEND_REQUEST = 'friend_request'
}

@Schema({
  timestamps: true
})
export class Notification {
  @Prop({ type: Types.ObjectId, ref: User.name, isRequired: true })
  sender: User

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }] })
  receiver: User[]

  @Prop()
  message: string

  @Prop()
  type: NotificationType

  @Prop()
  code: NotificationCode

  @Prop({ type: Date })
  readAt: Date
}

export const NotificationSchema = SchemaFactory.createForClass(Notification)
