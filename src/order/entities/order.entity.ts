import { Shop } from 'src/shop/entities/shop.entity';
import { User } from 'src/user/entities/user.entity';
import { orderStatusEnum } from 'src/utils/constants';
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

  @ManyToOne(() => User)
  @JoinColumn()
  agent: User;

  @ManyToOne(() => Shop)
  @JoinColumn()
  shop: Shop;

  @Column({
    default: false,
  })
  agentConfirmed: boolean;

  @Column({
    nullable: true,
  })
  agentKey: string;

  @Column({
    default: false,
  })
  shopConfirmed: boolean;

  @Column({
    nullable: true,
  })
  shopKey: string;

  @Column({
    type: 'enum',
    enum: orderStatusEnum,
    default: orderStatusEnum.CREATED,
  })
  status: orderStatusEnum;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
