# Citylone SMART-LIGHTING BOX — uplinks décodés

Décodeur : `uplink_decoder.js`  
Sources : *Citylone LoRa Product Frame Descriptions v2.0.17* (colonnes **All** et **SLB** uniquement).

## Conventions

- L’**identifiant de trame** est le **premier octet** du payload LoRaWAN, pas le fPort.
- Les entiers multi-octets sont en **little-endian** (LSB d’abord).
- `0` = contact ouvert, `1` = contact fermé.
- Sorties S1–S4 : bit `0` = S1 … bit `3` = S4. État `0` = éteint, `1` = allumé. Mode `0` = Auto, `1` = Priority.
- Si la trame porte un timestamp UTC, il remplace l’heure LNS dans `observedAt`.
- Les trames **Node** (DALI, SL-Connect) ne sont pas décodées.

```bash
node uplink_decoder.js <fPort> <payloadHex> <timeISO> <devEui>
```

Le `fPort` est ignoré pour le parsing (souvent `1`). Exemple :

```bash
node uplink_decoder.js 1 090301 2026-03-04T09:12:17Z 0A1B2C3D4E5F6789
```

| ID | Hex | Nom | Produit | Quand |
|----|-----|-----|---------|-------|
| 1 | `0x01` | TIC meter frame 1 | SLB | Toutes les X min |
| 2 | `0x02` | TIC meter frame 2 | SLB | Toutes les 3X min (vide si pas de compteur) |
| 3 | `0x03` | TIC meter frame 3 | SLB | Toutes les 3X min |
| 4 | `0x04` | Power failure | SLB | À chaque coupure |
| 7 | `0x07` | Dry contact input 1 | All | Changement d’état |
| 9 | `0x09` | SLB output feedback | SLB | Changement d’état / boot |
| 11 | `0x0B` | Dry contact input 2 | SLB | Changement d’état |
| 12 | `0x0C` | Software versions | All | Sur demande |
| 14 | `0x0E` | RSSI LoRa | All | Sur demande |
| 15 | `0x0F` | Calendar error feedback | All | Réception calendrier |
| 16 | `0x10` | Calendar feedback | All | Sur demande (écho du planning) |
| 17 | `0x11` | Current time | All | Sur demande |
| 18 | `0x12` | Position | All | Sur demande |
| 19 | `0x13` | Time change | All | Sur demande |
| 33 | `0x21` | Internal failures | SLB | Changement d’état |
| 34 | `0x22` | Run hours | SLB | 1× / jour |
| 35 | `0x23` | Outputs + timestamp | SLB | Changement d’état |
| 36 | `0x24` | Dry contact 1 + timestamp | SLB | Changement d’état |
| 37 | `0x25` | Dry contact 2 + timestamp | SLB | Changement d’état |
| 38 | `0x26` | TIC 1 + timestamp | SLB | Toutes les X min |
| 39 | `0x27` | TIC identity / max | SLB | 1× / jour |
| 40 | `0x28` | Data model | SLB | Sur demande |
| 41 | `0x29` | Calendar locked | SLB | Sur demande |
| 42 | `0x2A` | Time before rejoin | All | Sur demande |

---

## `0x01` — Index TIC (BASE / HC / HP)

13 octets : ID + 3 × uint32 (Wh).

| Octets | Champ |
|--------|--------|
| 0 | `0x01` |
| 1–4 | Index BASE |
| 5–8 | Index HCHC |
| 9–12 | Index HCHP |

**Exemple** — BASE = 1000 Wh : `01e80300000000000000000000`

```json
{
  "activeEnergy": [
    { "value": 1000, "unitCode": "WHR", "datasetId": "urn:ngsi-ld:Dataset:BASE:Raw" },
    { "value": 0, "unitCode": "WHR", "datasetId": "urn:ngsi-ld:Dataset:HCHC:Raw" },
    { "value": 0, "unitCode": "WHR", "datasetId": "urn:ngsi-ld:Dataset:HCHP:Raw" }
  ]
}
```

---

## `0x02` — TIC étendu (contacts, ADCO, option tarifaire, index)

33 octets. Sans compteur TIC, la SLB peut n’envoyer que l’ID (trame vide).

| Octets | Champ |
|--------|--------|
| 0 | `0x02` |
| 1–2 | Contacts secs 1 et 2 |
| 3–15 | ADCO (13 caractères) |
| 16–20 | OPTARIF (5 caractères) |
| 21–32 | Index BASE, HCHC, HCHP |

**Exemple** : `020100313233343536373839303132334241534520e80300000000000000000000`

