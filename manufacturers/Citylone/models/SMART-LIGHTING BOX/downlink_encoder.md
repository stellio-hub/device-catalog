# Citylone SMART-LIGHTING BOX — downlinks encodés

Encodeur : `downlink_encoder.js`  
Sources : *Citylone LoRa Product Frame Descriptions v2.0.17* (colonnes **All** et **SLB** uniquement).

## Conventions

- L’**identifiant de trame** est le **premier octet** du payload. Le fPort LoRaWAN est toujours **1**.
- Les entiers multi-octets sont en **little-endian** (LSB d’abord).
- Entrée : JSON NGSI-LD sur stdin (`{ "champ": { "value": ... } }`).
- Argument CLI : nom du **service**.
- Sortie : `{ "data": "<base64>", "port": 1 }`.
- Les commandes **Node** (DALI, SL-Connect) ne sont pas encodées.

```bash
echo '<json>' | node downlink_encoder.js <service>
```

Exemple :

```bash
echo '{}' | node downlink_encoder.js requestCalendar
```

→ `{"data":"Bw==","port":1}` (`07` en hex).

| Service | ID | Payload |
|---------|-----|---------|
| `forceOutput` | `0x01` | Type + % + sortie + durée |
| `setTime` | `0x04` | Timestamp + offset UTC |
| `sendCalendar` | `0x05` | Une règle (17 octets) |
| `sendCalendarEnd` | `0x05` | ID + zéros (fin de dump) |
| `setPosition` | `0x06` | Longitude + latitude |
| `requestCalendar` | `0x07` | ID seul |
| `requestTime` | `0x09` | ID seul |
| `requestRssi` | `0x0A` | ID seul |
| `requestPosition` | `0x0B` | ID seul |
| `requestSoftwareVersion` | `0x0C` | ID seul |
| `setConsumptionFrequency` | `0x0D` | Période TIC (min) |
| `setTimeChange` | `0x0E` | 0 / 1 |
| `requestTimeChange` | `0x0F` | ID seul |
| `requestConsumption` | `0x10` | ID seul |
| `reset` | `0x22` | Code calculé depuis le DevEUI |
| `requestRunHour` | `0x23` | ID seul |
| `setDataModel` | `0x24` | 0 / 1 / `0xFF` |
| `setCalendarLocked` | `0x25` | 0 / 1 / `0xFF` |
| `setTimeBeforeRejoin` | `0x26` | Jours (3–15) |

Les requêtes « ID seul » n’ont pas de champ JSON utile : `echo '{}' | node downlink_encoder.js requestRssi`.

---

## `forceOutput` — Forçage de sortie (`0x01`)

| Octet | Champ JSON | Sens |
|-------|------------|------|
| 0 | — | `0x01` |
| 1 | `commandType` | `0` OFF, `1` ON, `2` dimming, `3` automatique |
| 2 | `dimmingLevel` | 0–100 % |
| 3 | `output` | `0` = toutes, `1`–`4` = S1–S4 |
| 4–5 | `forcingTime` | Durée en secondes (uint16 LE) |

```bash
echo '{"commandType":{"value":1},"dimmingLevel":{"value":100},"output":{"value":1},"forcingTime":{"value":60}}' | node downlink_encoder.js forceOutput
```

Hex : `010164013c00` — S1 ON 100 %, 60 s.

---

## `setTime` — Envoi de l’heure (`0x04`)

| Octet | Champ JSON | Sens |
|-------|------------|------|
| 0 | — | `0x04` |
| 1–4 | `timestamp` | Unix UTC, uint32 LE |
| 5–6 | `utcOffsetHours` / `utcOffsetMinutes` | Signe bits 15–14 (`01` +, `10` −), heures, minutes |
| 7 | `loraTimeUpdate` | `1` = maj via LoRa activée |

```bash
echo '{"timestamp":{"value":1743087443},"utcOffsetHours":{"value":1},"utcOffsetMinutes":{"value":0},"loraTimeUpdate":{"value":1}}' | node downlink_encoder.js setTime
```

---

## `sendCalendar` / `sendCalendarEnd` — Planning (`0x05`)

Même layout que l’uplink `0x10`, avec l’ID `0x05`. Envoyer les trames **fixes puis events**, puis `sendCalendarEnd`.

Le JSON reprend `calendarFeedback` du décodeur :

