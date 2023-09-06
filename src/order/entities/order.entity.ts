import { Shop } from 'src/shop/entities/shop.entity';
import { User } from 'src/user/entities/user.entity';
import { CollectionStatusEnum, OrderStatusEnum } from 'src/utils/constants';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderCollection } from './orderCollection.entity';

@Entity()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  address: string;

  @Column()
  amount: number;

  @Column()
  contactName: string;

  @Column()
  contactNumber: string;

  @Column({
    nullable: true,
  })
  extraInfo: string;

  @ManyToOne(() => Shop)
  @JoinColumn()
  shop: Shop;

  @OneToMany(() => OrderCollection, (orderCollection) => orderCollection.order)
  orderCollections: OrderCollection[];

  @Column()
  deliveryPeriod: Date;

  @Column({
    type: 'enum',
    enum: OrderStatusEnum,
    default: OrderStatusEnum.CREATED,
  })
  status: OrderStatusEnum;

  @Column({ default: 0 })
  remainingAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
