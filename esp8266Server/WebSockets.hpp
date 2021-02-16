AsyncWebSocket ws("/ws");

void sendServoPos()
{
  //  Serial.println("por enviar dato");
  String response = "{\"pos\":[" + String(servo1Pos) + "," + String(servo2Pos) + "," + String(servo3Pos) + "," + String(servo4Pos) + "]";
  response += ",\"messageType\":\"getServoPos\",\"command\":\"send\"}";
  Serial.println(" Envio dato por socket ");
  Serial.println(response);
  Serial.println(" Envio dato por socket ");
}


void handleJsonData(StaticJsonDocument<400> doc)
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
      Serial.println("Servo1:" + String(servo1Pos));
      servo1.write(servo1Pos);
      delay(20);
    }
    if (s2 != servo2Pos) {
      servo2Pos = s2;
      Serial.println("Servo2:" + String(servo2Pos));
      servo2.write(servo2Pos);
      delay(20);
    }
    if (s3 != servo3Pos) {
      servo3Pos = s3;
      Serial.println("Servo3:" + String(servo3Pos));
      servo3.write(servo3Pos);
      delay(20);
    }
    if (s4 != servo4Pos) {
      servo4Pos = s4;
      Serial.println("Servo4:" + String(servo4Pos));
      servo4.write(servo4Pos);
      delay(20);
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
      if (newspeedleft == 1023) {
        newspeedleft = HIGH;
//        digitalWrite(leftMotorSpeedPin, LOW);
//        Serial.println("delay left");
        delay(50);
      }
      else if (newspeedleft == 0) {
        newspeedleft = LOW;
//        digitalWrite(leftMotorSpeedPin, LOW);
//        Serial.println("delay left");
        delay(50);
      }
      leftMotorSpeed = newspeedleft;
      Serial.println("motor izquierda:" + String(leftMotorSpeed));
      digitalWrite(leftMotorSpeedPin, newspeedleft);
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
      if (newspeedright == 1023) {
        newspeedright = HIGH;
//        digitalWrite(rightMotorSpeedPin, LOW);
//        Serial.println("delay right");
        delay(100);
      }
      else if (newspeedright == 0) {
        newspeedright = LOW;
//        digitalWrite(rightMotorSpeedPin, HIGH);
//        Serial.println("delay right");
        delay(100);
      }
      rightMotorSpeed = newspeedright;
      Serial.println("motor derecha:" + String(rightMotorSpeed));
      digitalWrite(rightMotorSpeedPin, rightMotorSpeed);
    }


  }
  else if (command == "getServoPos") {
    sendServoPos();
  }
  else
  {
    String dataReceived;
    serializeJson(doc, dataReceived);
    Serial.println("Debug data received");
    Serial.println(dataReceived);
    Serial.println("EndDebug data received");
  }
}


void ProcessRequest(AsyncWebSocketClient *client, String request)
{
  Serial.println(request);

  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, request);
  if (error)
  {
    return;
  }

  handleJsonData(doc);

}
