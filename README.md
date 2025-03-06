# Event

The Event package is to facilitate the Event-Driven Architecture, where we have
the *Emitter* and *Receiver* actors on stage. This Event-Driven architecture uses
*RabbitMQ* as medium. So make sure you already have the *RabbitQM* service up and
running.  So, as the connection to *RabbitMQ* is very expensive, we strongly
recommend to use only on connection per architecture of this Event-Driven.

## Receiver/Event Server

Receiver (or we name it as *Event Server*) is the event receiving actor, which
listens to define event and will fire the event if the *Emitter* raises the event.
As we may have many event names the same names across the system, so we group
the *Event Server* by name.

### Register Events

To server the events, we need to register the event listener the event. The
following example is to create and event server under the ``order-event`` name,
and connects to the RabbitMQ of ``connection``.

```ts
import { receiver, type ReceiverProps } from '@core/event';

const eventServer = receiver({
  connection,
  name: 'order-event'
});

export default function registerEvents(connection: MQConnection) {
  const { addEventListener } = eventServer;

  addEventListener('order.create', (order: any) => {
    console.log('New order created...');
  });

  addEventListener('order.cancel', (orderId: number, reason: any) =>  {
    console.log('Order cancelled');
    console.table({ orderId, reason });
  });
}
```

## Emitter

Emitter is the Event Raiser, it fires an event to the event server. To make
this wors, the *Emiiter* needs to connect to the same *RabbitMQ* as the 
Event SErver that is need to raise the event to, otherwise, it cannot
reach the Event Server and leads to event not triggered.
