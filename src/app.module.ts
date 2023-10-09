import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import * as dotenv from 'dotenv'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { JwtAuthGuard } from './auth/guards/jwt.guard'
dotenv.config()

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule
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
