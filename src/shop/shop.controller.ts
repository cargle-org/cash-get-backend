import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  async create(@Body() createShopDto: CreateShopDto) {
    const data = await this.shopService.create(createShopDto);
    return {
      success: true,
      message: 'shop created successfully',
      data,
    };
  }

  @Get()
  findAll() {
    return this.shopService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShopDto: UpdateShopDto) {
    return this.shopService.update(+id, updateShopDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopService.remove(id);
  }

  @Post('addAgent/:shopId')
  addAgent(
    @Param('shopId') shopId: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.shopService.addAgent(shopId, updateAgentDto.shopId);
  }

  @Post('removeAgent/:shopId')
  removeAgent(
    @Param('shopId') shopId: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.shopService.removeAgent(shopId, updateAgentDto.shopId);
  }
}
