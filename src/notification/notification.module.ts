import { Module } from '@nestjs/common'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { PusherModule } from 'src/pusher/pusher.module'
import { MongooseModule } from '@nestjs/mongoose'
import { Notification, NotificationSchema } from './schemas/notification.shema'

@Module({
  imports: [
    PusherModule,
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }])
  ],
  controllers: [NotificationController],
  providers: [NotificationService]
})
export class NotificationModule {}
