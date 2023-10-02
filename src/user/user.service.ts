import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_HASH_ROUND } from 'src/utils/constants';
import { FirebaseService } from 'src/firebase/firebase.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPass = await bcrypt.hash(
      createUserDto.password,
      BCRYPT_HASH_ROUND,
    );
    const newUserDetails = {
      ...createUserDto,
      password: hashedPass,
    };
    try {
      const newUser = await this.userRepository.save(newUserDetails);
      return newUser;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findAll() {
    const users = await this.userRepository.find();
    return users;
  }

  async findOne(userId: string) {
    const user = this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const agent = await this.findOne(id);
    for (const key in updateUserDto) {
      if (key === 'password') {
        const hashedPass = await bcrypt.hash(
          updateUserDto.password,
          BCRYPT_HASH_ROUND,
        );
        agent.password = hashedPass;
      }
      agent[key] = updateUserDto[key];
    }
  }

  async remove(userId: string) {
    const deleteResponse = await this.userRepository.delete(userId);
    if (!deleteResponse.affected) {
      throw new NotFoundException('User not found');
    }
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async updateAgentNotificationToken(
    agentId: string,
    notificationToken: string,
  ) {
    const agent = await this.findOne(agentId);
    if (!agent.notificationToken.includes(notificationToken)) {
      agent.notificationToken = [...agent.notificationToken, notificationToken];
      await agent.save();
      this.notificationService.addToAgents(agent.notificationToken);
    }
    return agent;
  }
}
