import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('')
export class TestController {
  @MessagePattern('order_created')
  async handleEvent(@Payload('orderId') orderId: any): Promise<void> {
    console.log('order_created handler:', orderId);
  }
}
