//#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <Servo.h>

//Serial
//SoftwareSerial ESPserial(6, 5); // RX | TX

bool debug = true;

//Servo
int servo1Pin = A5;
int servo1Pos = 90;
int servo1MIN = 450;
int servo1MAX = 2520;
Servo servo1;

int servo2Pin = A4;
int servo2Pos = 90;
int servo2MIN = 450;
int servo2MAX = 2520;
Servo servo2;
//

int servo3Pin = A3;
int servo3Pos = 90;
int servo3MIN = 500;
int servo3MAX = 2420;
Servo servo3;

//int servo4Pin = A2;
//int servo4Pos = 90;
//int servo4MIN = 450;
//int servo4MAX = 2520;
//Servo servo4;


//Motores
int leftMotorIn1 = 13;
int leftMotorSpeedPin = 11;
int leftMotorIn2 = 12;
int leftMotorSpeed = 0;

int rightMotorIn1 = 5;
int rightMotorSpeedPin = 6;
int rightMotorIn2 = 3;
int rightMotorSpeed = 0;

void setup()
{
  Serial.begin(115200); // communication with the host computer

  while (!Serial) {
    delay(100);
  }
//  Serial.println("");
//  Serial.println("Remember to to set Both NL & CR in the serial monitor.");
//  Serial.println("Ready");
//  Serial.println("");

  //Servo
  servo1.attach(servo1Pin, servo1MIN, servo1MAX);
  servo2.attach(servo2Pin, servo2MIN, servo2MAX);
  servo3.attach(servo3Pin, servo3MIN, servo3MAX);
  //  servo4.attach(servo4Pin, servo4MIN, servo4MAX);

  //  Motores
  pinMode(leftMotorIn1, OUTPUT);
  pinMode(leftMotorIn2, OUTPUT);
  pinMode(leftMotorSpeedPin, OUTPUT);
  pinMode(rightMotorIn1, OUTPUT);
  pinMode(rightMotorIn2, OUTPUT);
  pinMode(rightMotorSpeedPin, OUTPUT);
}

void showSerialPrint(String text) {
  if (debug) {
    Serial.println(text);
 }
}

void sendServoPos()
{
  //  Serial.println("por enviar dato");
  String response = "{\"pos\":[" + String(servo1Pos) + "," + String(servo2Pos) + "," + String(servo3Pos) + "]";
  response += ",\"messageType\":\"getServoPos\",\"command\":\"send\"}";
  showSerialPrint(" Envio dato por socket ");
  Serial.println(response);
  showSerialPrint(" Envio dato por socket ");
}




void handleWifiModuleData(StaticJsonDocument<300> doc)
{
  //  Detecto la accion que requiero
  String command = doc["command"].as<String>();

  if (command == "move") {
    int s1 = doc["pos"][0];
    int s2 = doc["pos"][1];
    int s3 = doc["pos"][2];
    int s4 = doc["pos"][3];
    int newspeedleft = doc["pos"][4];
    int newspeedright = doc["pos"][5];


    // Servos
    if (s1 != servo1Pos) {
      servo1Pos = s1;
      showSerialPrint("Servo1:" + String(servo1Pos));
      servo1.write(servo1Pos);
    }
    if (s2 != servo2Pos) {
      servo2Pos = s2;
      showSerialPrint("Servo2:" + String(servo2Pos));
      servo2.write(servo2Pos);
    }
    if (s3 != servo3Pos) {
      servo3Pos = s3;
      showSerialPrint("Servo3:" + String(servo3Pos));
      servo3.write(servo3Pos);
    }

    //  Motor izquierda
    if (newspeedleft > 0) {
      digitalWrite(leftMotorIn1, LOW);
      digitalWrite(leftMotorIn2, HIGH);
    }
    else if (newspeedleft < 0) {
      newspeedleft = newspeedleft * -1;
      digitalWrite(leftMotorIn1, HIGH);
      digitalWrite(leftMotorIn2, LOW);
    }

    if (leftMotorSpeed != newspeedleft) {
      if (newspeedleft == 255) {
        analogWrite(leftMotorSpeedPin, 0);
        showSerialPrint("delay left");
        delay(100);
      }
      else if(newspeedleft == 0){
        analogWrite(leftMotorSpeedPin, 255);
        showSerialPrint("delay left");
        delay(100);
      }
      leftMotorSpeed = newspeedleft;
      showSerialPrint("motor izquierda:" + String(leftMotorSpeed));
      analogWrite(leftMotorSpeedPin, leftMotorSpeed);
    }



    //    Motor derecha
    if (newspeedright > 0) {
      digitalWrite(rightMotorIn1, LOW);
      digitalWrite(rightMotorIn2, HIGH);
    }
    else if (newspeedright < 0) {
      newspeedright = newspeedright * -1;
      digitalWrite(rightMotorIn1, HIGH);
      digitalWrite(rightMotorIn2, LOW);
    }

    if (rightMotorSpeed != newspeedright) {
      if (newspeedright == 255) {
        analogWrite(rightMotorSpeedPin, 0);
        showSerialPrint("delay right");
        delay(100);
      }
      else if(newspeedright == 0){
        analogWrite(rightMotorSpeedPin, 255);
        showSerialPrint("delay right");
        delay(100);
      }
      rightMotorSpeed = newspeedright;
      showSerialPrint("motor derecha:" + String(rightMotorSpeed));
      analogWrite(rightMotorSpeedPin, rightMotorSpeed);
    }


  }
  else if (command == "getServoPos") {
    sendServoPos();
  }
  else
  {
    String dataReceived;
    serializeJson(doc, dataReceived);
    showSerialPrint("Debug data received");
    showSerialPrint(dataReceived);
    showSerialPrint("EndDebug data received");
  }
}

void loop()
{
  // listen for communication from the ESP8266 and then write it to the serial monitor
  if (Serial.available()) {
    StaticJsonDocument<250> doc;
    // Read the JSON document from the "link" serial port
    DeserializationError err = deserializeJson(doc, Serial);
    if (err == DeserializationError::Ok) {
      handleWifiModuleData(doc);
    }
    else {
      // Flush all bytes in the "link" serial port buffer
      if (debug) {
        Serial.println("Debug");
        while (Serial.available() > 0) {
          Serial.println(Serial.readString());
        }
        Serial.println("EndDebug");
      }
      else {
        while (Serial.available() > 0) {
          Serial.readString();

        }
      }
    }
  }
}
