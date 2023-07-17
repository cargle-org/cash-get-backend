import {
  ForbiddenException,
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
import * as CryptoJs from 'crypto-js';
import { ConfigService } from '@nestjs/config';
import { KEY_LENGTH, orderStatusEnum } from 'src/utils/constants';
import { FirebaseService } from 'src/firebase/firebase.service';
import { generateKey } from 'src/utils/misc';

@Injectable()
export class OrderService {
  constructor(
    private shopService: ShopService,
    private userService: UserService,
    private configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly firebaseService: FirebaseService,
  ) {}
  async create(shopId: string, createOrderDto: CreateOrderDto) {
    const shop = await this.shopService.findOne(shopId);
    const shopKey = generateKey(KEY_LENGTH, shop.role);
    const orderDetails = {
      ...createOrderDto,
      shopKey,
      shop: shop,
    };

    const newOrder = await this.orderRepository.save(orderDetails);
    if (!newOrder) {
      throw new InternalServerErrorException();
    }

    const firebaseOrderRef = this.firebaseService.db().ref('order');

    firebaseOrderRef.push({
      id: newOrder.id,
      shopId: shop.id,
      amount: newOrder.amount,
      status: newOrder.status,
      agentName: null,
      agentId: null,
      agentNo: null,
    });
    return newOrder;
  }

  async agentAccept(orderId: string, agentId: string) {
    const order = await this.findOne(orderId);

    if (order.agent) {
      throw new UnauthorizedException();
    }
    const agent = await this.userService.findOne(agentId);

    const agentKey = generateKey(KEY_LENGTH, agent.role);
    order.agentKey = agentKey;
    order.agent = agent;
    order.status = orderStatusEnum.IN_PROGRESS;

    await order.save();

    return order;
  }

  async agentConfirm(orderId: string, agentKey: string) {
    const order = await this.findOne(orderId);

    if (order.agentKey === agentKey) {
      order.agentConfirmed = true;
      if (order.shopConfirmed) {
        order.status = orderStatusEnum.COMPLETED;
      }
    } else {
      throw new ForbiddenException('Wrong Agent Key');
    }

    await order.save();

    return order;
  }

  async shopConfirm(orderId: string, shopKey: string) {
    const order = await this.findOne(orderId);

    if (order.shopKey === shopKey) {
      order.shopConfirmed = true;
      if (order.agentConfirmed) {
        order.status = orderStatusEnum.COMPLETED;
      }
    } else {
      throw new ForbiddenException('Wrong Shop Key');
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
      relations: {
        agent: true,
        shop: true,
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
