let codec = require("./decode.js")
let ngsild = require("../ngsi-ld.js")

let parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    reset_event: {label:"alarm", unitCode: "", datasetId: 'Reset:Raw'},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    firmware_version: {label:"firmwareVersion", unitCode: "", datasetId: null},
    battery: {label:"batteryLevel", unitCode: "P1", datasetId: 'Raw'},
    distance: {label:"distance", unitCode: "MM", datasetId: 'Raw'},
    radar_signal_strength: {label:"signalStrength", unitCode: "DBM", datasetId: 'Raw'},
    position: {label:"position", unitCode: "", datasetId: null},
    distance_blind: {label:"alarm", unitCode: "", datasetId: 'Blind:Raw'},
    distance_threshold: {label:"alarm", unitCode: "", datasetId: 'Threshold:Raw'},
    temperature: {label:"temperature", unitCode: "CEL", datasetId: 'Raw'},
    temperature_abnormal: {label:"alarm", unitCode: "", datasetId: 'Temperature:Raw'}
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