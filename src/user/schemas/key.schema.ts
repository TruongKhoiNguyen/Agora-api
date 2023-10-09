import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { User } from './user.schema'

export type KeyDocument = HydratedDocument<Key>

@Schema({
  timestamps: true
})
export class Key {
  @Prop({ type: Types.ObjectId, ref: User.name, isRequired: true })
  user: User

  @Prop({ isRequired: true })
  refreshSecretKey: string

  @Prop({ isRequired: true })
  accessSecretKey: string

  @Prop({ isRequired: true })
  refreshToken: string

  @Prop({ default: [] })
  refreshTokenUseds: string[]
}

export const KeySchema = SchemaFactory.createForClass(Key)
