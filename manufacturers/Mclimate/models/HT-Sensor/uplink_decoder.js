// DataCake
function Decoder(bytes, port){
    var decoded = decodeUplink({ bytes: bytes, fPort: port }).data;
    return decoded;
}

// Milesight
function Decode(port, bytes){
    var decoded = decodeUplink({ bytes: bytes, fPort: port }).data;
    return decoded;
}

// The Things Industries / Main
function decodeUplink(input) {
    try {
        var bytes = input.bytes;
        var data = {};
        
        function calculateTemperature (rawData) {return (rawData - 400) / 10;}
        function calculateHumidity (rawData) {return (rawData * 100) / 256;}

        function handleKeepalive(bytes) {
            var data = {};

            var temperatureRaw = (bytes[1] << 8) | bytes[2];
            data.sensorTemperature = Number(calculateTemperature(temperatureRaw).toFixed(2));

            data.relativeHumidity = Number(calculateHumidity(bytes[3]).toFixed(2));
            
            var batteryVoltageRaw = (bytes[4] >> 4) & 0x0F;
            data.batteryVoltage = Number((2 + batteryVoltageRaw * 0.1).toFixed(2));
            
            data.thermistorProperlyConnected = (bytes[5] & 0x20) === 0;

            var extT1 = bytes[5] & 0x0F;
            var extT2 = bytes[6];
            data.extThermistorTemperature = data.thermistorProperlyConnected 
                ? Number(((extT1 << 8 | extT2) * 0.1).toFixed(2))
                : 0;
            
            return data;
        }

        function handleResponse(bytes, data) {
             var commands = bytes.map(function (byte) {
                return ("0" + byte.toString(16)).substr(-2);
            });
            commands = commands.slice(0, -7);
            var command_len = 0;

            commands.forEach(function (command, i) {
                switch (command) {
                    case '04':
                        command_len = 2;
                        data.deviceVersions = {
                            hardware: Number(commands[i + 1]),
                            software: Number(commands[i + 2])
                        };
                        break;
                    case '12':
                        command_len = 1;
                        data.keepAliveTime = parseInt(commands[i + 1], 16);
                        break;
                    case '19':
                        command_len = 1;
                        var commandResponse = parseInt(commands[i + 1], 16);
                        data.joinRetryPeriod = (commandResponse * 5) / 60;
                        break;
                    case '1b':
                        command_len = 1;
                        data.uplinkType = parseInt(commands[i + 1], 16);
                        break;
                    case '1d':
                        command_len = 2;
                        data.watchDogParams = {
                            wdpC: commands[i + 1] === '00' ? false : parseInt(commands[i + 1], 16),
                            wdpUc: commands[i + 2] === '00' ? false : parseInt(commands[i + 2], 16)
                        };
                        break;
                    default:
                        break;
                }
                commands.splice(i, command_len);
            });
            return data;
        }

        if (bytes[0] === 1) {
            data = handleKeepalive(bytes);
        } else {
            data = handleResponse(bytes, data);
            bytes = bytes.slice(-7);
            data = handleKeepalive(bytes);
        }

        return { data: data };
    } catch (e) {
        throw new Error(e);
    }
}

let parametersMapping =  {
  sensorTemperature: {label:"sensorTemperature", unitCode: "CEL", datasetId: null},
  relativeHumidity: {label:"relativeHumidity", unitCode: "P1", datasetId: null},
  batteryVoltage: {label:"batteryVoltage", unitCode: "VLT", datasetId: null},
  extThermistorTemperature: {label:"extThermistorTemperature", unitCode: "CEL", datasetId: null},
  thermistorProperlyConnected: {label:"thermistorProperlyConnected", unitCode: null, datasetId: null},
};

function ngsildInstance(value, time = null, unitCode = null, datasetSuffix = null) {
  const ngsildInstance = {
      type: "Property",
      value: value,
  };
  if (time) {
      ngsildInstance.observedAt = time;
  }
  if (unitCode) {
      ngsildInstance.unitCode = unitCode;
  }
  if (datasetSuffix) {
      ngsildInstance.datasetId = `urn:ngsi-ld:Dataset:${datasetSuffix}`;
  }
  return ngsildInstance;
}

function ngsildWrapper(decoded, time, entity_id) {
  // On crée un objet unique représentant la device
  var ngsild_payload = {
    id: entity_id,
    type: "Device"
  };

  function addToPayload(key, value) {
    if (!ngsild_payload.hasOwnProperty(key)) {
      ngsild_payload[key] = value;
    }
    // Si la propriété existe déjà, on ne fait rien ou on écrase selon besoin
  }

    for (var key in decoded) {
        if (parametersMapping[key]) {
        addToPayload(
            parametersMapping[key].label,
            ngsildInstance(decoded[key], time, parametersMapping[key].unitCode, parametersMapping[key].datasetId)
        );
        }
    }
  return ngsild_payload
}

function main() {
    var fPort = process.argv[2];
    var payload = Buffer.from(process.argv[3], 'hex');
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    var decoded = Decode(fPort, payload);
    var ngsild_payload = ngsildWrapper(decoded, time, entity_id);
    console.log(JSON.stringify(ngsild_payload, null, 2));
}

if (require.main === module) {
    main();
}
