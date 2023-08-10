import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
import { ConfigService } from '@nestjs/config';
import { KEY_LENGTH, orderStatusEnum } from 'src/utils/constants';
import { FirebaseService } from 'src/firebase/firebase.service';
import { generateKey } from 'src/utils/misc';

@Injectable()
export class OrderService {
  private logger = new Logger(OrderService.name);
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
      deliveryPeriod: newOrder.deliveryPeriod?.toString(),
      agentName: null,
      agentId: null,
      agentNo: null,
    });

    const notificationReponse = await this.firebaseService.messaging().send({
      data: {
        // id: newOrder.id,
        // shopId: shop.id,
        // amount: newOrder.amount.toString(),
        // status: newOrder.status,
        // deliveryPeriod: newOrder.deliveryPeriod?.toString(),
        // agentName: '',
        // agentId: '',
        // agentNo: '',
      },
      notification: {
        title: 'New Mopup Request',
        body: `Shop ${shop.name} has posted a new order`,
      },
      topic: 'agent',
    });

    this.logger.log(notificationReponse);
    const currentTime = new Date().getTime();
    const endTime = new Date(newOrder.deliveryPeriod).getTime();

    setTimeout(() => {
      this.checkIfHandled(newOrder.id);
    }, endTime - currentTime);
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

    const firebaseOrderRef = this.firebaseService.db().ref('order');
    firebaseOrderRef.on('value', (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.val().id == orderId) {
          firebaseOrderRef.child(childSnapshot.key).set({
            id: order.id,
            shopId: order.shop.id,
            amount: order.amount,
            status: order.status,
            deliveryPeriod: order.deliveryPeriod?.toString(),
            agentName: order.agent.name,
            agentId: order.agent.id,
            agentNo: order.agent.phoneNo,
          });
        }
      });
    });

    this.firebaseService.messaging().sendEachForMulticast({
      data: {
        // id: order.id,
        // shopId: order.shop.id,
        // amount: order.amount.toString(),
        // status: order.status,
        // deliveryPeriod: order.deliveryPeriod.toString(),
        // agentName: order.agent.name,
        // agentId: order.agent.id,
        // agentNo: order.agent.phoneNo,
      },
      notification: {
        title: 'Mopup Request Accepted',
        body: `Agent ${agent.name} has accepted your order`,
      },
      tokens: agent.notificationToken,
    });

    await order.save();
    return order;
  }

  async agentConfirm(orderId: string, agentKey: string) {
    const order = await this.findOne(orderId);
    if (order.agentKey === agentKey) {
      order.agentConfirmed = true;
      this.firebaseService.messaging().sendEachForMulticast({
        data: {
          // id: order.id,
          // shopId: order.id,
          // amount: order.amount.toString(),
          // status: order.status,
          // deliveryPeriod: order.deliveryPeriod.toString(),
          // agentName: order.agent.name,
          // agentId: order.agent.id,
          // agentNo: order.agent.phoneNo,
        },
        notification: {
          title: 'Agent Confirmed Order',
          body: `Your Mopup order has been confirmed by agent, please enter Agent key to complete`,
        },
        tokens: order.shop.notificationToken,
      });
      if (order.shopConfirmed) {
        order.status = orderStatusEnum.COMPLETED;
        const firebaseOrderRef = this.firebaseService.db().ref('order');
        firebaseOrderRef.on('value', (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().id == orderId) {
              firebaseOrderRef.child(childSnapshot.key).set({
                id: order.id,
                shopId: order.shop.id,
                amount: order.amount,
                status: order.status,
                deliveryPeriod: order.deliveryPeriod?.toString(),
                agentName: order.agent.name,
                agentId: order.agent.id,
                agentNo: order.agent.phoneNo,
              });
            }
          });
        });

        this.firebaseService.messaging().sendEachForMulticast({
          data: {
            // id: order.id,
            // shopId: order.id,
            // amount: order.amount.toString(),
            // status: order.status,
            // deliveryPeriod: order.deliveryPeriod?.toString(),
            // agentName: order.agent.name,
            // agentId: order.agent.id,
            // agentNo: order.agent.phoneNo,
          },
          notification: {
            title: 'Order Completed',
            body: `Your Mopup order #${order.id} has been completed`,
          },
          tokens: order.shop.notificationToken.concat(
            order.agent.notificationToken,
          ),
        });
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
      this.firebaseService.messaging().sendEachForMulticast({
        data: {
          // id: order.id,
          // shopId: order.id,
          // amount: order.amount.toString(),
          // status: order.status,
          // deliveryPeriod: order.deliveryPeriod?.toString(),
          // agentName: order.agent.name,
          // agentId: order.agent.id,
          // agentNo: order.agent.phoneNo,
        },
        notification: {
          title: 'Shop Confirmed Order',
          body: `Your Mopup order has been confirmed by shop, please enter Shop key to complete`,
        },
        tokens: order.shop.notificationToken,
      });
      if (order.agentConfirmed) {
        order.status = orderStatusEnum.COMPLETED;
        const firebaseOrderRef = this.firebaseService.db().ref('order');
        firebaseOrderRef.on('value', (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().id == orderId) {
              firebaseOrderRef.child(childSnapshot.key).set({
                id: order.id,
                shopId: order.shop.id,
                amount: order.amount,
                status: order.status,
                deliveryPeriod: order.deliveryPeriod?.toString(),
                agentName: order.agent.name,
                agentId: order.agent.id,
                agentNo: order.agent.phoneNo,
              });
            }
          });
        });
        this.firebaseService.messaging().sendEachForMulticast({
          data: {
            // id: order.id,
            // shopId: order.id,
            // amount: order.amount.toString(),
            // status: order.status,
            // deliveryPeriod: order.deliveryPeriod?.toString(),
            // agentName: order.agent.name,
            // agentId: order.agent.id,
            // agentNo: order.agent.phoneNo,
          },
          notification: {
            title: 'Order Completed',
            body: `Your Mopup order #${order.id} has been completed`,
          },
          tokens: order.shop.notificationToken.concat(
            order.agent.notificationToken,
          ),
        });
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

  async remove(orderId: string) {
    const deleteResponse = await this.orderRepository.delete(orderId);
    const firebaseOrderRef = this.firebaseService.db().ref('order');
    firebaseOrderRef.on('value', (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.val().id == orderId) {
          firebaseOrderRef.child(childSnapshot.key).remove();
        }
      });
    });
    if (!deleteResponse.affected) {
      throw new NotFoundException('Order not found');
    }
  }

  private async checkIfHandled(orderId: string) {
    const order = await this.findOne(orderId);
    if (!order) {
      throw new NotFoundException();
    }
    if (order.status === orderStatusEnum.CREATED) {
      order.status = orderStatusEnum.NOT_HANDLED;
      const firebaseOrderRef = this.firebaseService.db().ref('order');
      firebaseOrderRef.on('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          if (childSnapshot.val().id == orderId) {
            firebaseOrderRef.child(childSnapshot.key).set({
              id: order.id,
              shopId: order.shop.id,
              amount: order.amount,
              status: order.status,
              deliveryPeriod: order.deliveryPeriod?.toString(),
              agentName: null,
              agentId: null,
              agentNo: null,
            });
          }
        });
      });
    }
    await order.save();
  }
}
