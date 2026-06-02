# Security Specification & Threat Model: Gamified Worker Training Platform

This document outlines the security requirements, data invariants, and threat analysis for the platform's Firestore database, including the "Dirty Dozen" malicious payloads used to test the security rules.

## Data Invariants

1. **User Ownership**: A worker's profile (`/usuarios/{userId}`) can only be modified by the worker themselves, except for system-controlled achievements or admin overrides.
2. **Admin-only Questions**: Only authenticated administrators can write, update, or delete entries in `/preguntas/{preguntaId}`. Workers have strictly read-only access.
3. **Immutable Results**: Game sessions logged under `/resultados/{resultadoId}` are immutable once submitted. Nobody can update or delete a logged score.
4. **Verified Leaderboard**: Top scores and XP aggregates in `/ranking/{userId}` must strictly mirror actual stats. Users can only update their own ranking node to match their verified identity and latest logged values.

---

## The "Dirty Dozen" (12 Malicious Payloads)

### 1. Privilege Escalation (Self-Appointed Admin)
* **Goal**: A standard worker attempts to declare themselves as an `"administrador"` upon account creation or profile update.
* **Payload (`/usuarios/victim_uid`)**:
  ```json
  {
    "nombre": "Esteban Trabajador",
    "email": "esteban@empresa.com",
    "rol": "administrador",
    "puesto": "Operario",
    "totalXP": 150,
    "gamesPlayed": 2
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` since non-admins cannot write `rol: "administrador"`.

### 2. Experience Poisoning (Infinite XP Injector)
* **Goal**: A malicious player submits an abnormally large XP value to inflate their rank.
* **Payload (`/usuarios/attacker_uid`)**:
  ```json
  {
    "totalXP": 9999999,
    "gamesPlayed": 1
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` due to maximum value guards in validation functions.

### 3. Identity Theft (Victim Profile Takeover)
* **Goal**: Authenticated user "Attacker-Jane" tries to rewrite user "Worker-Bob"'s profile.
* **Path**: `/usuarios/bob_uid` (Write by Jane's Auth context)
* **Expected Result**: `PERMISSION_DENIED` (auth.uid check failed).

### 4. Admin Spoofing (Write Question as Standard User)
* **Goal**: A worker attempts to inject or correct a training question in `/preguntas`.
* **Payload (`/preguntas/q_leak`)**:
  ```json
  {
    "pregunta": "How to bypass network firewalls?",
    "opciones": ["Click links", "Contact admin", "Do nothing", "Use VPN"],
    "respuestaCorrecta": 1,
    "categoria": "Seguridad",
    "puntos": 50,
    "createdBy": "attacker_uid"
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (not an approved admin document).

### 5. Historical Rewrite (Falsify Past Game Scores)
* **Goal**: A user tries to update an existing session result to increase their scoreboard standing from yesterday.
* **Path**: `/resultados/existing_result_id` (Attempted `UPDATE`)
* **Expected Result**: `PERMISSION_DENIED` (results collection is write-once, immutable).

### 6. Score Impersonation (Submitting Score for Another Colleague)
* **Goal**: User A submits a game session result with `userId` of User B.
* **Payload (`/resultados/new_result_id`)**:
  ```json
  {
    "userId": "victim_uid",
    "userName": "Bob Victim",
    "gameId": "quiz_people",
    "score": 100,
    "xpGained": 50,
    "createdAt": "2026-06-01T16:12:00Z"
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (`incoming().userId != request.auth.uid`).

### 7. Denial of Wallet via Giant Document Injection
* **Goal**: Malicious attacker sends strings larger than 10KB to exhaust database limits and increase billing.
* **Payload (`/usuarios/attacker_uid`):**
  ```json
  {
    "nombre": "A".repeat(50000), // Enormous name string
    "email": "attacker@empresa.com",
    "rol": "trabajador",
    "totalXP": 10,
    "gamesPlayed": 0
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (`nombre.size() <= 100`).

### 8. Negative Experience Penalty Exploitation
* **Goal**: An attacker sends a negative XP score to harm another user or test boundaries.
* **Payload (`/resultados/res_777`):**
  ```json
  {
    "userId": "attacker_uid",
    "userName": "Attacker",
    "gameId": "quiz_people",
    "score": -500,
    "xpGained": -200,
    "createdAt": "request.time"
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (`xpGained >= 0`).

### 9. Illegal Question Modification (Answer Swap)
* **Goal**: Attempt to swap a question's correct answer index to cheat.
* **Path**: `/preguntas/q_abc` (Attempted `UPDATE` by non-admin)
* **Expected Result**: `PERMISSION_DENIED`.

### 10. Spamming Leaderboard (Direct Ranking Tampering)
* **Goal**: A user attempts to forge their position in the public ranking collection by setting arbitrary values without playing.
* **Payload (`/ranking/attacker_uid`):**
  ```json
  {
    "userId": "attacker_uid",
    "userName": "Imposter Admin",
    "totalXP": 500000,
    "lastUpdated": "request.time"
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (XP mismatch or no verified logs matching).

### 11. Orphaned Results (Submitting score for non-existent game)
* **Goal**: Attempting to post coordinates or game IDs that violate formatting.
* **Payload (`/resultados/res_999`):**
  ```json
  {
    "userId": "attacker_uid",
    "userName": "Tester",
    "gameId": "MALICIOUS_HACK_GAME_9999",
    "score": 100,
    "xpGained": 10,
    "createdAt": "request.time"
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (gameId must match allowed formats).

### 12. Deleting Training History (Evidence Concealment)
* **Goal**: Worker deletes suspicious, low, or failed game outputs to forge a high streak percentage.
* **Path**: `/resultados/low_score_id` (Attempted `DELETE`)
* **Expected Result**: `PERMISSION_DENIED` (deletions strictly forbidden).

---

## Mock Test Suite (`firestore.rules.test.ts`)

A simulated suite verifying all rules secure these interfaces properly. Actual enforcement is implemented in `firestore.rules`.
