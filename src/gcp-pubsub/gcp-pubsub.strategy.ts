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
import { Message, PubSub } from '@google-cloud/pubsub';

import { GCPPubSubContext } from './gcp-pubsub.context';
import { Injectable } from '@nestjs/common';
import { MessageAckMethod } from './enums';
import { PubSubConfig } from './types';

@Injectable()
export class GCPubSubStrategy
  extends Server
  implements CustomTransportStrategy
{
  private readonly config: PubSubConfig = {
    projectId: '',
    subscriptionName: '',
  };

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
    console.log(
      'Listening for Google Cloud Pub/Sub messages...',
    );

    const pubSubClient = new PubSub({ projectId: this.config.projectId });

    const subscription = pubSubClient.subscription(this.config.subscriptionName, {
      flowControl: this.config.flowControl,
      ackDeadline: this.config.ackDeadline,
      batching: this.config.batching,
    });

    subscription.on('message', async (message: Message) =>
      this.handleMessage(message),
    );

    subscription.on('error', (error) => {
      console.error('Subscription error:', error);
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
        new GCPPubSubContext([message, pattern]),
      );
    } else {
      const globalHandler = this.getHandlerByPattern('');
      if (globalHandler) {
        await this.handleEvent(
          '',
          packet as IncomingRequest,
          new GCPPubSubContext([message, pattern]),
        );
      }
    }

    if (this.config.ackMethod === MessageAckMethod.AfterHandlerCallback) {
      message.ack();
    }
  }

  close() {
    console.log('Closing the Google Cloud Pub/Sub connection...');
  }
}
