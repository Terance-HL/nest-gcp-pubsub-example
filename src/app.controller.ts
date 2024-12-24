import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { Ctx, MessagePattern, Payload } from '@nestjs/microservices';
import { GcpPubSubContext } from './gcp-pubsub';
import { CustomerEvent } from './types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('customer_signup')
  getHello(
    @Payload() message: CustomerEvent,
    @Ctx() ctx: GcpPubSubContext,
  ): Promise<boolean> {
    // console.log('customer_signup listener..', message);
    // ctx.getMessage().ack();
    return this.appService.handleMessage(message);
  }

  @MessagePattern('')
  getHello2(
    @Payload() message: CustomerEvent,
    @Ctx() ctx: GcpPubSubContext,
  ): Promise<boolean> {
    // console.log('Global Listener..', message);
    // const msg = ctx.getMessage();
    // msg.ack();
    return this.appService.handleMessage(message);
  }
}
