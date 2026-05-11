#include <AccelStepper.h>

// --- CONFIGURATION PINS ---
#define EN_SHIELD 8
#define X_STEP    2
#define X_DIR     5
#define Y_STEP    3
#define Y_DIR     6
#define Z_STEP_TB 22
#define Z_DIR_TB  23
#define LDR_PIN A0        // Pin de la photo-résistance
#define SEUIL_LDR 500     // Valeur à ajuster

// --- VARIABLES ---
unsigned long dernierRapportPositions = 0;
bool ResetMode = false;
int dernierIndexVisite = -1;

// --- STRUCTURE ET POSITIONS ---
struct Emplacement {
  String nom;
  long y1;
  long x2;
  long z3;
  long y4;
};

Emplacement listePositions[] = {
  {"S1", -25765, -15008, 4135, 12561},
  {"S2", -25765, -15502, 2772, 17798},
  {"S3", -25765, -16125, 1910, 20736},
  {"S4", -25765, -16920, 1249, 22734},
  {"S5", -25765, -17939, 726, 24127},
  {"S6", -25765, -19231, 335, 25055},
  {"S7", -25765, -20801, 86, 25590},
  {"S8", -25765, 22560, 0, 25765},
  {"S9", -25765, 20801, 86, 25590},
  {"S10", -25765, 19231, 335, 25055},
  {"S11", -25765, 17939, 726, 24127},
  {"S12", -25765, 16920, 1249, 22734},
  {"S13", -25765, 16125, 1910, 20736},
  {"S14", -25765, 15502, 2772, 17798},
  {"S15", -25765, 15008, 4135, 12561}
};

const int nombreDePositions = sizeof(listePositions) / sizeof(listePositions[0]);

// --- INSTANCES MOTEURS ---
AccelStepper moteurX(1, X_STEP, X_DIR);
AccelStepper moteurY(1, Y_STEP, Y_DIR);
AccelStepper moteurZ_Nema23(1, Z_STEP_TB, Z_DIR_TB);

// --- FONCTIONS ---

void homeX() {
  Serial.println("Homing X en cours...");
  moteurX.setSpeed(-600); 
  while (analogRead(LDR_PIN) < SEUIL_LDR) {
    moteurX.runSpeed();
    if (abs(moteurX.currentPosition()) > 40000) {
      Serial.println("Erreur : Capteur X non trouve !");
      break;
    }
  }
  moteurX.stop();
  moteurX.setCurrentPosition(0);
  Serial.println("Moteur X a zero !");
}

void Move(String codeS) {
  int i = -1;
  for (int j = 0; j < nombreDePositions; j++) {
    if (codeS == listePositions[j].nom) { i = j; break; }
  }

  if (i != -1) {
    dernierIndexVisite = i;
    Serial.print("Execution Move: "); Serial.println(codeS);

    Serial.print("response_Y_"); Serial.println(moteurY.currentPosition() + listePositions[i].y1);
    moteurY.runToNewPosition(listePositions[i].y1);

    Serial.print("response_X_"); Serial.println(moteurX.currentPosition() + listePositions[i].x2);
    moteurX.runToNewPosition(listePositions[i].x2);

    Serial.print("response_Z_"); Serial.println(moteurZ_Nema23.currentPosition() + listePositions[i].z3);
    moteurZ_Nema23.runToNewPosition(listePositions[i].z3);

    Serial.print("response_Y_"); Serial.println(moteurY.currentPosition() + listePositions[i].y4);
    moteurY.runToNewPosition(listePositions[i].y4);
    
    
    Serial.println("Termine.");
  } else {
    Serial.println("Position inconnue.");
  }
}

void Back() {
  if (dernierIndexVisite == -1) { Serial.println("Rien a annuler."); return; }
  int i = dernierIndexVisite;
  Serial.println("Annulation du mouvement...");

  Serial.print("response_Y_"); Serial.println(listePositions[i].y4); moteurY.runToNewPosition(moteurY.currentPosition() - listePositions[i].y4);
  Serial.print("response_Z_"); Serial.println(listePositions[i].z3); moteurZ_Nema23.runToNewPosition(moteurZ_Nema23.currentPosition() - listePositions[i].z3);
  Serial.print("response_X_"); Serial.println(listePositions[i].x2); moteurX.runToNewPosition(moteurX.currentPosition() - listePositions[i].x2);
  Serial.print("response_Y_"); Serial.println(listePositions[i].y1); moteurY.runToNewPosition(moteurY.currentPosition() - listePositions[i].y1);

  dernierIndexVisite = -1;
  Serial.println("Retour OK.");
}

void rotateX(long pas) { Serial.print("response_X_"); Serial.println(pas); moteurX.runToNewPosition(moteurX.currentPosition() + pas);  }
void rotateY(long pas) { Serial.print("response_Y_"); Serial.println(pas); moteurY.runToNewPosition(moteurY.currentPosition() + pas); }
void rotateZ(long pas) { Serial.print("response_Z_"); Serial.println(pas); moteurZ_Nema23.runToNewPosition(moteurZ_Nema23.currentPosition() + pas); }

// ================================================================
// SETUP
// ================================================================
void setup() {
  Serial.begin(9600);
  pinMode(EN_SHIELD, OUTPUT);
  digitalWrite(EN_SHIELD, LOW);
  
  moteurX.setMaxSpeed(2000); moteurX.setAcceleration(1000);
  moteurY.setMaxSpeed(2000); moteurY.setAcceleration(1000);
  moteurZ_Nema23.setMaxSpeed(1500); moteurZ_Nema23.setAcceleration(500);

  Serial.println("READY");
}

// ================================================================
// LOOP
// ================================================================
void loop() {
  // 2. Gestion des commandes série
  if (Serial.available() > 0) {
    String message = Serial.readStringUntil('\n');
    message.trim();

    if (message == "STOP") {
      moteurX.stop(); moteurY.stop(); moteurZ_Nema23.stop();
      Serial.println("Arrêt d'urgence !");
      asm volatile ("  jmp 0"); 
    } 
    else if (message == "RESET") {
      ResetMode = !ResetMode;
      Serial.println(ResetMode ? "Mode Reset: ON" : "Mode Reset: OFF");
    } 
    else if (message.equalsIgnoreCase("BACK")) {
      Back();
    }
    else if (message.equalsIgnoreCase("HOME")) {
      homeX();
      moteurY.setCurrentPosition(0);
      moteurZ_Nema23.setCurrentPosition(0);
      Serial.println("Homing OK");
    }
    else if (message == "PING") {
      Serial.println("PONG");
    }
    else if (message.startsWith("rotateX")) {
      rotateX(message.substring(7).toInt());
    }
    else if (message.startsWith("rotateY")) {
      rotateY(message.substring(7).toInt());
    }
    else if (message.startsWith("rotateZ")) {
      rotateZ(message.substring(7).toInt());
    }
    else {
      Move(message);
    }
  }

  // 3. Rapport de position automatique toutes les 2,5 secondes
  if (millis() - dernierRapportPositions >= 2500) {
    dernierRapportPositions = millis();
    Serial.print("POS_"); Serial.print(moteurX.currentPosition());
    Serial.print("_"); Serial.print(moteurY.currentPosition());
    Serial.print("_"); Serial.println(moteurZ_Nema23.currentPosition());
  }
}