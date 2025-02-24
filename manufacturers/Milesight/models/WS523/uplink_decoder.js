let codec = require("./decode.js")
let ngsild = require("../ngsi-ld.js")

let parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    software_version: {label:"softwareVersion", unitCode: "", datasetId: null},
    alarm: {label:"alarmStatus", unitCode: "", datasetId: null},
    alarm_threshold: {label:"alarmThreshold", unitCode: "AMP", datasetId: 'Raw'},
    overcurrent_protection: {label:"overcurrentProtection", unitCode: "AMP", datasetId: 'Raw'},
    current_threshold: {label:"overcurrentThreshold", unitCode: "AMP", datasetId: 'Raw'},
    state: {label:"socketStatus", unitCode: "", datasetId: null},
    factor: {label:"powerFactor", unitCode: "P1", datasetId: 'Raw'},
    current: {label:"current", unitCode: "4K", datasetId: 'Raw'}, // "4K" is the unit code for mA
    voltage: {label:"voltage", unitCode: "VLT", datasetId: 'Raw'},
    power_sum: {label:"powerConsumption", unitCode: "WHR", datasetId: 'Raw'},
    power: {label:"activePower", unitCode: "WTT", datasetId: 'Raw'}
}

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    var decoded = codec.decode(Buffer.from(payload, 'hex'));
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id, parametersMapping);
    process.stdout.write(JSON.stringify(ngsild_payload, null, 2));
}

if (require.main === module) {
    main();
}