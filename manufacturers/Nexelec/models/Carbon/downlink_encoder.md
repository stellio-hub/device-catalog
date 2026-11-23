# Nexelec Insafe+ Carbon — downlinks encodés

Encodeur : `downlink_encoder.js`
Source : *D678I Insafe+ Carbon LoRa Technical Guide*, rév. I, §5.13.

## Conventions

- fPort LoRaWAN : **56** (décimal), comme les uplinks — validé sur capteur réel.
- Trame : en-tête `0x55`, puis des paires `ID commande` + `données`, triées par ID croissant (recommandation Nexelec).
- Entiers sur 2 octets en big-endian.
- Entrée : JSON NGSI-LD sur stdin (`{ "champ": { "value": ... } }`). Seuls les champs présents sont encodés.
- Argument CLI : nom du **service**.
- Sortie : `{ "data": "<base64>", "port": 56 }`.
- Après une reconfiguration, le capteur renvoie ses trames de configuration (0x8 et 0x9).

```bash
echo '{"deltaTemperature":{"value":0.5}}' | node downlink_encoder.js setRealTimeData
```

## Services

| Service | Champs acceptés |
|---|---|
| `requestGeneralConfig` | aucun (ID 0x01) |
| `requestCo2Config` | aucun (ID 0x02) |
| `setLed` | `ledEnabled`, `orangeLedEnabled` |
| `setButtonNotification` | `buttonNotificationEnabled` |
| `setRealTimeData` | `realTimeDataEnabled`, `deltaTemperature`, `deltaHumidity`, `deltaCo2`, `realTimeSendingPeriod` |
| `setDatalog` | `datalogEnabled`, `datalogDecimation` |
| `setTemperatureAlert` | `temperatureAlertEnabled`, `temperatureThreshold1`, `temperatureThreshold2` |
| `setCo2Thresholds` | `co2AlertEnabled`, `co2Threshold1`, `co2Threshold2` |
| `setKeepalive` | `keepaliveEnabled`, `keepalivePeriod` |
| `setNfc` | `nfcEnabled` |
| `setSmartPeriods` | `smartPeriod1`, `smartPeriod2` |
| `setAltitude` | `altitude` |
| `setClock` | `clock` (le capteur redémarre) |
| `shiftClock` | `clockShift` (le capteur redémarre) |
| `scheduleJoin` | `joinDelay` |
| `configure` | n'importe quelle combinaison des champs ci-dessous, dans une seule trame |

## Champs

| Champ | ID | Unité / format | Plage |
|---|---|---|---|
| `ledEnabled` | 0x03 | booléen | |
| `buttonNotificationEnabled` | 0x04 | booléen | |
| `realTimeDataEnabled` | 0x05 | booléen | |
| `datalogEnabled` | 0x06 | booléen | |
| `temperatureAlertEnabled` | 0x07 | booléen | |
| `co2AlertEnabled` | 0x08 | booléen | |
| `keepaliveEnabled` | 0x09 | booléen | |
| `nfcEnabled` | 0x0A | booléen | |
| `datalogDecimation` | 0x0B | facteur | 1 – 9 |
| `temperatureThreshold1` / `2` | 0x0C / 0x0D | °C, pas de 0,1 | 0 – 50 |
| `deltaTemperature` | 0x0E | °C, pas de 0,1 | 0 – 9,9 |
| `deltaHumidity` | 0x0F | %RH, pas de 0,5 | 0 – 9,5 |
| `deltaCo2` | 0x10 | ppm, pas de 20 | 0 – 5000 |
| `keepalivePeriod` | 0x11 | heures | 1 – 99 |
| `co2Threshold1` / `2` | 0x12 / 0x13 | ppm, pas de 20 (LED + alertes) | 0 – 5000 |
| `smartPeriod1` / `2` | 0x14 / 0x15 | `{ enabled, days: ["monday", …], startTime, duration }` (heures, pas de 0,5) | début 0 – 23,5, durée 0 – 24 |
| `altitude` | 0x16 | m, pas de 50 | 0 – 10000 |
| `clock` | 0x17 | date-heure ISO 8601 (UTC) | 2000 – 2100 |
| `clockShift` | 0x18 | minutes (signé : + avance, − recule) | −250 – 250 |
| `joinDelay` | 0x1C | minutes, pas de 10 | 10 – 10080 |
| `orangeLedEnabled` | 0x27 | booléen (inversé à l'encodage : le capteur attend 1 = LED orange désactivée) | |
| `realTimeSendingPeriod` | 0x49 | minutes, pas de 10 | 10 – 630 |

Une valeur hors plage ou un service inconnu lève une erreur.
