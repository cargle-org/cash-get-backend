import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from './entities/shop.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { BCRYPT_HASH_ROUND } from 'src/utils/constants';

@Injectable()
export class ShopService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(Shop) private readonly shopRepository: Repository<Shop>,
  ) {}

  async create(createShopDto: CreateShopDto) {
    const hashedPass = await bcrypt.hash(
      createShopDto.password,
      BCRYPT_HASH_ROUND,
    );
    const newShopDetails = {
      ...createShopDto,
      password: hashedPass,
    };
    try {
      const newShop = await this.shopRepository.save(newShopDetails);
      return newShop;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findAll() {
    const users = await this.shopRepository.find();
    return users;
  }

  async findOne(shopId: string) {
    const shop = this.shopRepository.findOne({
      relations: {
        agents: true,
      },
      where: {
        id: shopId,
      },
    });

    if (!shop) {
      throw new NotFoundException();
    }
    return shop;
  }

  update(id: number, updateShopDto: UpdateShopDto) {
    return `This action updates a #${id} user`;
  }

  async remove(shopId: string) {
    const deleteResponse = await this.shopRepository.delete(shopId);
    if (!deleteResponse.affected) {
      throw new NotFoundException('Shop not found');
    }
  }

  async findShopByEmail(email: string) {
    const shop = await this.shopRepository.findOne({
      where: {
        email,
      },
    });

    if (!shop) {
      throw new NotFoundException();
    }

    return shop;
  }

  async addAgent(shopId: string, userId: string) {
    const user = await this.userService.findOne(userId);

    const shop = await this.findOne(shopId);

    shop.agents = [...shop.agents, user];

    await shop.save();

    return shop;
  }

  async removeAgent(shopId: string, userId: string) {
    const user = await this.userService.findOne(userId);
    const shop = await this.findOne(shopId);

    shop.agents = shop.agents.filter((agent) => agent.id !== user.id);

    await shop.save();

    return shop;
  }
}
