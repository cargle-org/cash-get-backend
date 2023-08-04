import { UserEnum } from 'src/utils/constants';
import * as bcrypt from 'bcryptjs';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Shop extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column()
  public name: string;

  @Column()
  public email: string;

  @Column()
  public address: string;

  @Column()
  public password: string;

  @Column()
  public phoneNo: string;

  @Column({
    type: 'enum',
    enum: UserEnum,
    default: UserEnum.AGENT,
  })
  public role: UserEnum;

  @Column({
    type: 'simple-array',
    default: [],
  })
  public notificationToken: string[];

  @ManyToMany(() => User)
  @JoinTable()
  agents: User[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  async comparePasswords(
    userPassword: string,
    password: string,
  ): Promise<boolean> {
    const result = await bcrypt.compareSync(password, userPassword);
    return result;
  }
}
