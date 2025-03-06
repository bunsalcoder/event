/**
 * This for Event Emitter, emits any client that subscribes
 * the event.
 */
import EventEmitter from "events";
import getChannel from "./channel";

const eventEmitter = new EventEmitter();

/**
 * The type of initialing the Event Emitter
 * @member connection - The MQ Connection
 * @member receiver - The exchange name, this is used as event destination
 */
type Connection =
  | {
      host: string;
      port: number | string;
      user: string;
      password: string;
    }
  | any;

type EmitterProps = {
  connection: Connection;
  receiver: string;
};

/**
 * The type extra props in each event emitting. This headers is not
 * used in the current implementation. It's for future ingetration.
 * @member headers - Extra headers information to send along the event
 */
type EmitProps = {
  headers?: any;
};

const getConn = (conn: any) => (typeof conn === "function" ? conn() : conn);

/**
 * Init the Event channel to connect
 * @param {EmitterProps} props - The Emitter properties
 * @return Promise<Channel>
 */
function initChannel(props: EmitterProps) {
  const { connection, receiver } = props;
  return getChannel(connection).then((ch: any) => {
    ch.assertExchange(receiver, "topic", { durable: false });
    return ch;
  });
}

const getDefaultHeaders = (props: EmitProps = {}) => {
  const { headers = {} } = props;
  return headers;
};

/**
 * Initialize the Event Emitter
 * @param {EmitterProps} props - The properties of the Event Emitter
 * @return CallableFunction
 */
export default function initEmitter(props: EmitterProps) {
  const { receiver, connection } = props;
  return (eventName: string, message: any, emitProps: EmitProps = {}) => {
    const conn = getConn(connection);
    if (!(conn || false)) {
      return { error: true, message: "MQ Connection down." };
    }

    const headers = getDefaultHeaders(emitProps);
    const data = JSON.stringify({
      headers: { receiver, ...headers },
      data: message || undefined,
    });

    return initChannel({ ...props, connection: conn })
      .then((ch: any) => {
        eventEmitter.emit(eventName, message);
        console.log("[INFO] Sending an event [%s] to %s", eventName, receiver);
        return ch.publish(receiver, eventName, Buffer.from(data));
      })
      .catch((error: any) => {
        const { message: msg } = error;
        console.error("[ERROR] %s - %s", msg, new Date());
        return error;
      });
  };
}
