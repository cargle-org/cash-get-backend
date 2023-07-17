import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { ShopModule } from './shop/shop.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './utils/env.valiadtion';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    UserModule,
    OrderModule,
    ShopModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    FirebaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
