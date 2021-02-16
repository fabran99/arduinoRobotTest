const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SERVO_MOVEMENT_FACTOR = 10;

class ControlHandler {
  constructor() {
    this.controller = null;
    this.buttons = [];

    for (let i = 0; i < 12; i++) {
      this.buttons.push(i);
    }

    this.buttonsCache = [];
    this.buttonsStatus = [];
    this.axesStatus = [];

    this.servo1Pos = 90;
    this.servo2Pos = 90;
    this.servo3Pos = 90;
    this.servo4Pos = 90;

    this.leftMotorSpeed = 0;
    this.rightMotorSpeed = 0;
    this.motorsLim = 255;

    this.servo1Lim = [0, 180];
    this.servo2Lim = [0, 180];
    this.servo3Lim = [0, 180];
    this.servo4Lim = [50, 165];

    this.socket = null;
    this.lastTimeSended = 0;
  }

  receiveCurrentValues(data) {
    this.servo1Pos = data.pos[0];
    this.servo2Pos = data.pos[1];
    this.servo3Pos = data.pos[2];
    this.servo4Pos = data.pos4;

    console.log(this);
  }

  async pollArduino() {
    let data = {
      command: "getServoPos",
    };
    connection.send(JSON.stringify(data));
    await sleep(25000);
  }

  connect(evt) {
    this.controller = evt.gamepad;
    console.log("Gamepad connected");
    this.runLoop();
  }

  disconnect() {
    this.controller = null;
    console.log("Gamepad Disconnected");
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
      await sleep(50);
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
      leftMotorSpeed = 255;
      rightMotorSpeed = 255;
    }
    // Atras
    else if (leftStickX == 0 && leftStickY == 1) {
      leftMotorSpeed = -255;
      rightMotorSpeed = -255;
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
    let r1 = 5;
    let l1 = 4;
    let l2 = 7;
    let r2 = 6;

    // Si estoy apretando r1 solo
    if (
      (this.buttonsStatus.indexOf(r1) != -1) &
      (this.buttonsStatus.indexOf(l1) == -1)
    ) {
      let prevServo3Pos = this.servo3Pos;
      this.servo3Pos = this.servo3Pos + SERVO_MOVEMENT_FACTOR;
      if (this.servo3Pos > this.servo3Lim[1]) {
        this.servo3Pos = this.servo3Lim[1];
      } else if (this.servo3Pos < this.servo3Lim[0]) {
        this.servo3Pos = this.servo3Lim[0];
      }
      if (prevServo3Pos != this.servo3Pos) {
        shouldUpdate = true;
      }
    }
    // Si apreto l1 solo
    else if (
      (this.buttonsStatus.indexOf(r1) == -1) &
      (this.buttonsStatus.indexOf(l1) != -1)
    ) {
      let prevServo3Pos = this.servo3Pos;
      this.servo3Pos = this.servo3Pos - SERVO_MOVEMENT_FACTOR;
      if (this.servo3Pos > this.servo3Lim[1]) {
        this.servo3Pos = this.servo3Lim[1];
      } else if (this.servo3Pos < this.servo3Lim[0]) {
        this.servo3Pos = this.servo3Lim[0];
      }
      if (prevServo3Pos != this.servo3Pos) {
        shouldUpdate = true;
      }
    }

    // Si apreto l1 solo
    if (
      (this.buttonsStatus.indexOf(r2) != -1) &
      (this.buttonsStatus.indexOf(l2) == -1)
    ) {
      let prevServo4Pos = this.servo4Pos;
      this.servo4Pos = this.servo4Pos + SERVO_MOVEMENT_FACTOR;
      if (this.servo4Pos > this.servo4Lim[1]) {
        this.servo4Pos = this.servo4Lim[1];
      } else if (this.servo4Pos < this.servo4Lim[0]) {
        this.servo4Pos = this.servo4Lim[0];
      }
      if (prevServo4Pos != this.servo4Pos) {
        shouldUpdate = true;
      }
    }
    // Si apreto l2 solo
    else if (
      (this.buttonsStatus.indexOf(r2) == -1) &
      (this.buttonsStatus.indexOf(l2) != -1)
    ) {
      let prevServo4Pos = this.servo4Pos;
      this.servo4Pos = this.servo4Pos - SERVO_MOVEMENT_FACTOR;
      if (this.servo4Pos > this.servo4Lim[1]) {
        this.servo4Pos = this.servo4Lim[1];
      } else if (this.servo4Pos < this.servo4Lim[0]) {
        this.servo4Pos = this.servo4Lim[0];
      }
      if (prevServo4Pos != this.servo4Pos) {
        shouldUpdate = true;
      }
    }

    // Mando a redondear los valores
    this.roundValues();

    // Si paso mucho sin actualizar mando todo
    if (new Date().getTime() - this.lastTimeSended > 5000) {
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
      await sleep(20);
    }
  }

  async runLoop() {
    this.controller = navigator.getGamepads()[0];
    this.updateControls();

    await this.sendNewControls();
    if (this.controller) {
      await sleep(20);
      this.runLoop();
    }
  }

  updateControls() {
    // clear the buttons cache
    this.buttonsCache = [];
    // move the buttons status from the previous frame to the cache
    for (var k = 0; k < this.buttonsStatus.length; k++) {
      this.buttonsCache[k] = this.buttonsStatus[k];
    }
    // clear the buttons status
    this.buttonsStatus = [];
    // get the gamepad object
    var c = this.controller || {};

    // loop through buttons and push the pressed ones to the array
    var pressed = [];
    if (c.buttons) {
      for (var b = 0; b < c.buttons.length; b++) {
        if (c.buttons[b].pressed) {
          pressed.push(this.buttons[b]);
        }
      }
    }
    // loop through axes and push their values to the array
    var axes = [];
    if (c.axes) {
      for (var a = 0; a < c.axes.length; a++) {
        axes.push(parseFloat(c.axes[a].toFixed(2)));
      }
    }
    // assign received values
    this.axesStatus = axes;
    this.buttonsStatus = pressed;
  }

  buttonPressed(button, hold) {
    var newPress = false;
    // loop through pressed buttons
    for (var i = 0; i < gamepadAPI.buttonsStatus.length; i++) {
      // if we found the button we're looking for...
      if (gamepadAPI.buttonsStatus[i] == button) {
        // set the boolean variable to true
        newPress = true;
        // if we want to check the single press
        if (!hold) {
          // loop through the cached states from the previous frame
          for (var j = 0; j < gamepadAPI.buttonsCache.length; j++) {
            // if the button was already pressed, ignore new press
            if (gamepadAPI.buttonsCache[j] == button) {
              newPress = false;
            }
          }
        }
      }
    }
    return newPress;
  }
}
