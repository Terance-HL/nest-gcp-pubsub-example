import { OnApplicationShutdown, OnModuleDestroy } from '@nestjs/common';

import { ShutdownState } from './global-shutdown.state';

export abstract class BaseWorkerService<T>
  implements OnApplicationShutdown, OnModuleDestroy
{
  private messageCount = 0;
  private cleanUpStartedAtTimestamp: Date;
  maxCleanupTime = 300; // in seconds

  abstract processMessages(messages: T[]): Promise<boolean[]>;

  async onApplicationShutdown(signal?: string) {
    console.log('BASE_WORKER::onApplicationShutdown', {
      signal,
      service: this.constructor.name,
    });
    await this.cleanup();
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  async handleMessage(message: T): Promise<boolean> {
    const [processedStatus] = await this.handleMessages([message]);
    return processedStatus;
  }

  async handleMessages(messages: T[]): Promise<boolean[]> {
    this.messageCount += messages.length;
    const messageProcessedStatuses = await this.processMessages(messages);
    this.messageCount -= messages.length;
    return messageProcessedStatuses;
  }

  async waitTillAllMessagesProcessed() {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const timeSinceCleanupStarted =
      (new Date().getTime() - this.cleanUpStartedAtTimestamp.getTime()) / 1000;

    if (
      this.messageCount === 0 ||
      timeSinceCleanupStarted > this.maxCleanupTime
    ) {
      return;
    }
    await this.waitTillAllMessagesProcessed();
  }

  async cleanup() {
    // Ensuring idempotency of cleanup function
    if (this.cleanUpStartedAtTimestamp) {
      return;
    }

    // Setting the global shutdown state to true so that the same can be used within the gcp-pubsub strategy
    ShutdownState.isShuttingDown = true;

    console.log('BASE_WORKER::cleaning up...', {
      pendingMessages: this.messageCount,
    });

    this.cleanUpStartedAtTimestamp = new Date();

    await this.waitTillAllMessagesProcessed();

    console.log('BASE_WORKER:: All cleanup done in the service level', {
      pendingMessages: this.messageCount,
    });
  }
}
