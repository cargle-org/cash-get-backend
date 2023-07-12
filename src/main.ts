import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(`api/${app.get(ConfigService).get('VERSION')}`);
  await app.listen(app.get(ConfigService).get('PORT') || 3000);
}
bootstrap();
