import { Shop } from 'src/shop/entities/shop.entity';
import { User } from 'src/user/entities/user.entity';
import {
  CollectionProgressStatusEnum,
  CollectionStatusEnum,
  OrderStatusEnum,
} from 'src/utils/constants';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class OrderCollection extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  amount: number;

  @ManyToOne(() => User)
  @JoinColumn()
  agent: User;

  @ManyToOne(() => Order)
  @JoinColumn()
  order: Order | string;

  @Column()
  deliveryPeriod: Date;

  @Column({
    type: 'enum',
    enum: CollectionStatusEnum,
    default: CollectionStatusEnum.FULL,
  })
  collectionStatus: CollectionStatusEnum;

  @Column({
    type: 'enum',
    enum: CollectionProgressStatusEnum,
    default: CollectionProgressStatusEnum.STARTED,
  })
  collectionProgressStatus: CollectionProgressStatusEnum;

  @Column({
    nullable: true,
  })
  shopKey: string;

  @Column({
    default: false,
  })
  shopConfirmed: boolean;

  @Column({
    nullable: true,
  })
  agentKey: string;

  @Column({
    default: false,
  })
  agentConfirmed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
