import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import * as dotenv from 'dotenv'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { JwtAuthGuard } from './auth/guards/jwt.guard'
import { MailerModule, PugAdapter } from '@nest-modules/mailer'
import { join } from 'path'
import { PusherModule } from './pusher/pusher.module'
import { ConversationModule } from './conversation/conversation.module'
import { MessageModule } from './message/message.module'
dotenv.config()

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD')
          }
        },
        defaults: {
          from: `'No Reply' <${config.get('MAIL_FROM')}>`
        },
        template: {
          dir: join(__dirname, 'src/templates/email'),
          adapter: new PugAdapter(),
          options: {
            strict: true
          }
        }
      }),
      inject: [ConfigService]
    }),
    AuthModule,
    UserModule,
    PusherModule,
    ConversationModule,
    MessageModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard
    }
  ]
})
export class AppModule {}
