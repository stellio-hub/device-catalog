const ngsild = require("./ngsi-ld.js")

function decode(bytes) {
    var params = {};
    // Time sync request
    if(0x01 === bytes[0]) {
        params.payload_type = "time";
        params.sync_id = (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4];
    }
    // Handle measurement packets
    else if(0x0e === bytes[0])
    {
        params.payload_type = "measurement"
        const year_1 = 2000 + (bytes[4] >> 1);
        const month_1 = ((bytes[4] & 0x01) << 3) | (bytes[3] >> 5);
        const day_1 = bytes[3] & 0x1f;
        const hours_1 = bytes[2] >> 3;
        const minutes_1 = ((bytes[2] & 0x7) << 3) | (bytes[1] >> 5);
        const seconds_1 = bytes[1] & 0x1f;
        params.timestamp_1 = new Date(Date.UTC(year_1, month_1 - 1, day_1, hours_1, minutes_1, seconds_1));
        params.temperature_1 = (bytes[6]<<24>>16 | bytes[5]) / 100;
        params.humidity_1 = bytes[7] / 2;   // RH is doubled
        params.pressure_1 = (bytes[10] << 16) | (bytes[9] << 8) | bytes[8];  // In Pascals
        params.illumination_1 = (bytes[12] << 8) | bytes[11];   // lux
        params.voc_1 = (bytes[14] << 8) | bytes[13];   // voc
        params.co2_1 = (bytes[16] << 8) | bytes[15];   // co2
        const year_2 = 2000 + (bytes[20] >> 1);
        const month_2 = ((bytes[20] & 0x01) << 3) | (bytes[19] >> 5);
        const day_2 = bytes[19] & 0x1f;
        const hours_2 = bytes[18] >> 3;
        const minutes_2 = ((bytes[18] & 0x7) << 3) | (bytes[17] >> 5);
        const seconds_2 = bytes[17] & 0x1f;
        params.timestamp_2 = new Date(Date.UTC(year_2, month_2 - 1, day_2, hours_2, minutes_2, seconds_2)); // JS months are 0-indexed
        params.temperature_2 = (bytes[22]<<24>>16 | bytes[21]) / 100;
        params.humidity_2 = bytes[23] / 2;   // RH is doubled
        params.pressure_2 = (bytes[26] << 16) | (bytes[25] << 8) | bytes[24];  // In Pascals
        params.illumination_2 = (bytes[12] << 8) | bytes[11];   // lux
        params.voc_2 = (bytes[30] << 8) | bytes[29];   // voc
        params.co2_2 = (bytes[32] << 8) | bytes[31];   // co2
        if(bytes[33]) {
            params.battery_percentage = bytes[33];
        }
    }
    return params
}

const parametersMapping1 =  {
    temperature_1: {label:"temperature", unitCode: "CEL", datasetId: 'Raw'},
    humidity_1: {label:"humidity", unitCode: "P1", datasetId: 'Raw'},
    pressure_1: {label:"pressure", unitCode: "PAL", datasetId: 'Raw'},
    illumination_1: {label:"illumination", unitCode: "LUX", datasetId: 'Raw'},
    co2_1: {label:"co2", unitCode: "59", datasetId: 'Raw'}, // "59" is the unit code for ppm
    voc_1: {label:"voc", unitCode: "61", datasetId: 'Raw'}, // "61" is the unit code for ppb
}
const parametersMapping2 =  {
    temperature_2: {label:"temperature", unitCode: "CEL", datasetId: 'Raw'},
    humidity_2: {label:"humidity", unitCode: "P1", datasetId: 'Raw'},
    pressure_2: {label:"pressure", unitCode: "PAL", datasetId: 'Raw'},
    illumination_2: {label:"illumination", unitCode: "LUX", datasetId: 'Raw'},
    co2_2: {label:"co2", unitCode: "59", datasetId: 'Raw'},
    voc_2: {label:"voc", unitCode: "61", datasetId: 'Raw'},
    battery_percentage: {label:"batteryLevel", unitCode: "P1", datasetId: 'Raw'}
}

function main() {
    const payload = process.argv[3];
    const time = process.argv[4];
    const entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    const decoded = decode(Buffer.from(payload, 'hex'));
    const ngsild_payload_1 = ngsild.ngsildWrapper(decoded, decoded.timestamp_1, entity_id, parametersMapping1);
    const ngsild_payload_2 = ngsild.ngsildWrapper(decoded, decoded.timestamp_2, entity_id, parametersMapping2);
    const ngsild_payload = [...ngsild_payload_1, ...ngsild_payload_2];
    process.stdout.write(JSON.stringify(ngsild_payload, null, 2));
}

if (require.main === module) {
    main();
}