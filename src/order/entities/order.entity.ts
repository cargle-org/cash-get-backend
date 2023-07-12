import { Shop } from 'src/shop/entities/shop.entity';
import { User } from 'src/user/entities/user.entity';
import { orderStatusEnum } from 'src/utils/constants';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  address: string;

  @Column()
  amount: number;

  @Column()
  contactName: string;

  @Column()
  contactNumber: string;

  @Column()
  extraInfo: string;

  @OneToOne(() => User)
  @JoinColumn()
  agent: User;

  @OneToOne(() => Shop)
  @JoinColumn()
  shop: Shop;

  @Column()
  agentConfirmed: boolean;

  @Column()
  agentKey: string;

  @Column()
  shopConfirmed: boolean;

  @Column()
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
