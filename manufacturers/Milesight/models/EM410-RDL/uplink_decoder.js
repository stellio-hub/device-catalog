let codec = require("./decode.js")
let ngsild = require("../ngsi-ld.js")

let parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    reset_event: {label:"alarm", unitCode: "", datasetId: 'Reset:Raw'},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    firmware_version: {label:"firmwareVersion", unitCode: "", datasetId: null},
    battery: {label:"batteryLevel", unitCode: "P1", datasetId: 'Raw'},
    distance: {label:"distance", unitCode: "MMT", datasetId: 'Raw'},
    radar_signal_rssi: {label:"signalStrength", unitCode: "DBM", datasetId: 'Raw'},
    // "Normal" (horizontal offset angle < 20°) / "Tilt" (horizontal offset angle ≥ 20°)
    position: {label:"position", unitCode: "", datasetId: null}, 
    blind_alarm: {label:"alarm", unitCode: "", datasetId: 'Blind:Raw'},
    target_alarm: {label:"alarm", unitCode: "", datasetId: 'Target:Raw'},
    sensor_alarm: {label:"alarm", unitCode: "", datasetId: 'Sensor:Raw'},
    threshold_alarm: {label:"alarm", unitCode: "", datasetId: 'Threshold:Raw'},
    mutation_alarm: {label:"alarm", unitCode: "", datasetId: 'Mutation:Raw'},
    temperature: {label:"temperature", unitCode: "CEL", datasetId: 'Raw'},
    temperature_exception: {label:"alarm", unitCode: "", datasetId: 'Temperature:Raw'}
}

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // payload = "ff0bffff0101fffeffff166862e21141780013ff090100ff0a0101ff0f00ffff0100"; // Device information: report once whenever join the network
    // payload = "0175620482aa0c06c70303050000"; // Periodic uplink: report according to reporting interval
    // payload = "8482c827019482c827850c02"; // Threshold Alarm: report when distance reaches the threshold
    // payload = "b482ac0001"; //  Blind Zone alarm packet: report when the target value reaches the blind zone
    // payload = "20ceb443e166ac0cbe00000020"; //  Enquire historical data between 2024/9/7 15:28:22 to 2024-9-11 15:28:22
    var decoded = codec.decode(Buffer.from(payload, 'hex'));
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id, parametersMapping);
    process.stdout.write(JSON.stringify(ngsild_payload, null, 2));
}

if (require.main === module) {
    main();
}