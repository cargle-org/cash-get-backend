import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEnum } from 'src/utils/constants';

@Entity({
  name: '_user',
})
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column()
  public name: string;

  @Column({
    unique: true,
  })
  public email: string;

  @Column()
  public address: string;

  @Column()
  public password: string;

  @Column({
    unique: true,
  })
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
