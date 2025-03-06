let channelPrv: any;
let channelInitializing: boolean = false;

const getChannel = () => channelPrv;

const setChannel = (channel: any) => {
  channelPrv = channel;
  return getChannel();
};

function onChannelError(error: any) {
  const { message = "unknow" } = error || {};
  console.error({ error });
  console.error("[ERROR] %s - %s", message, new Date());
  setChannel(undefined);
  channelInitializing = false;
}

function getConn(conn: any) {
  return typeof conn === "function" ? conn() : conn;
}

export default function initChannel(conn: any): Promise<any> {
  if (String(channelPrv) !== "undefined") {
    return Promise.resolve(channelPrv);
  }

  if (channelInitializing) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        return resolve(initChannel(conn));
      }, 100);
    });
  }

  channelInitializing = true;
  const connection = getConn(conn);

  return connection
    .createChannel()
    .then(setChannel)
    .then((ch: any) => {
      console.log("[INFO] Channel for Event is created - %s", new Date());
      channelInitializing = false;
      ch.on("error", onChannelError);
      ch.on("close", onChannelError);
      return getChannel();
    });
}