→ In1 `1` (fermé), In2 `0` (ouvert), `meterId` = `1234567890123`, `tariffOption` = `BASE`, BASE = 1000 Wh.

---

## `0x03` — Grandeurs électriques TIC

23 octets, uint16 LE, courants en A, puissances en W / VA.

| Octets | Champ NGSI-LD |
|--------|----------------|
| 1–2 | `current` (mono) |
| 3–8 | `current` L1 / L2 / L3 |
| 9–16 | `current` Max / Max L1–L3 |
| 17–18 | `activePower` Max |
| 19–20 | `subscribedPowerAlarm` (ADPS) |
| 21–22 | `apparentPower` (PAPP) |

**Exemple** : `030a000b000c000d001400150016001700e8030000e803`

→ IINST=10 A, I1/I2/I3=11/12/13 A, IMAX=20 A, PMAX=1000 W, PAPP=1000 VA.

---

## `0x04` — Coupure secteur

1 octet : `04`

```json
{ "powerFailure": { "type": "Property", "value": true } }
```

---

## `0x07` / `0x0B` — Contacts secs 1 et 2

| Trame | Payload | Résultat |
|-------|---------|----------|
| Contact 1 fermé | `0701` | `digitalInput` = `1`, dataset `In1:Raw` |
| Contact 2 fermé | `0b01` | `digitalInput` = `1`, dataset `In2:Raw` |
| Contact 1 ouvert | `0700` | `0` |

---

## `0x09` — État des sorties S1–S4

3 octets : ID, bitmap état (`1` = allumé, `0` = éteint), bitmap Auto/Priority.

**Exemple** `090301` — bits état `0000 0011` (S1+S2 = 1), bits mode `0000 0001` (S1 Priority) :

```json
{
  "outputStatus": [
    { "value": 1, "datasetId": "urn:ngsi-ld:Dataset:S1:Raw" },
    { "value": 1, "datasetId": "urn:ngsi-ld:Dataset:S2:Raw" },
    { "value": 0, "datasetId": "urn:ngsi-ld:Dataset:S3:Raw" },
    { "value": 0, "datasetId": "urn:ngsi-ld:Dataset:S4:Raw" }
  ],
  "outputMode": [
    { "value": "Priority", "datasetId": "urn:ngsi-ld:Dataset:S1:Raw" },
    { "value": "Auto", "datasetId": "urn:ngsi-ld:Dataset:S2:Raw" },
    { "value": "Auto", "datasetId": "urn:ngsi-ld:Dataset:S3:Raw" },
    { "value": "Auto", "datasetId": "urn:ngsi-ld:Dataset:S4:Raw" }
  ]
}
```

---

## `0x0C` — Versions

`0x21` → `V2.1` (nibble haut.nibble bas).

**Exemple** `0c2120` → software `V2.1`, firmware `V2.0`.

---

## `0x0E` — RSSI / SNR

RSSI = −(uint16) dBm. SNR = int8.

**Exemple** `0e72000a` → RSSI **-114 dBm**, SNR **10 dB**.

---

## `0x0F` — Retour calendrier

| Valeur | `calendarStatus` |
|--------|------------------|
| 1 | `goodReception` |
| 2 | `wrongReception` |
| 3 | `storeCalendarOk` |
| 4 | `calendarModifiedByBle` |

**Exemple** `0f03` → `storeCalendarOk`.

---

## `0x10` — Écho du calendrier

Même format que le downlink ID `0x05`, avec l’octet d’identification passé à `0x10`. Une requête calendrier déclenche **n** uplinks (events puis fixes). La fin est une trame `0x10` suivie de zéros (`[16.0]`).

| Octets | Champ |
|--------|--------|
| 0 | `0x10` |
| 1–2 | Minutes / offset crépuscule–aube (bits 15–14 = mode) |
| 3–4 | Heures |
| 5–6 | Jours du mois |
| 7–8 | Jours de semaine (1 = lundi … 7 = dimanche) |
| 9–10 | Mois |
| 11–12 | Années |
| 13 | Trames restantes |
| 14 | Sortie (`01` + index = S1–S4, `10` = toutes) |
| 15 | Commande : `0` = éteint, `1–99` = %, `≥100` = `1` (allumé) |
| 16 | Nombre total de trames (si présent) |

Modes d’un couple A/B : `range`, `all`, `civilOffset` / `ephemerisOffset` (minutes), `fixed` (heures).

**Exemple** (1re trame fixe du PDF, ID changé en `0x10`) : `104a0500809f4085408740008001406402`

