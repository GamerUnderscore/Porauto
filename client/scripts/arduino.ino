#include <AccelStepper.h>
const String CMD_PING = "PING";
const String CMD_STATUS = "STATUS";




// CNC Shield
#define EN      8 

#define X_DIR   5
#define X_STEP  2
#define Y_DIR 6
#define Y_STEP 3

// Driver NEMA 23
#define EN_2      22

#define N23_DIR   23
#define N23_STEP  24 


AccelStepper moteurX(1, X_STEP, X_DIR);
AccelStepper moteurY(1, Y_STEP, Y_DIR);
AccelStepper moteurN23(1, N23_STEP, N23_DIR);


// Steps per revolution
const long X_SPR = 1600;
const long Y_SPR = 1600;
const long N23_SPR = 1600;


void setup() {
  Serial.begin(9600);

  pinMode(EN, OUTPUT);
  pinMode(EN_2, OUTPUT);

  pinMode(X_DIR, OUTPUT);
  pinMode(X_STEP, OUTPUT);

  pinMode(Y_DIR, OUTPUT);
  pinMode(Y_STEP, OUTPUT);

  pinMode(N23_DIR, OUTPUT);
  pinMode(N23_STEP, OUTPUT);

  digitalWrite(EN, LOW); // low = on, high = off
  digitalWrite(EN_2, LOW);

  // Réglages de mouvement
  moteurX.setMaxSpeed(10000);
  moteurX.setAcceleration(10000);
  moteurY.setMaxSpeed(10000);
  moteurY.setAcceleration(10000);
  moteurN23.setMaxSpeed(10000);
  moteurN23.setAcceleration(10000);

  Serial.println("READY");
}

void loop() {
  // Lecture de la console
  if (Serial.available() > 0) {
    String message = Serial.readStringUntil('\n');
    message.trim();

    // ! Important !
    if (message == CMD_PING) {
      Serial.println("PONG");
    }else if (message == CMD_STATUS) {
      Serial.println("SYSTEM_OK");
    }
   
    // Commandes de mouvements
    if (message.startsWith("rotateX ")) {
      String valeurStr = message.substring(8);
      long pas = (valeurStr.toInt() * stepsPerRev) / 360; // convertis angle en pas
      moteurX.move(pas);
      Serial.println("rX_"+pas);
    }
    if (message.startsWith("rotateY ")) {
      String valeurStr = message.substring(8);
      long pas = (valeurStr.toInt() * stepsPerRev) / 360; 
      pas = (pas * stepsPerRev) / 360;
      moteurY.move(pas);
      Serial.println("rY_"+pas);
    }
    if (message.startsWith("rotateZ ")) {
      String valeurStr = message.substring(8);
      long pas = (valeurStr.toInt() * stepsPerRev) / 360; 
      pas = (pas * stepsPerRev) / 360;
      moteurN23.move(pas);
      Serial.println("rZ_"+pas);
    }

  }

  moteurX.run();
  moteurY.run();
  moteurN23.run();
}
