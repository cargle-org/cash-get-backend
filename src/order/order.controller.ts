import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateKeyDto } from './dto/update-key.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post(':shopId')
  async create(
    @Param('shopId') shopId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const data = await this.orderService.create(shopId, createOrderDto);
    return {
      message: 'Order created successfully',
      success: true,
      data,
    };
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.orderService.findOne(id);
    return {
      message: 'Order fetched successfully',
      success: true,
      data,
    };
  }

  @Post(':id/confirmAgent')
  async confirmAgentKey(
    @Body() updateKeyDto: UpdateKeyDto,
    @Param('id') orderId: string,
  ) {
    const data = await this.orderService.agentConfirm(
      orderId,
      updateKeyDto.key,
    );
    return {
      message: 'Agent Confirmed successfully',
      success: true,
      data,
    };
  }

  @Post(':id/confirmShop')
  async confirmShopKey(
    @Body() updateKeyDto: UpdateKeyDto,
    @Param('id') orderId: string,
  ) {
    const data = await this.orderService.shopConfirm(orderId, updateKeyDto.key);
    return {
      message: 'Shop Confirmed successfully',
      success: true,
      data,
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
