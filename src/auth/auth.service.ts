import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { BCRYPT_HASH_ROUND } from 'src/utils/constants';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    // private mailService: MailService,
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
    const user = await this.userService.findUserByEmail(email);
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
      return newUser;
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
