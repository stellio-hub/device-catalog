# Device catalog

This repository contains configuration information and uplink decoders to decode LoRaWAN frames to NGSI-LD payloads so the LoRaWAN uplinks/downlinks can be pushed/pulled from/to a NGSI-LD context broker such as [Stellio](https://github.com/stellio-hub/stellio-context-broker).

Its content is fetched by the Twin·Picks application so any device declared here can be provisionned in few clicks in Twin·Picks.

## General process when adding a device

To add a device (e.g. adding *Econom'O* device from *EGM*), you need to:
1. Create the folders (e.g. *manufacturers\EGM\models\EconomO*)
2. Add the configuration and decoding files:
  * Configuration file must be named *config.json* and contain information related to the LoRaWAN network servers it could be connected to
  * Decoder file needs to be a Javascript or Python file, its name is referred to in the *config.json* file.

## Configuration file description

The configuration is described in a JSON file that must contain the following keys/values:

* `uplinkDecoder`: name of the decoder file (e.g. *uplink_decoder.py*)

* `ngsildContext`: link of the JSON-LD context to be used when pushing the decoded data to the NGSI-LD broker (e.g. *https://easy-global-market.github.io/ngsild-api-data-models/airQuality/jsonld-contexts/airQuality-compound.jsonld*). EGM provides a set of contexts for multiple use cases in [a data models repository](https://github.com/easy-global-market/ngsild-api-data-models). Any other valid JSON-LD context can be used instead.

* `chirpstack`: object containing all the information required to register a device on [Chirpstack](https://www.chirpstack.io/), e.g.

```json
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

* `liveObjects`: object containing all the information required to register a device on [Orange Live Objects](https://liveobjects.orange-business.com/#/liveobjects), e.g. 

```json
    {
        "profile": "Generic_classA_RX2SF12",
        "activationType": "OTAA",
        "connectivityPlan": "orange-cs/CP_Basic"
    }
```

## Decoder file syntax

The decoder is a Python or Javascript file. The starting point is usually the classic decoder given by the manufacturer, to which we add a NGSI-LD wrapper to make the output NGSI-LD compliant and ready to be sent to the broker (details on the output format are given in the next part).

### Example of a Python decoder

```python
def Decode(fPort, bytes):
    """ decoding function provided by the manufacturer """

def ngsild_instance(value, time, unitCode, dataset_suffix):
    ngsild_instance = {
        "type": "Property",
        "value": value,
        "observedAt": time
    }
    if unitCode is not None:
        ngsild_instance['unitCode'] = unitCode
    if dataset_suffix is not None:
        ngsild_instance['datasetId'] = f"urn:ngsi-ld:Dataset:{dataset_suffix}"
    return ngsild_instance 

def ngsild_wrapper(input, time, entity_id):
    ngsild_payload = [{
        "id": entity_id,
        "type": "Device"
        "temperature": ngsild_instance(input[0], time, "CEL", "Raw")
        "humidity": ngsild_instance(input[1], time, "P1", "Raw")
        "co2": ngsild_instance(input[2], time, "59", "Raw")
    }]

def main():
    fport = sys.argv[1]
    payload = sys.argv[2]
    time = sys.argv[3]
    entity_id = f"urn:ngsi-ld:Device:{sys.argv[4]}"
    decoded = json.loads(decode_payload(payload, fport))
    ngsild_payload = ngsild_wrapper(decoded, time, entity_id)
    json.dump(ngsild_payload, sys.stdout, indent=4)

if __name__ == "__main__":
    main()
```

### Example of a Javascript decoder

```js
function Decode(fPort, bytes){
    /* decoding function provided by the manufacturer */
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
        temperature: ngsildInstance(input[0], time, "CEL", "Raw")
        humidity: ngsildInstance(input[1], time, "P1", "Raw")
        co2: ngsildInstance(input[2], time, "59", "Raw")
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

## Decoder execution

The decoders can be called with the following arguments:
* `python3 uplink_decoder.py *fPort* *payload* *time* *devEui*`
* `node uplink_decoder.js *fPort* *payload* *time* *devEui*`

Important note: in Python, fPort will be sys.argv[1] while in Javascript fPort will be process.argv[2].

## Ouptut of the decoder

The output of the decoder is a JSON payload ready to be sent to the Batch Entity Merge (*/entityOperations/merge*) endpoint of the [NGSI-LD API](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.08.01_60/gs_CIM009v010801p.pdf).

### Basic payload

In a basic case, where the device sends one instance of multiple attributes, the payload should look like this:

```json
[ {
  "id" : "urn:ngsi-ld:Device:*devEui*",
  "type" : "Device",
  "temperature" : {
    "type" : "Property",
    "value" : 1684,
    "observedAt" : "2024-09-17T08:19:37Z",
    "datasetId" : "urn:ngsi-ld:Dataset:Raw"
  },
  "humidity" : {
    "type" : "Property",
    "observedAt" : "2024-09-17T08:19:37Z",
    "value" : 5.0,
    "datasetId" : "urn:ngsi-ld:Dataset:Raw"
  },
  "co2" : {
    "value" : -101,
    "datasetId" : "urn:ngsi-ld:Dataset:Raw",
    "type" : "Property",
    "observedAt" : "2024-09-17T08:19:37Z"
  }
} ]
```

### Multiple temporal instances

If the device sends multiple instances of a given attribute (i.e. multiple measurements of the same thing at different times) in a single message, the payload should look like this:

```json
[ {
  "id" : "urn:ngsi-ld:Device:*devEui*",
  "type" : "Device",
  "temperature" : {
    "type" : "Property",
    "value" : 1684,
    "observedAt" : "2024-09-17T08:19:37Z",
    "datasetId" : "urn:ngsi-ld:Dataset:Raw"
  },
  "humidity" : {
    "type" : "Property",
    "observedAt" : "2024-09-17T08:19:37Z",
    "value" : 5.0,
    "datasetId" : "urn:ngsi-ld:Dataset:Raw"
  },
},
{
  "id" : "urn:ngsi-ld:Device:*devEui*",
  "type" : "Device",
  "temperature" : {
    "type" : "Property",
    "value" : 1752,
    "observedAt" : "2024-09-17T09:39:37Z",
    "datasetId" : "urn:ngsi-ld:Dataset:Raw"
  },
  "humidity" : {
    "type" : "Property",
    "observedAt" : "2024-09-17T09:39:37Z",
    "value" : 6.0,
    "datasetId" : "urn:ngsi-ld:Dataset:Raw"
  },
} ]
```

### Multiple datasets

If the device sends multiple "versions" of the same attribute (i.e. a device measures the same thing with 2 different probes), distinct `datasetId` should be used and the payload should look like this:

```json
[ {
  "id" : "urn:ngsi-ld:Device:*devEui*",
  "type" : "Device",
  "temperature" : [
    {
      "type" : "Property",
      "value" : 1684,
      "observedAt" : "2024-09-17T08:19:37Z",
      "datasetId" : "urn:ngsi-ld:Dataset:Probe_1:Raw"
    },
    {
      "type" : "Property",
      "observedAt" : "2024-09-17T08:19:37Z",
      "value" :  1667,
      "datasetId" : "urn:ngsi-ld:Dataset:Probe_2:Raw"
    }
  ],
  "humidity" : {
    "type" : "Property",
    "observedAt" : "2024-09-17T08:19:37Z",
    "value" : 5.0,
    "datasetId" : "urn:ngsi-ld:Dataset:Raw"
  }
} ]
```
### Using add_to_payload function

The easiest way to make sure that the generated output is correct is to use the `add_to_payload` function, which will check whether or not an attribute is already present in the entity and will add a new one to the list if needed. Here are exemples of basic wrappers that use this function (the loop at the end is given as a basic example that does not care about unitCodes, renaming attributes, ... and is usually more complex): 

#### Python example

```python
def ngsild_wrapper(input, time, entity_id):
    ngsild_payload = [{
        "id": entity_id,
        "type": "Device"
    }]

    def add_to_payload(key, value):
        if all(key in d for d in ngsild_payload):
            ngsild_payload.append({"id": entity_id, "type": "Device", key: value})
        else:
            for d in ngsild_payload:
                if key not in d:
                    d[key] = value
                    break
    
    for item in input:
        add_to_payload(item, ngsild_instance(input[item]['value'], input[item]['timestamp'], None, "Raw"))
    
    return ngsild_payload
```

#### Javascript example

```js
function ngsildWrapper(input, time, entity_id) {
    var ngsild_payload = [{
        id: entity_id,
        type: "Device"
    }];

    function addToPayload(key, value) {
        if (ngsild_payload.every(d => d.hasOwnProperty(key))) {
            ngsild_payload.push({id: entity_id, type: "Device", ...{[key]: value}});
        } else {
            for (let d of ngsild_payload) {
                if (!d.hasOwnProperty(key)) {
                    d[key] = value;
                    break;
                }
            }
        }
    }

    input.forEach(item => {
        addToPayload(item, ngsildInstance(item.value, item.timestamp, null, "Raw"));
    })

    return ngsild_payload
}
```

### Important notes

* The convention in NGSI-LD is that attribute names are in camelCase, which is usually not what the decoder provided by the manufacturer returns as output so the name needs to be changed.
* Adding a unit code is a recommended practice and should be done when possible. The code to be added is the UN CEFACT Code corresponding to the unit of measurement of the attribute. 
* The `time` parameter that is passed as argument to the decoder is the time provided by the Lora server and should be used when the device does not send any timestamp in its payload.

## Contribute

This catalog aims at being a collaborative space in which contributions from the community of users are very welcomed. 

Contributions are expected to be done using Git as a versioning tool. To ensure the quality of the code base, no direct commit to the repository is possible, contributions should be done using [pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests).

The procedure to contribute is the following
1. Create a [fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) of this repository.
2. Create a branch in your fork.
3. Do your contribution/fix in this branch.
4. Submit a pull request to merge your branch with the upstream repository (this one).
