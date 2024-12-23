import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { Ctx, MessagePattern, Payload } from '@nestjs/microservices';
import { GcpPubSubContext } from './gcp-pubsub';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  private testorrrr = 'testooorr';

  @MessagePattern('customer_signup')
  getHello(@Payload() data: any,
    @Ctx() ctx: GcpPubSubContext,
): string {
    console.log('customer_signup listener..', data);
    ctx.getMessage().ack();
    return this.appService.getHello();
  }

  @MessagePattern('')
  getHello2(
    @Payload('global') message: any,
    @Ctx() ctx: GcpPubSubContext,
  ): string {
    console.log('Global Listener..', message);
    const msg = ctx.getMessage();
    msg.ack();
    return this.appService.getHello();
  }
}
