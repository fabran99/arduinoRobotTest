#include <ESP8266WiFi.h>
#include <ESPAsyncWebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

#include "config.h"  // Sustituir con datos de vuestra red
#include "API.hpp"
#include "WebSockets.hpp"
#include "Server.hpp"
#include "ESP8266_Utils.hpp"
#include "ESP8266_Utils_AWS.hpp"

void setup(void)
{
  Serial.begin(115200);
  while (!Serial) {
    delay(100);
  }

  Serial.println("Inicio ESP8266");

  ConnectWiFi_STA(true);

  InitServer();
  InitWebSockets();
}


void sendDataViaSocket(String dataToSend) {
  if (globalClient != NULL && globalClient->status() == WS_CONNECTED ) {
    globalClient->text(dataToSend);
  }
}



void loop() {
  if (Serial.available()) {
    StaticJsonDocument<1024> doc;
    // Read the JSON document from the "link" serial port
    DeserializationError err = deserializeJson(doc, Serial);
    if (err == DeserializationError::Ok) {
      String command = doc["command"].as<String>();

      if (command == "send") {
        String dataToSend;
        serializeJson(doc, dataToSend);
        //        sendDataViaSocket(dataToSend);
        if (globalClient != NULL && globalClient->status() == WS_CONNECTED ) {
          globalClient->text(dataToSend);
        }
      }
    }
    else {
      // Flush all bytes in the "link" serial port buffer
      //      Serial.println("=========== Debug ESP8266============");
      while (Serial.available() > 0) {
        //        Serial.println(Serial.read());
        Serial.readString();
      }
      //      Serial.println("==========END Debug ESP8266=============");
    }
  }
}
