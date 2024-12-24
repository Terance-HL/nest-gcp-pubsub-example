type EventData = {
  name: string;
  email: string;
};

export type CustomerEvent = {
  contactId: string;
  eventType: string;
  eventData: EventData;
  timestamp: string;
};