→ S1 commande `1`, éphéméride civile crépuscule **+10 min** / aube **−10 min**, lundi–vendredi, 01/01–31/07, tous les ans, 1 trame restante sur 2.

**Fin de dump** : `10000000000000000000000000000000` → `calendarEnd` = true.

---

## `0x11` — Heure courante

| Octets | Champ |
|--------|--------|
| 1–4 | Timestamp Unix UTC |
| 5–6 | Offset : 2 bits de signe (`01` = +, `10` = −), 7 bits heures, 7 bits minutes |
| 7 | `1` = maj d’heure via LoRa activée |

**Exemple** `115367e567804001` → `2025-03-27T14:57:23Z`, offset **+1 h**, `loraTimeUpdate` = true.

---

## `0x12` — Position GPS

4 octets longitude + 4 octets latitude, × 10⁻⁶, bit de poids fort = signe (1 = négatif). Exposé en `GeoProperty` `[lon, lat]`.

**Exemple** `1280841e00006cdc02` → Point **(2, 48)**.

---

## `0x13` — Changement d’heure (été/hiver)

`1301` → `timeChangeEnabled` = true. `1300` = désactivé.

---

## `0x21` — Défaut interne

| Code | `internalFailure` |
|------|-------------------|
| 0 | `none` |
| 1 | `restartSpi` |
| 2 | `restartSpiAndMainboard` |
| 3 | `noBleAtStart` |
| 4 | `resetMainboard` |
| 5 | `rtcI2cProblem` |
| 6 | `loraBusy` |
| 7 | `uartBleKo` |
| 11 | `loraSilenceFor3Days` |
| 12 | `loraSafety` |
| 13 | `timeRequestFailed` |

**Exemple** `2105` → `rtcI2cProblem`.

---

## `0x22` — Heures de fonctionnement

13 octets : ID + 4 × uint24 (heures) pour S1–S4.

**Exemple** `220a0000000000000000000000` → S1 = **10 h**, S2/S3/S4 = 0.

---

## `0x23` — Sorties + timestamp

Comme `0x09` + Unix UTC sur 4 octets. `observedAt` vient du device.

**Exemple** `2301005367e567` — S1 = `1`, modes Auto, `observedAt` = `2025-03-27T14:57:23Z`.

---

## `0x24` / `0x25` — Contacts + timestamp

| Trame | Exemple | Résultat |
|-------|---------|----------|
| `0x24` | `24015367e567` | In1 `1` à `2025-03-27T14:57:23Z` |
| `0x25` | `25005367e567` | In2 `0` à la même date |

---

## `0x26` — TIC horodaté (longueur variable)

Octet 1 : `0` = monophasé, `1` = triphasé.  
Octet 2 : `1` = BASE, `2` = HC, `3` = HP.

Ensuite : index, PAPP, ECS1/ECS2, timestamp, éventuellement HCHP, courants, puissance active estimée.

**Exemple mono BASE** (19 octets) : `260001e8030000e80301005367e5670a00e803`

→ 1 phase, BASE = 1000 Wh, PAPP = 1000 VA, In1 `1`, In2 `0`, I = 10 A, P = 1000 W, `observedAt` device.

---

## `0x27` — Identité compteur / max journaliers

ADCO (13) + OPTARIF (5) + PMAX + IMAX (+ IMAX2/IMAX3 en triphasé).

**Exemple** `27313233343536373839303132334241534520e8030a00`

→ `meterId` `1234567890123`, `BASE`, PMAX = 1000 W, IMAX = 10 A.

---

## `0x28` / `0x29` / `0x2A` — Config

| Trame | Exemple | Résultat |
|-------|---------|----------|
| Data model | `2801` | `dataModel` = `timestamped` (`2800` = `classical`) |
| Calendar lock | `2901` | `calendarLocked` = true |
| Rejoin | `2a07` | `timeBeforeRejoin` = 7 jours |

---

## Attributs NGSI-LD

Les grandeurs répétées (sorties, index, courants) utilisent un `datasetId` :

| Attribut | datasetId typiques |
|----------|-------------------|
| `outputStatus` / `outputMode` / `runHour` | `S1:Raw` … `S4:Raw` |
| `digitalInput` | `In1:Raw`, `In2:Raw` |
| `activeEnergy` | `BASE:Raw`, `HCHC:Raw`, `HCHP:Raw` |
| `current` | `Raw`, `L1:Raw`, `Max:Raw`, … |

`location` est une `GeoProperty` (Point GeoJSON), pas une Property.
