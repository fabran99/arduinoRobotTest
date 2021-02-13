const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SERVO_MOVEMENT_FACTOR = 15;

// Manejo sliders
const leftSlider = document.getElementById("lslider");
const rightSlider = document.getElementById("rslider");

class ControlHandler {
  constructor(leftStickManager, rightStickManager) {
    this.leftStick = leftStickManager;
    this.leftStick.on("end", (data) => {
      this.leftStick[0].frontPosition = { x: 0, y: 0 };
    });
    this.rightStick = rightStickManager;
    this.rightStick.on("end", (data) => {
      this.rightStick[0].frontPosition = { x: 0, y: 0 };
    });
    this.controller = null;
    this.buttons = [];

    for (let i = 0; i < 12; i++) {
      this.buttons.push(i);
    }

    this.buttonsStatus = [];
    this.axesStatus = [];

    this.servo1Pos = 90;
    this.servo2Pos = 90;
    this.servo3Pos = 90;
    this.servo4Pos = 90;

    this.leftMotorSpeed = 0;
    this.rightMotorSpeed = 0;
    this.motorsLim = 1023;

    this.servo1Lim = [0, 180];
    this.servo2Lim = [0, 180];
    this.servo3Lim = [0, 180];
    this.servo4Lim = [0, 180];

    this.socket = null;
    this.lastTimeSended = 0;
    this.connect();
  }

  receiveCurrentValues(data) {
    this.servo1Pos = data.pos[0];
    this.servo2Pos = data.pos[1];
    this.servo3Pos = data.pos[2];
    leftSlider.value = this.servo3Pos;
    // this.servo4Pos = data.pos4;
    console.log(this);
  }

  async pollArduino() {
    let data = {
      command: "getServoPos",
    };
    connection.send(JSON.stringify(data));
    await sleep(25000);
  }

  connect() {
    console.log("Conectado");
    this.runLoop();
  }

  roundValues() {
    this.servo1Pos = Math.round(this.servo1Pos);
    this.servo2Pos = Math.round(this.servo2Pos);
    this.servo3Pos = Math.round(this.servo3Pos);
    this.servo4Pos = Math.round(this.servo4Pos);

    this.leftMotorSpeed = Math.round(this.leftMotorSpeed);
    this.rightMotorSpeed = Math.round(this.rightMotorSpeed);
  }

  getValArray() {
    return [
      this.servo1Pos,
      this.servo2Pos,
      this.servo3Pos,
      this.servo4Pos,
      this.leftMotorSpeed,
      this.rightMotorSpeed,
    ];
  }

  async sendNewControls() {
    if (!this.socket) {
      await sleep(1000);
      return;
    }
    let shouldUpdate = false;

    // =============================================
    // Controlo motores con stick izquierdo
    // =============================================
    // Stick izquierdo eje x
    let leftStickX = Math.round(this.axesStatus[0]);
    let leftStickY = Math.round(this.axesStatus[1]);

    let leftMotorSpeed = this.leftMotorSpeed;
    let rightMotorSpeed = this.rightMotorSpeed;

    // Adelante
    if (leftStickX == 0 && leftStickY == -1) {
      leftMotorSpeed = 1023;
      rightMotorSpeed = 1023;
    }
    // Atras
    else if (leftStickX == 0 && leftStickY == 1) {
      leftMotorSpeed = -1023;
      rightMotorSpeed = -1023;
    }
    // Quieto
    else if (leftStickX == 0 && leftStickY == 0) {
      leftMotorSpeed = 0;
      rightMotorSpeed = 0;
    }
    // Giro derecha
    else if (leftStickX == 1 && leftStickY == -1) {
      leftMotorSpeed = 1023;
      rightMotorSpeed = 0;
    } else if (leftStickX == -1 && leftStickY == -1) {
      leftMotorSpeed = 0;
      rightMotorSpeed = 1023;
    } else if (leftStickX == -1 && leftStickY == 1) {
      leftMotorSpeed = 0;
      rightMotorSpeed = -1023;
    } else if (leftStickX == 1 && leftStickY == 1) {
      leftMotorSpeed = -1023;
      rightMotorSpeed = 0;
    } else if (leftStickX == 1 && leftStickY == 0) {
      leftMotorSpeed = 1023;
      rightMotorSpeed = -1023;
    } else if (leftStickX == -1 && leftStickY == 0) {
      leftMotorSpeed = -1023;
      rightMotorSpeed = 1023;
    }

    if (this.leftMotorSpeed != leftMotorSpeed) {
      this.leftMotorSpeed = leftMotorSpeed;
      shouldUpdate = true;
    }
    if (this.rightMotorSpeed != rightMotorSpeed) {
      this.rightMotorSpeed = rightMotorSpeed;
      shouldUpdate = true;
    }

    // ===========================================
    // Manejo servos
    // ===========================================

    // Stick derecho eje x
    let rightStickX = this.axesStatus[2];
    let prevServo1Pos = this.servo1Pos;
    this.servo1Pos = this.servo1Pos + rightStickX * -1 * SERVO_MOVEMENT_FACTOR;
    if (this.servo1Pos > this.servo1Lim[1]) {
      this.servo1Pos = this.servo1Lim[1];
    } else if (this.servo1Pos < this.servo1Lim[0]) {
      this.servo1Pos = this.servo1Lim[0];
    }
    if (prevServo1Pos != this.servo1Pos) {
      shouldUpdate = true;
    }
    // Stick derecho eje Y
    let rightStickY = this.axesStatus[5];
    let prevServo2Pos = this.servo2Pos;
    this.servo2Pos = this.servo2Pos + rightStickY * SERVO_MOVEMENT_FACTOR;
    if (this.servo2Pos > this.servo2Lim[1]) {
      this.servo2Pos = this.servo2Lim[1];
    } else if (this.servo2Pos < this.servo2Lim[0]) {
      this.servo2Pos = this.servo2Lim[0];
    }
    if (prevServo2Pos != this.servo2Pos) {
      shouldUpdate = true;
    }

    // Uso r1 y l1 para un servo
    let currentRvalue = parseInt(leftSlider.value);

    if (currentRvalue != this.servo3Pos) {
      shouldUpdate = true;
    }
    this.servo3Pos = currentRvalue;

    // Mando a redondear los valores
    this.roundValues();

    // Si paso mucho sin actualizar mando todo
    if (new Date().getTime() - this.lastTimeSended > 10000) {
      shouldUpdate = true;
    }

    console.log(shouldUpdate);

    if (shouldUpdate) {
      let message = { pos: this.getValArray(), command: "move" };
      this.lastTimeSended = new Date().getTime();
      console.log(message);
      this.socket.send(JSON.stringify(message));
      await sleep(100);
    } else {
      await sleep(50);
    }
  }

  async runLoop() {
    if (this.socket) {
      this.updateValues();
      await this.sendNewControls();
      await sleep(50);
      this.runLoop();
    }
  }

  updateValues() {
    let leftStickPos = this.leftStick[0].frontPosition;
    let rightStickPos = this.rightStick[0].frontPosition;
    this.axesStatus = [
      leftStickPos.x / 50,
      leftStickPos.y / 50,
      rightStickPos.x / 50,
      null,
      null,
      rightStickPos.y / 50,
    ];
    console.log(this.axesStatus);
  }
}
