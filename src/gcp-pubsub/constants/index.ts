import { MessageAckMethod } from "src/gcp-pubsub/enums";

export const DEFAULT_ACK_DEADLINE = 30;
export const DEFAULT_FLOW_CONTROL_MAX_MESSAGES = 120;
export const DEFAULT_ACK_METHOD = MessageAckMethod.AfterHandlerCallback;