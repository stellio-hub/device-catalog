const codec = require("./decode.js")
const ngsild = require("../../ngsi-ld.js")

const parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    software_version: {label:"softwareVersion", unitCode: "", datasetId: null},
    battery: {label:"batteryLevel", unitCode: "P1", datasetId: 'Raw'},
    freq_weight: {label:"frequencyWeight", unitCode: "", datasetId: 'Raw'},
    time_weight: {label:"timeWeight", unitCode: "", datasetId: 'Raw'},
    sound_level: {label:"soundLevel", unitCode: "2N", datasetId: 'Raw'}, // "2N" is the unit code for dB
    sound_level_eq: {label:"soundLevel", unitCode: "2N", datasetId: 'Eq:Raw'},
    sound_level_max: {label:"soundLevel", unitCode: "2N", datasetId: 'Max:Raw'}
}

function main() {
    const payload = process.argv[3];
    const time = process.argv[4];
    const entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    const decoded = codec.decode(Buffer.from(payload, 'hex'));
    const ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id, parametersMapping);
    process.stdout.write(JSON.stringify(ngsild_payload, null, 2));
}

if (require.main === module) {
    main();
}