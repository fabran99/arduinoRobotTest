// manejo controles
const controller = new ControlHandler();

window.addEventListener("gamepadconnected", (evt) => {
  controller.connect(evt);
});
window.addEventListener("gamepaddisconnected", (evt) => {
  controller.disconnect(evt);
});

// Manejo socket
var connection = new WebSocket("ws://192.168.1.9/ws", ["arduino"]);

const onopen = () => {
  controller.socket = connection;
  console.log("Connected: ");
  controller.pollArduino();
};

const onmessage = (e) => {
  const data = JSON.parse(e.data);

  if (data["messageType"] == "getServoPos") {
    controller.receiveCurrentValues(data);
  }
};

const onerror = (error) => {
  controller.socket = null;
  console.log("WebSocket Error ", error);
};
const onclose = async () => {
  controller.socket = null;
  console.log("WebSocket connection closed");
  await sleep(3000);
  connection = null;
  while (!connection || !connection) {
    console.log("reintentando conexion");
    connection = new WebSocket("ws://192.168.1.9/ws", ["arduino"]);
    setSocketCallbacks();
    await sleep(5000);
  }
};

const setSocketCallbacks = () => {
  connection.onopen = onopen;
  connection.onerror = onerror;
  connection.onmessage = onmessage;
  connection.onclose = onclose;
};

setSocketCallbacks();
