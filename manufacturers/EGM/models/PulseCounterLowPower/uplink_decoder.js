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
    let redundancy = 0, pulse_counter_id = 0, battery = 0;

    switch (port) {
        case "2":
            epoch = encoded.slice(0, 8);
            epoch = new Date(parseInt(epoch, 16) * 1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            const SOFT_VERSION = 'V' + encoded[8] + '.' + encoded[9];
            const APP_ID = parseInt(encoded.slice(10, 12), 16);
            const BOARD_ID = parseInt(encoded.slice(12, 16), 16);
            battery = Number(encoded.slice(16, 20), 16) / 10;

            ngsildPayload[0].softwareVersion = ngsildInstance(SOFT_VERSION, date, null, null);
            ngsildPayload[0].applicationId = ngsildInstance(APP_ID, date, null, null);
            ngsildPayload[0].boardId = ngsildInstance(BOARD_ID, date, null, null);
            ngsildPayload[0].batteryVoltage = ngsildInstance(battery, date, "VLT", "Raw");
            break;
        case "5":
            const REJOIN_DATE = parseInt(encoded.slice(0, 8), 16);
            ngsildPayload[0].rejoinDate = ngsildInstance(REJOIN_DATE, date, "SEC", "Raw");
            break;
        case "90":
            redundancy = parseInt(encoded.slice(0, 2), 16);
            const MEASURE_DURATION = parseInt(encoded.slice(2, 4), 16);
            pulse_counter_id = parseInt(encoded.slice(4, 6), 16);
            epoch = encoded.slice(6, 14);
            epoch = new Date(parseInt(epoch, 16) * 1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            var pulse = parseInt(encoded.slice(14, 17), 16);

            ngsildPayload[0].redundancy = ngsildInstance(redundancy, date, null, "PulseCounter" + pulse_counter_id + ":Raw");
            ngsildPayload[0].measureDuration = ngsildInstance(MEASURE_DURATION, date, "MIN", "PulseCounter" + pulse_counter_id + ":Raw");
            ngsildPayload[0].pulses = ngsildInstance(pulse, date, null, "PulseCounter" + pulse_counter_id + ":Raw");

            const PULSE_NUMBER = ((encoded.length - 14) / 3);
            for (let i = 1; i < PULSE_NUMBER; i++) {
                ngsildPayload.push({ id: entityId, type: "Device" })
                date = new Date(epoch.getTime() + pulse_counter_id*60000*i);
                date = date.toISOString().split('.')[0] + 'Z';
                pulse = parseInt(encoded.slice(14 + (i*3), 17 + (i*3)), 16);
                ngsildPayload[i].pulses = ngsildInstance(pulse, date, null, "PulseCounter" + pulse_counter_id + ":Raw");
                
            }
            break;
        case "91":
            pulse_counter_id = parseInt(encoded.slice(0, 2), 16);
            redundancy = parseInt(encoded.slice(2, 4), 16);
            epoch = encoded.slice(4, 12);
            epoch = new Date(parseInt(epoch, 16) * 1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            const INDEX = parseInt(encoded.slice(12, 28), 16);
            battery = Number(encoded.slice(28, 32), 16) / 10;

            ngsildPayload[0].redundancy = ngsildInstance(redundancy, date, null, "PulseCounter" + pulse_counter_id + ":Raw");
            ngsildPayload[0].index = ngsildInstance(INDEX, date, null, "PulseCounter" + pulse_counter_id + ":Raw");
            ngsildPayload[0].batteryVoltage = ngsildInstance(battery, date, "VLT", "Raw");
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