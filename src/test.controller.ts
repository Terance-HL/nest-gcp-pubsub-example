import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { CustomerEvent } from './types';

@Controller('')
export class TestController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('order_created')
  async handleEvent(@Payload() message: CustomerEvent): Promise<boolean> {
    return this.appService.handleMessage(message);
  }
}
