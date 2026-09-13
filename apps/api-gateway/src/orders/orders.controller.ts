import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.ordersService.createOrder(createOrderDto, idempotencyKey);
  }

  @Post('payments/wave/webhook')
  @HttpCode(HttpStatus.OK)
  waveWebhook(
    @Req() request: { rawBody?: Buffer },
    @Headers('wave-signature') signature?: string,
  ) {
    return this.ordersService.processWaveWebhook(request.rawBody, signature);
  }
}
