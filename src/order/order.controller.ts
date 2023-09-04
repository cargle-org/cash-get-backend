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
import { AcceptOrderDto } from './dto/accept-order.dto';

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

  @Post(':id/acceptOrder')
  async acceptAgent(
    @Body() acceptOrderDto: AcceptOrderDto,
    @Param('id') orderId: string,
  ) {
    const data = await this.orderService.agentAccept(
      orderId,
      acceptOrderDto.agentId,
      acceptOrderDto.collectionStatus,
      acceptOrderDto.amount,
    );
    return {
      message: 'Order accepted successfully',
      success: true,
      data,
    };
  }

  @Post(':id/confirmAgent')
  async confirmAgentKey(
    @Body() updateKeyDto: UpdateKeyDto,
    @Param('id') orderCollectionId: string,
  ) {
    const data = await this.orderService.agentConfirm(
      orderCollectionId,
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
    @Param('id') orderCollection: string,
  ) {
    const data = await this.orderService.shopConfirm(
      orderCollection,
      updateKeyDto.key,
    );
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
  async remove(@Param('id') id: string) {
    await this.orderService.remove(id);
    return {
      message: 'Order Deleted successfully',
      success: true,
    };
  }
}
