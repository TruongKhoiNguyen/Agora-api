import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Date, HydratedDocument } from 'mongoose'

export type UserDocument = HydratedDocument<User>

export enum Role {
  USER = 'user',
  ADMIN = 'admin'
}

export enum Status {
  ACTIVE = 'active',
  BLOCKED = 'blocked'
}

export enum AccountType {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook'
}

@Schema({
  timestamps: true
})
export class User {
  @Prop({ isRequired: true })
  firstName: string

  @Prop({ isRequired: true })
  lastName: string

  @Prop({ unique: true, isRequired: true })
  email: string

  @Prop({ type: Date, isRequired: false })
  emailVerified: Date

  @Prop({ isRequired: false })
  avatar: string

  @Prop({ isRequired: false })
  profileImage: string

  @Prop({ isRequired: false, select: false })
  password: string

  @Prop({ default: AccountType.LOCAL })
  accountType: AccountType

  @Prop({ default: Status.ACTIVE })
  status: Status

  @Prop({ default: Role.USER })
  Role: Role
}

export const UserSchema = SchemaFactory.createForClass(User)
