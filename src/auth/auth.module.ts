import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from 'src/user/schemas/user.schema'
import { Key, KeySchema } from 'src/user/schemas/key.schema'
import { JwtModule } from '@nestjs/jwt'
import { JwtRefreshStratery, JwtStratery } from './strateries'
import { PusherModule } from 'src/pusher/pusher.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Key.name, schema: KeySchema }
    ]),
    JwtModule.register({ global: true }),
    PusherModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStratery, JwtRefreshStratery]
})
export class AuthModule {}
