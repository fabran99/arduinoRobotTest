// Manejo sticks
var leftStickOptions = {
  zone: document.getElementById("left_stick"),
  mode: "static",
  color: "white",
  position: { left: "20%", bottom: "50%" },
};
var leftStickManager = nipplejs.create(leftStickOptions);
var rightStickOptions = {
  zone: document.getElementById("right_stick"),
  mode: "static",
  color: "white",
  position: { left: "80%", bottom: "50%" },
};
var rightStickManager = nipplejs.create(rightStickOptions);
const controller = new ControlHandler(leftStickManager, rightStickManager);

// Manejo socket
var connection = null;
var botIp = "192.168.1.2";
const ipInput = document.getElementById("ipInput");
const connectToIpButton = document.getElementById("connectToIpButton");
const connectToSocket = () => {
  if (connection) {
    console.log(connection);
    connection.onclose = null;
    connection.close();
    connection = null;
    controller.socket = null;
  }
  botIp = ipInput.value;
  connection = new WebSocket(`ws://${botIp}/ws`, ["arduino"]);
  setSocketCallbacks();
};
connectToIpButton.onclick = connectToSocket;

// manejo controles

const onopen = () => {
  controller.socket = connection;
  console.log("Connected: ");
  controller.pollArduino();
  controller.connect();
  connection.onerror = onerror;
  connection.onclose = onclose;
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
    connectToSocket();
    setSocketCallbacks();
    await sleep(5000);
  }
};

const setSocketCallbacks = () => {
  connection.onopen = onopen;
  connection.onmessage = onmessage;
};
