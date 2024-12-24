import { PROJECT_ID, ROUTE_KEY, SUBSCRIPTION_NAME } from './constants';

import { AppModule } from './app.module';
import { GcpPubSubStrategy } from './gcp-pubsub/';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  /**
   * Sample full config example
   * {
    strategy: new GcpPubSubStrategy({
      projectId: 'highlevel-staging',
      subscriptionName: SUBSCRIPTION_NAME,
      flowControl: {
        maxMessages: parseInt(process.env.FLOW_CONTROL_MAX_MESSAGES, 10) || 120,
        allowExcessMessages: false,
        maxExtension: 600,
      },
      ackDeadline: parseInt(process.env.ACK_DEADLINE, 10) || 30,
      batching: {
        maxMessages:
          parseInt(process.env.FLOW_CONTROL_MAX_MESSAGES, 10) * 2 || 240,
      },
      routeKey: 'route',
      ackMethod: MessageAckMethod.Manual,
    }
    */
  // Register the custom transport strategy as a microservice
  // Rest of the configs can be injected by the config service here, rather than reading the environment variables directly
  app.connectMicroservice({
    strategy: new GcpPubSubStrategy({
      projectId: PROJECT_ID,
      subscriptionName: SUBSCRIPTION_NAME,
      routeKey: ROUTE_KEY,
      flowControl: {
        maxMessages: 1000, // no.of messages coming in
        allowExcessMessages: false,
        maxExtension: 60, // maximum duration that Pub/Sub will continue to extend the acknowledgment deadline
      },
      ackDeadline: 30,
    }),
  });

  // Start the microservices and HTTP server
  await app.startAllMicroservices();
  await app.listen(3000); // Optional for HTTP server
}

bootstrap();
