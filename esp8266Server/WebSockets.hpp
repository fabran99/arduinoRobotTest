AsyncWebSocket ws("/ws");

//void sendDataToArduino(StaticJsonDocument<400> doc)
//{
//  serializeJson(doc, Serial);
//}


void ProcessRequest(AsyncWebSocketClient *client, String request)
{
  Serial.println(request);
//  StaticJsonDocument<1024> doc;
//  DeserializationError error = deserializeJson(doc, request);
//  if (error)
//  {
//    return;
//  }
  
}
