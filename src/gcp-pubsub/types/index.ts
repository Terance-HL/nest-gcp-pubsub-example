import { MessageAckMethod } from "../enums";

type FlowControlConfig = {
  maxMessages: number;
  allowExcessMessages?: boolean;
  maxExtension?: number;
};

type BatchingConfig = {
  maxMessages: number;
};

export type PubSubConfig = {
  projectId: string;
  subscriptionName: string;
  flowControl?: FlowControlConfig;
  ackDeadline?: number;
  batching?: BatchingConfig;
  routeKey?: string;
  ackMethod?: MessageAckMethod;
};
