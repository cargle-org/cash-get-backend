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
import {
  KEY_LENGTH,
  CollectionStatusEnum,
  OrderStatusEnum,
  CollectionProgressStatusEnum,
} from 'src/utils/constants';
import { FirebaseService } from 'src/firebase/firebase.service';
import { generateKey } from 'src/utils/misc';
import { Reference } from '@firebase/database-types';
import { OrderCollection } from './entities/orderCollection.entity';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class OrderService {
  private logger = new Logger(OrderService.name);
  private firebaseOrderRef: Reference;
  private firebaseOrderCollectionRef: Reference;
  constructor(
    private shopService: ShopService,
    private userService: UserService,
    private configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderCollection)
    private readonly orderCollectionRepository: Repository<OrderCollection>,
    private readonly firebaseService: FirebaseService,
    private readonly notificationService: NotificationService,
  ) {
    this.firebaseOrderRef = firebaseService.db().ref('order');
    this.firebaseOrderCollectionRef = firebaseService
      .db()
      .ref('orderCollection');
  }

  async create(shopId: string, createOrderDto: CreateOrderDto) {
    const shop = await this.shopService.findOne(shopId);
    const orderDetails: Partial<Order> = {
      ...createOrderDto,
      shop: shop,
      remainingAmount: createOrderDto.amount,
    };

    const newOrder = await this.orderRepository.save(orderDetails);
    if (!newOrder) {
      throw new InternalServerErrorException();
    }

    this.firebaseOrderRef.push({
      id: newOrder.id,
      shopId: shop.id,
      amount: newOrder.amount,
      remainingAmount: newOrder.amount,
      status: newOrder.status,
      deliveryPeriod: newOrder.deliveryPeriod?.toString(),
    });

    // await this.firebaseService.messaging().send({
    //   data: {
    //     id: `${newOrder.id}`,
    //     shopId: `${shop.id}`,
    //     amount: newOrder.amount.toString(),
    //     status: newOrder.status,
    //     deliveryPeriod: newOrder.deliveryPeriod?.toString(),
    //     agentName: '',
    //     agentId: '',
    //     agentNo: '',
    //   },
    //   notification: {
    //     title: 'New Mopup Request',
    //     body: `Shop ${shop.name} has posted a new order`,
    //   },
    //   topic: 'agent',
    // });
    this.notificationService.sendNotificationToAgents(
      {
        title: 'New Mopup Request',
        body: `Shop ${shop.name} has posted a new order`,
      },
      {
        id: `${newOrder.id}`,
        shopId: `${shop.id}`,
        amount: newOrder.amount.toString(),
        status: newOrder.status,
        deliveryPeriod: newOrder.deliveryPeriod?.toString(),
        agentName: '',
        agentId: '',
        agentNo: '',
      },
    );

    const currentTime = new Date().getTime();
    const endTime = new Date(newOrder.deliveryPeriod).getTime();

    setTimeout(() => {
      this.checkIfHandled(newOrder.id);
    }, endTime - currentTime);
    return newOrder;
  }

  async agentAccept(
    orderId: string,
    agentId: string,
    collectionStatus: CollectionStatusEnum,
    amount: number,
  ) {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Could not find Order');
    }

    const agent = await this.userService.findOne(agentId);
    const shop = await this.shopService.findOne(order.shop as any);

    const agentKey = generateKey(KEY_LENGTH, agent.role);
    const shopKey = generateKey(KEY_LENGTH, shop.role);
    const orderCollectionDetails: Partial<OrderCollection> = {
      order: order,
      collectionStatus: collectionStatus,
      amount: amount,
      agent: agent,
      agentKey: agentKey,
      shopKey: shopKey,
      deliveryPeriod: order.deliveryPeriod,
    };

    order.status = OrderStatusEnum.IN_PROGRESS;
    order.remainingAmount = order.remainingAmount - amount;
    const orderCollection = await this.orderCollectionRepository.save(
      orderCollectionDetails,
    );
    this.firebaseOrderRef.on('value', (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.val().id == orderId) {
          this.firebaseOrderRef.child(childSnapshot.key).set({
            id: order.id,
            shopId: shop.id,
            amount: order.amount,
            status: order.status,
            deliveryPeriod: order.deliveryPeriod?.toString(),
            remainingAmount: order.remainingAmount,
          });
        }
      });
    });

    this.firebaseOrderCollectionRef.push({
      id: orderCollection.id,
      orderId: order.id,
      shopName: shop.name,
      shopAddress: shop.address,
      shopId: shop.id,
      amount: amount,
      agentId: agent.id,
      agentName: orderCollection.agent.name,
      agentNo: orderCollection.agent.phoneNo,
      collectionStatus: orderCollection.collectionStatus,
      collectionProgressStatus: orderCollection.collectionProgressStatus,
      deliveryPeriod: order.deliveryPeriod?.toISOString(),
    });

    // this.firebaseService.messaging().sendEachForMulticast({
    //   data: {
    //     // id: order.id,
    //     // shopId: order.shop.id,
    //     // amount: order.amount.toString(),
    //     // status: order.status,
    //     // deliveryPeriod: order.deliveryPeriod.toString(),
    //     // agentName: order.agent.name,
    //     // agentId: order.agent.id,
    //     // agentNo: order.agent.phoneNo,
    //   },
    //   notification: {
    //     title: 'Mopup Request Accepted',
    //     body: `Agent ${agent.name} has accepted your order`,
    //   },
    //   tokens: agent.notificationToken,
    // });
    this.notificationService.sendNotificationToOne(
      {
        title: 'Mopup Request Accepted',
        body: `Agent ${agent.name} has accepted your order`,
      },
      {
        id: order.id,
        shopId: order.shop.id,
        amount: amount.toString(),
        status: order.status,
        deliveryPeriod: order.deliveryPeriod.toString(),
        agentName: orderCollection.agent.name,
        agentId: orderCollection.agent.phoneNo,
        agentNo: orderCollection.agent.phoneNo,
      },
      agent.notificationToken,
    );

    await order.save();
    return order;
  }

  async agentConfirm(orderCollectionId: string, agentKey: string) {
    const orderCollection = await this.findOneCollection(orderCollectionId);
    const order = await this.findOne((orderCollection.order as Order).id);
    if (orderCollection.agentKey === agentKey) {
      orderCollection.agentConfirmed = true;
      if (orderCollection.shopConfirmed) {
        orderCollection.collectionProgressStatus =
          CollectionProgressStatusEnum.COMPLETED;
        this.firebaseOrderCollectionRef.on('value', (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().id == orderCollectionId) {
              this.firebaseOrderRef.child(childSnapshot.key).set({
                id: orderCollection.id,
                shopId: order.shop.id,
                amount: orderCollection.amount,
                agentId: orderCollection.agent.id,
                agentName: orderCollection.agent.name,
                agentNo: orderCollection.agent.phoneNo,
                collectionStatus: orderCollection.collectionStatus,
                collectionProgressStatus:
                  orderCollection.collectionProgressStatus,
                deliveryPeriod: order.deliveryPeriod?.toString(),
              });
            }
          });
        });
        this.notificationService.sendNotificationToOne(
          {
            title: 'Order Completed',
            body: `Your Mopup order #${orderCollection.id} has been completed`,
          },
          {
            id: orderCollection.id,
            shopId: order.shop.id,
            amount: orderCollection.amount,
            agentId: orderCollection.agent.id,
            agentName: orderCollection.agent.name,
            agentNo: orderCollection.agent.phoneNo,
            collectionStatus: orderCollection.collectionStatus,
            collectionProgressStatus: orderCollection.collectionProgressStatus,
            deliveryPeriod: order.deliveryPeriod?.toString(),
          },
          order.shop.notificationToken.concat(
            orderCollection.agent.notificationToken,
          ),
        );
      }
      if (orderCollection.collectionStatus == CollectionStatusEnum.FULL) {
        order.status = OrderStatusEnum.COMPLETED;
        this.firebaseOrderRef.on('value', (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().id == order.id) {
              this.firebaseOrderRef.child(childSnapshot.key).set({
                id: order.id,
                shopId: order.shop.id,
                amount: order.amount,
                status: order.status,
                deliveryPeriod: order.deliveryPeriod?.toString(),
                remainingAmount: order.remainingAmount,
              });
            }
          });
        });
        this.notificationService.sendNotificationToOne(
          {
            title: 'Agent Confirmed Order',
            body: `Your Mopup order has been confirmed by agent, please enter Agent key to complete`,
          },
          {
            id: orderCollection.id,
            shopId: order.shop.id,
            amount: orderCollection.amount,
            agentId: orderCollection.agent.id,
            agentName: orderCollection.agent.name,
            agentNo: orderCollection.agent.phoneNo,
            collectionStatus: orderCollection.collectionStatus,
            collectionProgressStatus: orderCollection.collectionProgressStatus,
            deliveryPeriod: order.deliveryPeriod?.toString(),
          },
          order.shop.notificationToken,
        );
      }
    } else {
      throw new ForbiddenException('Wrong Agent Key');
    }

    await orderCollection.save();
    await order.save();

    return orderCollection;
  }

  async shopConfirm(orderCollectionId: string, shopKey: string) {
    const orderCollection = await this.findOneCollection(orderCollectionId);
    const order = await this.findOne((orderCollection.order as Order).id);

    if (orderCollection.shopKey === shopKey) {
      orderCollection.shopConfirmed = true;
      if (orderCollection.agentConfirmed) {
        orderCollection.collectionProgressStatus =
          CollectionProgressStatusEnum.COMPLETED;
        this.firebaseOrderCollectionRef.on('value', (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().id == orderCollectionId) {
              this.firebaseOrderRef.child(childSnapshot.key).set({
                id: orderCollection.id,
                shopId: order.shop.id,
                amount: orderCollection.amount,
                agentId: orderCollection.agent.id,
                agentName: orderCollection.agent.name,
                agentNo: orderCollection.agent.phoneNo,
                collectionStatus: orderCollection.collectionStatus,
                collectionProgressStatus:
                  orderCollection.collectionProgressStatus,
                deliveryPeriod: order.deliveryPeriod?.toString(),
              });
            }
          });
        });
        // this.firebaseService.messaging().sendEachForMulticast({
        //   data: {
        //     // id: order.id,
        //     // shopId: order.id,
        //     // amount: order.amount.toString(),
        //     // status: order.status,
        //     // deliveryPeriod: order.deliveryPeriod?.toString(),
        //     // agentName: order.agent.name,
        //     // agentId: order.agent.id,
        //     // agentNo: order.agent.phoneNo,
        //   },
        //   notification: {
        //     title: 'Order Completed',
        //     body: `Your Mopup order #${orderCollection.id} has been completed`,
        //   },
        //   tokens: orderCollection.shop.notificationToken.concat(
        //     orderCollection.agent.notificationToken,
        //   ),
        // });
        this.notificationService.sendNotificationToOne(
          {
            title: 'Order Completed',
            body: `Your Mopup order #${orderCollection.id} has been completed`,
          },
          {
            id: orderCollection.id,
            shopId: order.shop.id,
            amount: orderCollection.amount,
            agentId: orderCollection.agent.id,
            agentName: orderCollection.agent.name,
            agentNo: orderCollection.agent.phoneNo,
            collectionStatus: orderCollection.collectionStatus,
            collectionProgressStatus: orderCollection.collectionProgressStatus,
            deliveryPeriod: order.deliveryPeriod?.toString(),
          },
          order.shop.notificationToken.concat(
            orderCollection.agent.notificationToken,
          ),
        );
      }
      if (orderCollection.collectionStatus == CollectionStatusEnum.FULL) {
        order.status = OrderStatusEnum.COMPLETED;
        this.firebaseOrderRef.on('value', (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().id == order.id) {
              this.firebaseOrderRef.child(childSnapshot.key).set({
                id: order.id,
                shopId: order.shop.id,
                amount: order.amount,
                status: order.status,
                deliveryPeriod: order.deliveryPeriod?.toString(),
                remainingAmount: order.remainingAmount,
              });
            }
          });
          this.notificationService.sendNotificationToOne(
            {
              title: 'Shop Confirmed Order',
              body: `Your Mopup order has been confirmed by shop, please enter Shop key to complete`,
            },
            {
              id: orderCollection.id,
              shopId: order.shop.id,
              amount: orderCollection.amount,
              agentId: orderCollection.agent.id,
              agentName: orderCollection.agent.name,
              agentNo: orderCollection.agent.phoneNo,
              collectionStatus: orderCollection.collectionStatus,
              collectionProgressStatus:
                orderCollection.collectionProgressStatus,
              deliveryPeriod: order.deliveryPeriod?.toString(),
            },
            orderCollection.agent.notificationToken,
          );
        });
      }
    } else {
      throw new ForbiddenException('Wrong Shop Key');
    }

    await orderCollection.save();
    return orderCollection;
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
        shop: true,
        orderCollections: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Could not find Order');
    }
    return order;
  }

  async findOneCollection(collectionId: string) {
    const orderCollection = await this.orderCollectionRepository.findOne({
      where: {
        id: collectionId,
      },
      relations: {
        order: true,
        agent: true,
      },
    });
    if (!orderCollection) {
      throw new NotFoundException('Could not find Order Collection');
    }
    return orderCollection;
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
    if (order.status === OrderStatusEnum.CREATED) {
      order.status = OrderStatusEnum.NOT_HANDLED;
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
