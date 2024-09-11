# device-catalog
This repository contains lora configuration information and uplink decoders to decode the LoRaWAN frame to NGSI-LD payloads so the LoRaWAN uplinks/downlinks can be pushed/pulled from/to a NGSI-LD broker such as [Stellio](https://github.com/stellio-hub/stellio-context-broker)
Its content is fetched by the Twin·Picks application so any device declared here can be provisionned in few clicks in Twin·Picks.
To add a new device (e.g. adding *Econom'O* device from *EGM*), you need to:
1. Create the folders (e.g. *manufacturers\EGM\models\EconomO*)
2. Add the configuration and decoding files
* Configuration file is to be named *config.json* and contains information related to the LoRaWAN network servers it could be connected to
* Decoder file needs to be a javascript or python file, its name is refered to in the *config.json* file.


## Configuration file description
The configutation is a json file that must contain the following keys/values:

* "uplinkDecoder": name of the decoder (e.g. *uplink_decoder.py*)

* "ngsildContext": link of the jsonld context to be used when pushing the decoded data to the NGSI-LD broker (e.g. *https://easy-global-market.github.io/ngsild-api-data-models/airQuality/jsonld-contexts/airQuality-compound.jsonld*) EGM provides a set of context for multiples usecases here: [data-models](https://github.com/easy-global-market/ngsild-api-data-models). Any other valid jsonld file can be used instead.

* "chirpstack": object containing all the information required to register a device on [Chirpstack](https://www.chirpstack.io/) e.g.
```
    {
        "region": "EU868",
        "macVersion": 0,
        "regParamsRevision": "A",
        "adrAlgorithmId": "default",
        "flushQueueOnActivate": true,
        "uplinkInterval": 86400,
        "supportsOTAA": true,
        "supportsClassB": false,
        "supportsClassC": false
    }
```
 See https://www.chirpstack.io/docs/chirpstack/api/api.html#api-DeviceProfile for more details

* "liveObjects": object containing all the information required to register a device on [Orange Live Objects](https://liveobjects.orange-business.com/#/liveobjects) e.g. 
```
    {
        "profile": "Generic_classA_RX2SF12",
        "activationType": "OTAA",
        "connectivityPlan": "orange-cs/CP_Basic"
    }
```

## Decoder file syntax
The decoder is a python or javascript file, the starting point is usually the classic decoder given by the manufacturer, to which we add a NGSI-LD wrapper, to make the output NGSI-LD compliant and ready to be sent to the broker.
A typical example of decoder:

```
function Decode(fPort, bytes){
    *decoding function provided by the manufacturer*
}

function ngsildInstance(value, time, unit, dataset_suffix) {
    var ngsild_instance = {
        type: 'Property',
        value: value,
        observedAt: time
    }
    if (unit !== null) {
        ngsild_instance.unitCode = unit
    }
    if (dataset_suffix !== null) {
        ngsild_instance.datasetId = 'urn:ngsi-ld:Dataset:' + dataset_suffix
    }
    return ngsild_instance
}

function ngsildWrapper(input, time, entity_id) {
    var ngsild_payload = [{
        id: entity_id,
        type: "Device"
        temperature: ngsildInstance(input[0], time, "CEL")
        humidity: ngsildInstance(input[0], time, "P1")
        co2: ngsildInstance(input[2], time, "59")
    }];
    return ngsild_payload;                                                                                                                                                                                                                                                                                                                                          
}

function main() {
    var fport = process.argv[2];
    var bytes = Uint8Array.from(Buffer.from(process.argv[3], 'hex'));
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    var decoded = Decode(fport, bytes);
    var ngsild_payload = ngsildWrapper(decoded, time, entity_id);
    process.stdout.write(JSON.stringify(ngsild_payload));
}

if (require.main === module) {
    main();
}
```

## Contribute
This catalog aims at being a collaborative space in which contributions from the community of users are welcomed. 
Contribution are expected to be done using Git as a versioning tool. To support quality of the code base, no direct commit to the repository is possible. These should be done using [“Pull-Request”](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests). You can ask for authoriztion to pullè-requets n the repository by writting an e.mail at contact@stellio.io.

