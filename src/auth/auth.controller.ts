import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from 'src/user/entities/user.entity';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async registerNewUser(@Body() registerUserDto: RegisterDto) {
    await this.authService.registerNewUser(registerUserDto);
    return {
      success: true,
      message: 'user registered successfully',
    };
  }

  @HttpCode(200)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async loginUser(@Req() request: Request) {
    const user = (request as any).user as User;
    const data = await this.authService.loginUser(user);
    return {
      success: true,
      message: 'user logged in successfully',
      data: data,
    };
  }
}
