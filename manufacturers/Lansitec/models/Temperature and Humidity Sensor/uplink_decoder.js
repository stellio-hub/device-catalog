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

function decode(encoded, time, entityId) {
    const length = encoded.length;
    const ngsildPayload = [{ id: entityId, type: "Device" }];

    if (length === 20) {
        // Periodical Temp & Hum
        const TYPE = encoded.slice(0, 2);
        const VOL = encoded.slice(2, 4);
        const RSSI = encoded.slice(4, 6);
        const SNR = encoded.slice(6, 10);
        const TEMP_INT = encoded.slice(10, 12);
        const TEMP_FRA = encoded.slice(12, 14);
        const HUM = encoded.slice(14, 16);
        const CRC = encoded.slice(16, 20);

        const BATTERY = parseInt(VOL, 16);
        const TEMPERATURE = parseInt(TEMP_INT, 16) + (parseInt(TEMP_FRA, 16) / 100);
        const HUMIDITY = parseInt(HUM, 16);

        ngsildPayload[0].batteryLevel = ngsildInstance(BATTERY, time, "P1", "Raw");
        ngsildPayload[0].temperature = ngsildInstance(TEMPERATURE, time, "CEL", "Raw");
        ngsildPayload[0].humidity = ngsildInstance(HUMIDITY, time, "P1", "Raw");
    }

    
    else if (length === 16) {
        // Uplink Message
        const TYPE = encoded.slice(0, 2);
        const SMODE = encoded.slice(2, 4);
        const POWER = encoded.slice(4, 6);
        const CFG = encoded.slice(6, 8);
        const TH = encoded.slice(8, 12);
        const CRC = encoded.slice(12, 16);
    }

    return ngsildPayload;
}

function main() {
    const payload = process.argv[3];
    const time = process.argv[4];
    const entityId = `urn:ngsi-ld:Device:${process.argv[5]}`;
    const ngsildPayload = decode(payload, time, entityId);
    process.stdout.write(JSON.stringify(ngsildPayload, null, 4));
}

if (require.main === module) {
    main();
}
