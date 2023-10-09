import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as dotenv from 'dotenv'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configDoc = new DocumentBuilder()
    .setTitle('Agora API')
    .setDescription('List APIs for Agora App')
    .setVersion('1.0')
    .addTag('Auth')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, configDoc)
  SwaggerModule.setup('api', app, document)

  app.enableCors()
  app.setGlobalPrefix('api/v1')
  await app.listen(process.env.PORT || 9900)
}
bootstrap()
