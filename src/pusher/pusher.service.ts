import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Pusher from 'pusher'

export enum ConversationTag {
  SEEN = 'seen',
  NEW_MESSAGE = 'new-message',
  UPDATE_THUMB = 'update-thumb',
  UPDATE_INFO = 'update-info',
  ADD_MEMBERS = 'add-members',
  REMOVE_MEMBERS = 'remove-members',
  LEAVE_CONVERSATION = 'leave-conversation',
  IS_LEAVE_CONVERSATION = 'is-leave-conversation',
  UPDATE_ADMINS = 'update-admins'
}

@Injectable()
export class PusherService {
  pusher: Pusher

  constructor(private configService: ConfigService) {
    this.pusher = new Pusher({
      appId: configService.get<string>('PUSHER_API_ID'),
      key: configService.get<string>('PUSHER_KEY'),
      secret: configService.get<string>('PUSHER_SECRET'),
      cluster: configService.get<string>('PUSHER_CLUSTER'),
      useTLS: true
    })
  }

  getInstances() {
    return this.pusher
  }

  trigger(channel: string, event: string, data: any) {
    this.pusher.trigger(channel, event, JSON.stringify(data))
  }

  authorizeChannel(socketId: string, channelName: string, data?: Pusher.PresenceChannelData) {
    return this.pusher.authorizeChannel(socketId, channelName, data)
  }
}
