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
import { LocalAuthGuard } from './guards/loginGuard.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async registerNewUser(@Body() registerUserDto: RegisterDto) {
    const data = await this.authService.registerNewUser(registerUserDto);
    return {
      success: true,
      message: 'user registered successfully',
      data,
    };
  }

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
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
