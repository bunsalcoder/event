type EventType = {
  callbacks: CallableFunction[];
};

type EmitterType = {
  config: Record<string, any>;
  event: Record<string, EventType>;
};

let registeredEvents: Record<string, EmitterType> = {};

/**
 * Gets all the registered events or just the
 * events of the specific domain/receiver
 * @param {string} receiver - Domain/Receiver
 * @return any;
 */
export const getEvents = (receiver: string = "") => {
  if (receiver === "") return registeredEvents;
  return registeredEvents[receiver] || {};
};

const ofEmitter = (emitter: string) => registeredEvents[emitter] || false;

const getEvent = (emitter: string, eventName: string): EventType => {
  const emitterEvents: any = ofEmitter(emitter) || {};
  return emitterEvents[eventName] || {};
};

/**
 * Stores new event into the stored event
 * @param {EventType} event - Event to be registered
 * @returns all registered events
 */
export function storeEvent(domain: string, event: any) {
  const eventsOfEmitter: any = ofEmitter(domain) || {};
  const { name, callback } = event;
  const { callbacks = [] } = eventsOfEmitter[domain] || {};
  const touchedCallbacks = [...callbacks, callback];
  const updated = {
    [domain]: {
      ...eventsOfEmitter,
      [name]: {
        callbacks: touchedCallbacks,
      },
    },
  };
  registeredEvents = updated;
  return registeredEvents;
}

export function executeEvents(emitter: string, name: string, data: any) {
  const { callbacks } = getEvent(emitter, name);
  callbacks.forEach((callback: CallableFunction) => callback(data));
}
