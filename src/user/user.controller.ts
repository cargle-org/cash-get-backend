import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateNotificationDto } from './dto/update-notifiaction-token.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.userService.create(createUserDto);
    return {
      success: true,
      message: 'agent created successfully',
      data,
    };
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':userId')
  async update(
    @Param('userId') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const data = this.userService.update(id, updateUserDto);
    return {
      success: true,
      message: 'agent updated successfully',
      data,
    };
  }

  @Post('/update-notification-token/:userId')
  async updateNotificationToken(
    @Param('userId') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    const data = this.userService.updateAgentNotificationToken(
      id,
      updateNotificationDto.notificationToken,
    );
    return {
      success: true,
      message: 'agent updated successfully',
      data,
    };
  }

  @Delete(':userId')
  remove(@Param('userId') id: string) {
    return this.userService.remove(id);
  }
}
