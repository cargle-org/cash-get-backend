import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix(`api/${app.get(ConfigService).get('VERSION')}`);
  await app.listen(app.get(ConfigService).get('PORT') || 3000);
}
bootstrap();
