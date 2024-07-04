# device-catalog
This repository contains lora configuration information and uplink decoders to decode the LoRaWAN frame to NGSI-LD payloads so the LoRaWAN uplinks/downlinks can be pushed/pulled from/to a NGSI-LD broker such as Stellio.
Its content is fetched by the Twin·Picks application so any device declared here can be provisionned in few clicks in Twin·Picks.
To add a new device (e.g. adding *Econom'O* device from *EGM*), you need to:
1. Create the folders (e.g. *manufacturers\EGM\models\EconomO*)
2. Add the configuration and decoding files
* Configuration file is to be named *config.json* and contains information related to the LoRaWAN network servers it could be connected to
* Decoder file. It can be javascript or python file and is refered to in the *config.json* file.

## Configuration file description
To be done

## Decoder file syntax
