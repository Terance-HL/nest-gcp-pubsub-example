import {
  CustomTransportStrategy,
  IncomingRequest,
  Server,
} from '@nestjs/microservices';
import {
  DEFAULT_ACK_DEADLINE,
  DEFAULT_ACK_METHOD,
  DEFAULT_FLOW_CONTROL_MAX_MESSAGES,
} from 'src/gcp-pubsub/constants';
import { Message, PubSub, Subscription } from '@google-cloud/pubsub';

import { GcpPubSubContext } from './gcp-pubsub.context';
import { Injectable } from '@nestjs/common';
import { MessageAckMethod } from './enums';
import { PubSubConfig } from './types';
import { ShutdownState } from './global-shutdown.state';

@Injectable()
export class GcpPubSubStrategy
  extends Server
  implements CustomTransportStrategy
{
  private readonly config: PubSubConfig = {
    projectId: '',
    subscriptionName: '',
  };
  private subscription: Subscription;
  private isSubscriptionClosed: boolean;

  constructor(config: PubSubConfig) {
    super();

    this.config.projectId = config.projectId;
    this.config.subscriptionName = config.subscriptionName;
    this.config.flowControl = {
      maxMessages:
        config.flowControl?.maxMessages || DEFAULT_FLOW_CONTROL_MAX_MESSAGES,
      ...config.flowControl,
    };
    this.config.ackDeadline = config.ackDeadline || DEFAULT_ACK_DEADLINE;
    this.config.batching = config.batching;
    this.config.ackMethod = config.ackMethod || DEFAULT_ACK_METHOD;
    this.config.routeKey = config.routeKey;

    this.initializeSerializer(this.config);
    this.initializeDeserializer(this.config);
  }

  listen(callback: () => void) {
    console.log('PUBSUB::Listening for Google Cloud Pub/Sub messages...');

    const pubSubClient = new PubSub({ projectId: this.config.projectId });

    this.subscription = pubSubClient.subscription(
      this.config.subscriptionName,
      {
        flowControl: this.config.flowControl,
        ackDeadline: this.config.ackDeadline,
        batching: this.config.batching,
      },
    );

    this.subscription.on('message', async (message: Message) => {
      if (ShutdownState.isShuttingDown) {
        this.close();
        return;
      }

      return this.handleMessage(message);
    });

    this.subscription.on('error', (error) => {
      console.error('PUBSUB::Subscription error:', error);
      this.close();
    });

    callback();
  }

  async handleMessage(message: Message) {
    if (this.config.ackMethod === MessageAckMethod.OnDelivery) {
      message.ack();
    }

    const { data, attributes } = message;
    const rawMessage = JSON.parse(data.toString());

    const packet = this.deserializer.deserialize({
      data: rawMessage,
      id: attributes.id,
      pattern: attributes[this.config.routeKey],
    }) as IncomingRequest;

    const pattern = packet.pattern;
    const patternSpecificHandler = this.getHandlerByPattern(pattern);

    if (patternSpecificHandler) {
      await this.handleEvent(
        pattern,
        packet as IncomingRequest,
        new GcpPubSubContext([message, pattern]),
      );
    } else {
      const globalHandler = this.getHandlerByPattern('');
      if (globalHandler) {
        await this.handleEvent(
          '',
          packet as IncomingRequest,
          new GcpPubSubContext([message, pattern]),
        );
      }
    }

    if (this.config.ackMethod === MessageAckMethod.AfterHandlerCallback) {
      message.ack();
    }
  }

  async close() {
    // Ensuring idempotency of the close method
    if (this.isSubscriptionClosed) {
      return;
    }

    console.log('PUBSUB::Closing the Google Cloud Pub/Sub connection...');

    this.isSubscriptionClosed = true;

    await new Promise((resolve) => {
      this.subscription.close(() => {
        console.log('PUBSUB::Subscription has been closed!');
        resolve(true);
      });
    });
  }
}
