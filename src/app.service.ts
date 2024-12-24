import { BaseWorkerService } from './gcp-pubsub/base-worker.service';
import { CustomerEvent } from './types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService extends BaseWorkerService<CustomerEvent> {
  async processMessages(messages: CustomerEvent[]): Promise<boolean[]> {
    // Use Promise.all to ensure all promises are resolved
    const results = await Promise.all(
      messages.map(
        () =>
          new Promise<boolean>((resolve) => {
            setTimeout(() => {
              // console.log('Message handled!!!!!!');
              resolve(true);
            }, 10000);
          }),
      ),
    );

    return results;
  }
}
