#include <AccelStepper.h>
const String CMD_PING = "PING";
const String CMD_STATUS = "STATUS";
const String CMD_RESET = "RESET";


// Définition des pins du CNC Shield pour l'axe X
#define EN      8  // Pin d'activation (commune à tous les axes sur CNC Shield)
#define EN 8 /* Enable pin for all stepper outputs */
#define X_DIR 5 /* Direction-Pin for X-axis */
#define X_STEP 2 /* Step-Pin for X-axis */
#define Y_DIR 6 /* Direction-Pin for Y-axis*/
#define Y_STEP 3 /* Step-Pin for Y-axis */
#define Z_DIR 7 /* Direction-Pin for Z-axis */
#define Z_STEP 4 /* Step-Pin for Z-axis */
#define A_DIR 13 /* Direction-Pin for A-axis*/
#define A_STEP 12 /* Step-Pin for A-axis */




// Configuration AccelStepper (Type 1 = Driver)
AccelStepper moteurX(1, X_STEP, X_DIR);
AccelStepper moteurY(1, Y_STEP, Y_DIR);
AccelStepper moteurZ(1, Z_STEP, Z_DIR);



// 6400 pas = 1 tour complet (en 1/32 microstepping)
// 1600 pas = 90 degrés
const long angle90 = 1600;


void setup() {
  Serial.begin(9600);


  pinMode(X_DIR, OUTPUT);
  pinMode(X_STEP, OUTPUT);
  pinMode(Y_DIR, OUTPUT);
  pinMode(Y_STEP, OUTPUT);
  pinMode(Z_DIR, OUTPUT);
  pinMode(Z_STEP, OUTPUT);
  pinMode(A_DIR, OUTPUT);
  pinMode(A_STEP, OUTPUT);

  digitalWrite(EN, LOW); // LOW = moteurX activé / HIGH = moteurX éteint (repos)


  // Réglages de mouvement
  moteurX.setMaxSpeed(10000);
  moteurX.setAcceleration(10000);
  moteurY.setMaxSpeed(10000);
  moteurY.setAcceleration(10000);
  moteurZ.setMaxSpeed(10000);
  moteurZ.setAcceleration(10000);

  Serial.println("READY");
}


void loop() {
  // Lecture de la console
  if (Serial.available() > 0) {
    String message = Serial.readStringUntil('\n');
    message.trim();


    if (message == CMD_PING) {
      Serial.println("PONG");
    }
    else if (message == CMD_STATUS) {
      Serial.println("SYSTEM_OK");
    }
    if (message == "90") {
      Serial.println("Commande recue : Rotation de 90 degres...");
      moteurX.move(angle90);
    }

    //concret
    if (message == CMD_RESET) {
      moteurX.setMaxSpeed(500);
      moteurX.move("64000");
      Serial.println("RESPONSE_RESET");
      moteurX.setMaxSpeed(10000);
    }
    if (message.startsWith("rotateX ")) {
      String valeurStr = message.substring(7);
      long pas = valeurStr.toInt();
      moteurX.move(pas);
      Serial.println("RESPONSE_MX_"+pas);
    }
    if (message.startsWith("rotateY ")) {
      String valeurStr = message.substring(7);
      long pas = valeurStr.toInt();
      moteurY.move(pas);
      Serial.println("RESPONSE_MY_"+pas);
    }
    if (message.startsWith("rotateZ ")) {
      String valeurStr = message.substring(7);
      long pas = valeurStr.toInt();
      moteurZ.move(pas);
      Serial.println("RESPONSE_MZ_"+pas);
    }
  }
  moteurX.run();
  moteurY.run();
  moteurZ.run();

}


