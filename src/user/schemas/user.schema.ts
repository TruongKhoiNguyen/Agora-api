import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Date, HydratedDocument, Types } from 'mongoose'

export type UserDocument = HydratedDocument<User>

export enum Role {
  USER = 'user',
  ADMIN = 'admin'
}

export enum Status {
  NOT_VERIFIED = 'not_verified',
  ACTIVE = 'active',
  BLOCKED = 'blocked'
}

export enum AccountType {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook'
}

export const BASIC_INFO_SELECT = '_id firstName lastName displayName email avatar'

@Schema({
  timestamps: true
})
export class User {
  @Prop({ isRequired: false })
  displayName: string

  @Prop({ isRequired: true })
  firstName: string

  @Prop({ isRequired: true })
  lastName: string

  @Prop({ unique: true, isRequired: true })
  email: string

  @Prop({ type: Date, isRequired: false })
  emailVerified: Date

  @Prop({ default: null })
  avatar: string

  @Prop({ isRequired: false })
  profileImage: string

  @Prop({ isRequired: false, select: false })
  password: string

  @Prop({ default: AccountType.LOCAL })
  accountType: AccountType

  @Prop({ default: Status.NOT_VERIFIED })
  status: Status

  @Prop({ default: Role.USER })
  Role: Role

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }] })
  friends: User[]

  @Prop({
    type: [
      {
        sender: { type: Types.ObjectId, ref: User.name },
        message: { type: String, default: 'Hello, I want to be your friend' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    default: []
  })
  friendRequests: [any]
}

export const UserSchema = SchemaFactory.createForClass(User)
