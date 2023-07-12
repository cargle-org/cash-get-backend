import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { ShopService } from 'src/shop/shop.service';
import { UserService } from 'src/user/user.service';
import CryptoJs from 'crypto-js';
import { ConfigService } from '@nestjs/config';
import { orderStatusEnum } from 'src/utils/constants';

@Injectable()
export class OrderService {
  constructor(
    private shopService: ShopService,
    private userService: UserService,
    private configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}
  async create(shopId: string, createOrderDto: CreateOrderDto) {
    const shop = await this.shopService.findOne(shopId);
    const shopKey = CryptoJs.AES.encrypt(
      shop.id,
      this.configService.get('SECRET_KEY'),
    ).toString();

    const orderDetails = {
      ...createOrderDto,
      shopKey,
      shop: shop,
    };

    const newOrder = await this.orderRepository.save(orderDetails);
    if (!newOrder) {
      throw new InternalServerErrorException();
    }
    return newOrder;
  }

  async agentAccept(orderId: string, agentId: string) {
    const order = await this.findOne(orderId);

    if (order.agent) {
      throw new UnauthorizedException();
    }
    const agent = await this.userService.findOne(agentId);

    const agentKey = CryptoJs.AES.encrypt(
      agent.id,
      this.configService.get('SECRET_KEY'),
    ).toString();
    order.agentKey = agentKey;
    order.agent = agent;
    order.status = orderStatusEnum.IN_PROGRESS;

    await order.save();

    return order;
  }

  async agentConfirm(orderId: string, agentId: string, agentKey: string) {
    const order = await this.findOne(orderId);

    if (
      order.agentKey === agentKey &&
      CryptoJs.AES.decrypt(
        agentKey,
        this.configService.get('SECRET_KEY'),
      ).toString() === agentId
    ) {
      order.agentConfirmed = true;
      if (order.shopConfirmed) {
        order.status = orderStatusEnum.COMPLETED;
      }
    }

    await order.save();

    return order;
  }

  async shopConfirm(orderId: string, shopId: string, shopKey: string) {
    const order = await this.findOne(orderId);

    if (
      order.shopKey === shopKey &&
      CryptoJs.AES.decrypt(
        shopKey,
        this.configService.get('SECRET_KEY'),
      ).toString() === shopId
    ) {
      order.shopConfirmed = true;
      if (order.agentConfirmed) {
        order.status = orderStatusEnum.COMPLETED;
      }
    }

    await order.save();
    return order;
  }

  findAll() {
    return `This action returns all order`;
  }

  async findOne(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
      },
    });
    if (!order) {
      throw new NotFoundException('Could not find Order');
    }
    return order;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
