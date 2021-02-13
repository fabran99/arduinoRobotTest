//Red
const char *ssid = "arduinoBotNodemcu";
const char *password = "nodemcubot";
const char *hostname = "ESP8266_1";

IPAddress ip(192, 168, 1, 44);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

AsyncWebSocketClient *globalClient = NULL;

//Servo
int servo1Pin = D0;
int servo1Pos = 90;
int servo1MIN = 450;
int servo1MAX = 2520;
Servo servo1;

int servo2Pin = D1;
int servo2Pos = 90;
int servo2MIN = 450;
int servo2MAX = 2520;
Servo servo2;
//

int servo3Pin = D2;
int servo3Pos = 90;
int servo3MIN = 500;
int servo3MAX = 2420;
Servo servo3;

//Motores
int rightMotorIn1 = D3;
int rightMotorSpeedPin = D4;
int rightMotorIn2 = D5;
int rightMotorSpeed = 0;

int leftMotorIn1 = D6;
int leftMotorSpeedPin = D7;
int leftMotorIn2 = D8;
int leftMotorSpeed = 0;
