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

function convertHexToChar(hex){
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    }
    return str;
}

function decodeCommandType(commandType) {
    switch (commandType) {
        case 0:
            return "classicCommand";
        case 1:
            return "classicCommandCrc";
        case 2:
            return "additionalCommand";
        case 3:
            return "additionalCommandCrc";
        default:
            break;
    }
    return "unknownCommandType"
}

function decodeData(ngsildPayload, sensorAddress, encoded, time) {
    const ADDITIONAL_CMD_NUMB = (parseInt(encoded.slice(0, 2), 16) & 0xf0) >> 4;
    const SEND_CMD_NUMB = parseInt(encoded.slice(0, 2), 16) & 0x0f;
    data = convertHexToChar(encoded.slice(2, encoded.length));
    // Hydrascout probe
    if(sensorAddress >= '0' && sensorAddress <= '5') {
        const SENSOR_ID = 3*SEND_CMD_NUMB; // 3 sensors measurement per command
        if(ADDITIONAL_CMD_NUMB == 0) {
            // Volumetric moisture data
            const MOISTURE_DATA_ARRAY = data.match(/[+-]?\d+(?:\.\d+)?/g).map(parseFloat);
            for(let i = 0; i < MOISTURE_DATA_ARRAY.length; i++) {
                if(MOISTURE_DATA_ARRAY[i] > 100.0 || MOISTURE_DATA_ARRAY[i] < 0.0) {
                    return;
                }     
            }
            ngsildPayload[0].volumetricMoisture = [];
            for(let i = 0; i < MOISTURE_DATA_ARRAY.length; i++) {
                    ngsildPayload[0].volumetricMoisture[i] = ngsildInstance(MOISTURE_DATA_ARRAY[i], time, "P1", "Probe"+sensorAddress+":"+"Sensor"+(SENSOR_ID+i)+":Raw");
            }
        }
        if(ADDITIONAL_CMD_NUMB == 1) {
            // Soil temperature data
            const TEMPERATURE_DATA_ARRAY = data.match(/[+-]?\d+(?:\.\d+)?/g).map(parseFloat);
            for(let i = 0; i < TEMPERATURE_DATA_ARRAY.length; i++) {
                if(TEMPERATURE_DATA_ARRAY[i] > 70.0 || TEMPERATURE_DATA_ARRAY[i] < -40.0) {
                    return;
                }     
            }
            ngsildPayload[0].soilTemperature = [];
            for(let i = 0; i < TEMPERATURE_DATA_ARRAY.length; i++) {
                    ngsildPayload[0].soilTemperature[i] = ngsildInstance(TEMPERATURE_DATA_ARRAY[i], time, "CEL", "Probe"+sensorAddress+":"+"Sensor"+(SENSOR_ID+i)+":Raw");
            }
        }
    }
}

