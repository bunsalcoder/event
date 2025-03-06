import { storeEvent, executeEvents } from "./event";
import getChannel from "./channel";

/**
 * @member connection - The RabbitMQ connection
 * @member name - Name of event host/emitter it listens to
 */
type ReceiverProps = {
  connection: CallableFunction | any;
  name: string;
};

let queuePrv: any;

const getConn = (conn: any) => (typeof conn === "function" ? conn() : conn);

/**
 * Decodes the RabbitMQ message content into JS Object
 * @param {Buffer|string} content - The RabbitMQ mesage
 * @return any
 */
const decodeMessage = (content: any) => JSON.parse(content.toString());

/**
 * Initialize the queue, if the queue already exists or initialized,
 * the existing queue will be used, instead of creating a new one.
 * If the queue not exist, create a new queue, and consuming this queue.
 * @param {Object} props - Binded props from the parent
 * @return created queue
 */
const initQueue = (props: any, channel: any) => {
  if (String(queuePrv) !== "undefined") {
    return Promise.resolve({
      channel,
      queue: queuePrv,
    });
  }

  const { name } = props;
  return channel.assertQueue("", { exclusive: true }).then((queue: any) => {
    console.log("[INFO] New queue created [%s] - %s", queue.queue, new Date());
    queuePrv = queue;
    channel.consume(
      queue.queue,
      (message: any) => {
        const { fields, content } = message;
        const { routingKey: eventName } = fields;
        const { data } = decodeMessage(content);
        executeEvents(name, eventName, data);
      },
      { noAck: true }
    );
    return { channel, queue: queuePrv };
  });
};

const initSubscriber = (
  props: any,
  eventName: string,
  callback: CallableFunction
) => {
  const { connection } = props;
  return getChannel(connection)
    .then((ch: any) => {
      const { name } = props;
      ch.assertExchange(name, "topic", { durable: false });
      return ch;
    })
    .then(initQueue.bind(null, props))
    .then((result: any) => {
      const { channel, queue } = result;
      const { name } = props;
      storeEvent(name, { name: eventName, callback });
      return channel
        .bindQueue(queue.queue, name, eventName)
        .then((bindedChannel: any) => {
          console.log('[INFO] Register event "%s"', eventName);
          return bindedChannel;
        })
        .catch(() => {
          queuePrv = undefined;
          return initSubscriber(props, eventName, callback);
        });
    });
};

function addEventListener(
  props: any,
  eventName: string,
  callback: CallableFunction
) {
  const { connection } = props;
  const conn = getConn(connection);
  if (!(conn || false)) throw new Error("MQ connection is not valie");
  return initSubscriber({ ...props, connection: conn }, eventName, callback);
}

const removeEventListener = (props: any, name: string) => ({ props, name });

export default function receiver(props: ReceiverProps) {
  return {
    addEventListener: addEventListener.bind(null, props),
    removeEventListener: removeEventListener.bind(null, props),
  };
}
