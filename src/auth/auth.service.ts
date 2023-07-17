import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { BCRYPT_HASH_ROUND, UserEnum } from 'src/utils/constants';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { log } from 'console';
import { ShopService } from 'src/shop/shop.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private shopService: ShopService,
    private readonly jwtService: JwtService,
  ) {}

  async loginUser(user: User) {
    const payload = { username: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken: accessToken,
      user: user,
    };
  }

  public async getAuthenticatedUser(email: string, hashedPassword: string) {
    let user = null;
    try {
      user = await this.userService.findUserByEmail(email);
    } catch (error) {
      user = await this.shopService.findShopByEmail(email);
    }

    const isPasswordMatching = await user.comparePasswords(
      user.password,
      hashedPassword,
    );
    if (!isPasswordMatching) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  public async getUser(email: string) {
    let user = null;
    try {
      user = await this.userService.findUserByEmail(email);
    } catch (error) {
      user = await this.shopService.findShopByEmail(email);
    }
    return user;
  }

  public async getAuthenticatedShop(email: string, hashedPassword: string) {
    const shop = await this.shopService.findShopByEmail(email);

    const isPasswordMatching = await shop.comparePasswords(
      shop.password,
      hashedPassword,
    );
    console.log('hashed');
    if (!isPasswordMatching) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    return shop;
  }

  async registerNewUser(registerUserDto: RegisterDto) {
    const hashedPass = await bcrypt.hash(
      registerUserDto.password,
      BCRYPT_HASH_ROUND,
    );
    const newUserDetails = {
      ...registerUserDto,
      password: hashedPass,
    };
    try {
      const newUser = await this.userService.create(newUserDetails);
      return this.loginUser(newUser);
    } catch (error) {
      // if (error?.code == MYSQL_ERROR_CODES.ER_DUP_ENTRY) {
      //   throw new HttpException(error?.sqlMessage, HttpStatus.BAD_REQUEST);
      // }
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
