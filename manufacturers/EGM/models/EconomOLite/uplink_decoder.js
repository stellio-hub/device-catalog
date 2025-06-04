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
    const VALVES_NUMBER = 6;

    switch (port) {
        case "2":
            epoch = encoded.slice(0, 8);
            epoch = new Date(parseInt(epoch, 16) * 1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            const SOFT_VERSION = 'V' + encoded[8] + '.' + encoded[9];
            const APP_ID = parseInt(encoded.slice(10, 12), 16);
            const BOARD_ID = parseInt(encoded.slice(12, 16), 16);
            const BATTERY = Number(encoded.slice(16, 20), 16) / 1000;

            ngsildPayload[0].softwareVersion = ngsildInstance(SOFT_VERSION, date, null, null);
            ngsildPayload[0].applicationId = ngsildInstance(APP_ID, date, null, null);
            ngsildPayload[0].boardId = ngsildInstance(BOARD_ID, date, null, null);
            ngsildPayload[0].batteryVoltage = ngsildInstance(BATTERY, date, "VLT", "Raw");
            break;
        case "90":
            const PULSE_COUNTER_ID = parseInt(encoded.slice(0, 2), 16);
            const REDUNDANCY = parseInt(encoded.slice(2, 4), 16);
            const MEASURE_DURATION = parseInt(encoded.slice(4, 6), 16);
            epoch = encoded.slice(6, 14);
            epoch = new Date(parseInt(epoch, 16) * 1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            var pulse = parseInt(encoded.slice(14, 17), 16);

            ngsildPayload[0].redundancy = ngsildInstance(REDUNDANCY, date, null, "PulseCounter" + PULSE_COUNTER_ID + ":Raw");
            ngsildPayload[0].measureDuration = ngsildInstance(MEASURE_DURATION, date, "MIN", "PulseCounter" + PULSE_COUNTER_ID + ":Raw");
            ngsildPayload[0].pulse = ngsildInstance(pulse, date, null, "PulseCounter" + PULSE_COUNTER_ID + ":Raw");

            const PULSE_NUMBER = ((encoded.length - 14) / 3);
            for (let i = 1; i < PULSE_NUMBER; i++) {
                ngsildPayload.push({ id: entityId, type: "Device" })
                date = new Date(epoch.getTime() + PULSE_COUNTER_ID*60000*i);
                date = date.toISOString().split('.')[0] + 'Z';
                pulse = parseInt(encoded.slice(14 + (i*3), 17 + (i*3)), 16);
                ngsildPayload[i].pulse = ngsildInstance(pulse, date, null, "PulseCounter" + PULSE_COUNTER_ID + ":Raw");
                
            }
            break;
        case "80":
            epoch = encoded.slice(0, 8);
            epoch = new Date(parseInt(epoch, 16) * 1000);
            date = epoch.toISOString().split('.')[0] + 'Z';
            const HEARTBEAT_FREQ = parseInt(encoded.slice(8, 10), 16);
            const VALVES_PROGRAMMED = parseInt(encoded.slice(10, 12), 16);
            const WATERING_SCHEDULE = parseInt(encoded.slice(12, 16), 16);
            const CMD_NUMBER = parseInt(encoded.slice(16, 18), 16);
            const BATTERY_VOLTAGE = Number(encoded.slice(18, 22), 16) / 1000;

            ngsildPayload[0].heartbeatFrequency = ngsildInstance(HEARTBEAT_FREQ, date, "HUR", "Raw");
            const valves = [];
            for(let i = 1; i <= VALVES_NUMBER; i++) {
                valves.push(ngsildInstance((VALVES_PROGRAMMED >> (i-1))&0x01, date, null, "Valve" + i + ":Raw"));
            }
            ngsildPayload[0].valvesProgrammed = valves;
            const days = [];	
            days.push(ngsildInstance(WATERING_SCHEDULE&0x01, date, null, "Monday1:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 1)&0x01, date, null, "Tuesday1:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 2)&0x01, date, null, "Wednesday1:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 3)&0x01, date, null, "Thursday1:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 4)&0x01, date, null, "Friday1:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 5)&0x01, date, null, "Saturday1:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 6)&0x01, date, null, "Sunday1:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 7)&0x01, date, null, "Monday2:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 8)&0x01, date, null, "Tuesday2:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 9)&0x01, date, null, "Wednesday2:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 10)&0x01, date, null, "Thursday2:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 11)&0x01, date, null, "Friday2:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 12)&0x01, date, null, "Saturday2:Raw"));
            days.push(ngsildInstance((WATERING_SCHEDULE >> 13)&0x01, date, null, "Sunday2:Raw"));
            ngsildPayload[0].wateringDays = days;
            ngsildPayload[0].commandNumber = ngsildInstance(CMD_NUMBER, date, null, null);
            ngsildPayload[0].batteryVoltage = ngsildInstance(BATTERY_VOLTAGE, date, "VLT", "Raw");
            break;
        case "88":
            const temporaryProgram = [];
            for(let i = 0; i < VALVES_NUMBER; i++) {
                const temporary_time = encoded.slice(i*2, 2+i*2);
                temporaryProgram.push(ngsildInstance(parseInt(temporary_time, 16), date, "MIN", "Valve" + (i+1) + ":TemporaryProgram:Raw"));
            }
            ngsildPayload[0].temporaryProgram = temporaryProgram;
            break;
        case "84":
            const limitation = [];
            for(let i = 0; i < VALVES_NUMBER; i++) {
                const limitation_time = encoded.slice(i*2, 2+i*2);
                limitation.push(ngsildInstance(parseInt(limitation_time, 16), date, "MIN", "Valve" + (i+1) + ":Limitation:Raw"));
            }
            ngsildPayload[0].limitation = limitation;
            break;
        case "78":
            const NEW_HEARTBEAT_FREQ = parseInt(encoded.slice(0, 2), 16);
            ngsildPayload[0].heartbeatFrequency = ngsildInstance(NEW_HEARTBEAT_FREQ, date, "HUR", "Raw");
            break;
        case "4":
            const REJOIN_DATE = parseInt(encoded.slice(0, 8), 16);
            ngsildPayload[0].rejoinDate = ngsildInstance(REJOIN_DATE, date, "SEC", "Raw");
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