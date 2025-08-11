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

function decode(port, encoded, time, entityId) {
    const ngsildPayload = [{ id: entityId, type: "Device" }];
    var date = time;
    var epoch = 0;
    let batteryVoltage = 0.0;

    switch (port) {
        case "2":
            epoch = encoded.slice(0, 8);
            epoch = new Date(parseInt(epoch, 16) * 1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            const SOFT_VERSION = 'V' + encoded[8] + '.' + encoded[9];
            const APP_ID = parseInt(encoded.slice(10, 12), 16);
            const BOARD_ID = parseInt(encoded.slice(12, 16), 16);
            const MEASUREMENT_FREQUENCY = parseInt(encoded.slice(16, 20), 16);
            batteryVoltage = Number(encoded.slice(20, 24), 16) / 1000;

            ngsildPayload[0].softwareVersion = ngsildInstance(SOFT_VERSION, null, null, null);
            ngsildPayload[0].applicationId = ngsildInstance(APP_ID, null, null, null);
            ngsildPayload[0].boardId = ngsildInstance(BOARD_ID, null, null, null);
            ngsildPayload[0].batteryVoltage = ngsildInstance(batteryVoltage, date, "VLT", "Raw");
            break;
        case "5":
            const REJOIN_DATE = parseInt(encoded.slice(0, 8), 16);
            ngsildPayload[0].rejoinDate = ngsildInstance(REJOIN_DATE, date, "SEC", "Raw");
            break;
        case "8":
            const NEW_MEASUREMENT_FREQ = parseInt(encoded.slice(0, 4), 16);
            ngsildPayload[0].measurementFrequency = ngsildInstance(NEW_MEASUREMENT_FREQ, date, "MIN", "Raw");
            break;
        case "51":
            epoch = encoded.slice(0, 8);
            epoch = new Date(parseInt(epoch, 16) * 1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            const REDUNDANCY = parseInt(encoded.slice(8, 10), 16);
            let SOIL_TEMPERATURE = parseInt(encoded.slice(10, 14), 16);
            if (SOIL_TEMPERATURE & 0x8000) {
                SOIL_TEMPERATURE = SOIL_TEMPERATURE - 0x10000;
            }
            SOIL_TEMPERATURE = SOIL_TEMPERATURE / 100;
            const VOLUMETRIC_MOISTURE = parseInt(encoded.slice(14, 18), 16) / 100;
            batteryVoltage = Number(encoded.slice(18, 22), 16) / 1000;

            ngsildPayload[0].redundancy = ngsildInstance(REDUNDANCY, date, null, null);
            ngsildPayload[0].soilTemperature = ngsildInstance(SOIL_TEMPERATURE, date, "CEL", "Raw");
            ngsildPayload[0].volumetricMoisture = ngsildInstance(VOLUMETRIC_MOISTURE, date, "P1", "Raw");
            ngsildPayload[0].batteryVoltage = ngsildInstance(batteryVoltage, date, "VLT", "Raw");
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