| Champ | Exemple | Sens |
|-------|---------|------|
| `minutes.mode` | `civilOffset` / `ephemerisOffset` / `range` / `all` | |
| `minutes.duskOffset` / `dawnOffset` | `10` / `-10` | Minutes ± (modes offset) |
| `hours` / `days` / `weekdays` / `months` / `years` | `{ "mode": "range", "a": 1, "b": 5 }` | Semaine : 1 = lundi … 7 = dimanche |
| `output` | `"S1"` ou `"all"` | |
| `command` | `0` = éteint, `1` = allumé, `2–99` = % | |
| `remainingFrames` | `1` | Trames encore à envoyer |
| `totalFrames` | `2` | Total de ce bloc |

```bash
echo '{"calendarFeedback":{"value":{"minutes":{"mode":"civilOffset","duskOffset":10,"dawnOffset":-10},"hours":{"mode":"all"},"days":{"mode":"range","a":1,"b":31},"weekdays":{"mode":"range","a":1,"b":5},"months":{"mode":"range","a":1,"b":7},"years":{"mode":"all"},"remainingFrames":1,"output":"S1","command":1,"totalFrames":2}}}' | node downlink_encoder.js sendCalendar
```

Hex : `054a0500809f4085408740008001406402`  
(même règle que l’exemple uplink `104a05…`).

```bash
echo '{}' | node downlink_encoder.js sendCalendarEnd
```

Hex : `05000000000000000000000000000000` — fin de dump. L’équipement répond ensuite en `0x0F`.

---

## `setPosition` — Position GPS (`0x06`)

4 octets longitude + 4 octets latitude, × 10⁶, bit de poids fort = signe.

```bash
echo '{"longitude":{"value":2},"latitude":{"value":48}}' | node downlink_encoder.js setPosition
```

---

## Requêtes 1 octet

| Service | Hex | Uplink attendu |
|---------|-----|----------------|
| `requestCalendar` | `07` | une ou plusieurs `0x10`, puis fin `10`+zéros |
| `requestTime` | `09` | `0x11` |
| `requestRssi` | `0A` | `0x0E` |
| `requestPosition` | `0B` | `0x12` |
| `requestSoftwareVersion` | `0C` | `0x0C` |
| `requestTimeChange` | `0F` | `0x13` |
| `requestConsumption` | `10` | TIC `0x01` / `0x02` / `0x03` |
| `requestRunHour` | `23` | `0x22` |

---

## `setConsumptionFrequency` — Période TIC (`0x0D`)

`consumptionFrequency` : 10–60 minutes.

```bash
echo '{"consumptionFrequency":{"value":15}}' | node downlink_encoder.js setConsumptionFrequency
```

Hex : `0d0f`.

---

## `setTimeChange` — Heure d’été (`0x0E`)

```bash
echo '{"timeChangeEnabled":{"value":1}}' | node downlink_encoder.js setTimeChange
```

Hex : `0e01` (activé, défaut usine). `0e00` pour désactiver.

---

## `reset` — Reset produit (`0x22`)

Code sur 4 octets, calculé depuis le DevEUI :

`floor(1.2 × (DevEUI[3]³ + DevEUI[4]² + DevEUI[5]³))`, puis 4 chiffres décimaux (un par octet).

Exemple spec : DevEUI `8C81260102030000` → 38 → `00 00 03 08`.

```bash
echo '{"devEUI":{"value":"8C81260102030000"}}' | node downlink_encoder.js reset
```

Hex : `2200000308`.

---

## `setDataModel` (`0x24`)

| Valeur | Sens |
|--------|------|
| `0` | Modèle classique (sans timestamp) |
| `1` | Modèle horodaté |
| `255` (`0xFF`) | Requête (l’équipement répond en `0x28`) |

```bash
echo '{"dataModel":{"value":1}}' | node downlink_encoder.js setDataModel
```

---

## `setCalendarLocked` (`0x25`)

`calendarLocked` : `0` déverrouillé, `1` verrouillé, `255` = requête (uplink `0x29`).

```bash
echo '{"calendarLocked":{"value":1}}' | node downlink_encoder.js setCalendarLocked
```

---

## `setTimeBeforeRejoin` (`0x26`)

`timeBeforeRejoin` : 3–15 jours. `255` = requête (uplink `0x2A`).

```bash
echo '{"timeBeforeRejoin":{"value":7}}' | node downlink_encoder.js setTimeBeforeRejoin
```

Hex : `2607`.
