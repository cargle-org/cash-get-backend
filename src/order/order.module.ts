import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { UserModule } from 'src/user/user.module';
import { ShopModule } from 'src/shop/shop.module';
import { OrderCollection } from './entities/orderCollection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderCollection]),
    UserModule,
    ShopModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