function decode(port, encoded, time, entityId) {
    const ngsildPayload = [{ id: entityId, type: "Device" }];
    var date = time;
    var epoch = 0, sensorAddress = 0;

    switch (port) {
        case "2":
            epoch = encoded.slice(0, 8);
            epoch = new Date(parseInt(epoch, 16)*1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            const SOFT_VERSION = 'V' + encoded[8] + '.' + encoded[9];
            const APP_ID = parseInt(encoded.slice(10, 12), 16);
            const BOARD_ID = parseInt(encoded.slice(12, 16), 16);
            const SENSOR_NUMBER = parseInt(encoded.slice(16, 18), 16);
            const REDUNDANCY = parseInt(encoded.slice(18, 20), 16);
            const MEASUREMENT_FREQUENCY = parseInt(encoded.slice(20, 24), 16);
            const BATTERY = Number(encoded.slice(24, 28), 16) / 1000;
            ngsildPayload[0].softwareVersion = ngsildInstance(SOFT_VERSION, date, null, null);
            ngsildPayload[0].applicationId = ngsildInstance(APP_ID, date, null, null);
            ngsildPayload[0].boardId = ngsildInstance(BOARD_ID, date, null, null);
            ngsildPayload[0].sensorNumber = ngsildInstance(SENSOR_NUMBER, date, null, null);
            ngsildPayload[0].redundancy = ngsildInstance(REDUNDANCY, date, null, null);
            ngsildPayload[0].measurementFrequency = ngsildInstance(MEASUREMENT_FREQUENCY, date, "MIN", null);
            ngsildPayload[0].batteryVoltage = ngsildInstance(BATTERY, date, "VLT", "Raw");
            break;
        case "5":
            const REJOIN_DATE = parseInt(encoded.slice(0, 8), 16);
            ngsildPayload[0].rejoinDate = ngsildInstance(REJOIN_DATE, date, "SEC", "Raw");
            break;
        case "8":
            const MEASUREMENT_FREQUENCY_UPDATED = parseInt(encoded.slice(0, 4), 16);
            ngsildPayload[0].measurementFrequency = ngsildInstance(MEASUREMENT_FREQUENCY_UPDATED, date, "MIN", null);
            break;
        case "50":
            epoch = encoded.slice(0, 8);
            epoch = new Date(parseInt(epoch, 16)*1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            sensorAddress = String.fromCharCode(parseInt(encoded.slice(8, 10), 16));
            const SDI12_PROTOCOL_VERSION = 'V' + convertHexToChar(encoded.slice(10, 12)) + '.' + convertHexToChar(encoded.slice(12, 14));
            const VENDOR_ID = convertHexToChar(encoded.slice(14, 30));
            const SENSOR_MODEL = convertHexToChar(encoded.slice(30, 42));
            const SENSOR_VERSION = convertHexToChar(encoded.slice(42,48));
            const SENSOR_ADDITIONAL_INFO = convertHexToChar(encoded.slice(48,encoded.length));
            ngsildPayload[0].sdi12ProtocolVersion = ngsildInstance(SDI12_PROTOCOL_VERSION, date, null, "Probe"+sensorAddress);
            ngsildPayload[0].vendorId = ngsildInstance(VENDOR_ID, date, null, "Probe"+sensorAddress);
            ngsildPayload[0].sensorModel = ngsildInstance(SENSOR_MODEL, date, null, "Probe"+sensorAddress);
            ngsildPayload[0].sensorVersion = ngsildInstance(SENSOR_VERSION, date, null, "Probe"+sensorAddress);
            ngsildPayload[0].sensorAdditionalInfo = ngsildInstance(SENSOR_ADDITIONAL_INFO, date, null, "Probe"+sensorAddress);
            break;
        case "51":
            epoch = encoded.slice(0, 8);
            epoch = new Date(parseInt(epoch, 16)*1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            sensorAddress = String.fromCharCode(parseInt(encoded.slice(8, 10), 16));
            const DATA_NUMBER = parseInt(encoded.slice(10, 12), 16);
            ngsildPayload[0].dataNumber = ngsildInstance(DATA_NUMBER, date, null, "Probe"+sensorAddress);
            decodeData(ngsildPayload, sensorAddress, encoded.slice(12, encoded.length), date);
            break;
        case "52":
            sensorAddress = String.fromCharCode(parseInt(encoded.slice(0, 2), 16));
            var commandType = decodeCommandType(parseInt(encoded.slice(2, 4), 16));
            var additionalCmdNumb = (parseInt(encoded.slice(4, 6), 16)&0xf0) >> 4;
            var sendCmdNumb = parseInt(encoded.slice(4, 6), 16)&0x0f;
            ngsildPayload[0].commandType = ngsildInstance(commandType, date, null, "Probe"+sensorAddress);
            ngsildPayload[0].additionalCommandNumber = ngsildInstance(additionalCmdNumb, date, null, "Probe"+sensorAddress);
            ngsildPayload[0].sendCommandNumber = ngsildInstance(sendCmdNumb, date, null, "Probe"+sensorAddress);
            var index = 1;
            for(let i=6; i<encoded.length; i+=6) {
                sensorAddress = String.fromCharCode(parseInt(encoded.slice(i, i+2), 16));
                commandType = decodeCommandType(parseInt(encoded.slice(i+2, i+4), 16));
                additionalCmdNumb = (parseInt(encoded.slice(i+4, i+6), 16)&0xf0) >> 4;
                sendCmdNumb = parseInt(encoded.slice(i+4, i+6), 16)&0x0f;
                ngsildPayload.push({ id: entityId, type: "Device" })
                ngsildPayload[index].commandType = ngsildInstance(commandType, date, null, "Probe"+sensorAddress);
                ngsildPayload[index].additionalCommandNumber = ngsildInstance(additionalCmdNumb, date, null, "Probe"+sensorAddress);
                ngsildPayload[index].sendCommandNumber = ngsildInstance(sendCmdNumb, date, null, "Probe"+sensorAddress);
                index++;
            }
            break;
        default:
            break;
    }
    return ngsildPayload;
}

function main() {
    const port = process.argv[2];
    const payload = process.argv[3];
    const time = process.argv[4];
    const entityId = `urn:ngsi-ld:Device:${process.argv[5]}`;
    const ngsildPayload = decode(port, payload, time, entityId);
    process.stdout.write(JSON.stringify(ngsildPayload, null, 4));
}

if (require.main === module) {
    main();
}

