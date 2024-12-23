import { BaseRpcContext } from '@nestjs/microservices';
import { Message } from '@google-cloud/pubsub';

export class GCPPubSubContext extends BaseRpcContext {
  constructor(args: [Message, string]) {
    super(args);
  }

  getPattern(): string {
    return this.args[1] as unknown as string;
  }

  getMessage(): Message {
    return this.args[0] as unknown as Message;
  }
}
