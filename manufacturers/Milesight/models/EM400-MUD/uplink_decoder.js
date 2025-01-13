let codec = require("../decode.js")
let ngsild = require("../ngsi-ld.js")

let parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    firmware_version: {label:"firmwareVersion", unitCode: "", datasetId: null},
    battery: {label:"batteryLevel", unitCode: "P1", datasetId: 'Raw'},
    distance: {label:"distance", unitCode: "MMT", datasetId: 'Raw'},
    radar_signal_strength: {label:"signalStrength", unitCode: "DBM", datasetId: 'Raw'},
    // "Normal" (horizontal offset angle < 20°) / "Tilt" (horizontal offset angle ≥ 20°)
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
    // payload = "ff0bffff0101fffeffff166862e21141780013ff090100ff0a0101ff0f00ffff0100" // Device information: report once whenever join the network
    // payload = "0175640367f80004820101050000";  // Periodic uplink: report according to reporting interval
    // payload = "84823307018367220101" // Distance Threshold: report when distance reaches the threshold or returns back to normal value
                                        // + Temperature Threshold: report when the abrupt change of temperature is greater than 5°C
    var decoded = codec.decode(Buffer.from(payload, 'hex'));
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id, parametersMapping);
    process.stdout.write(JSON.stringify(ngsild_payload, null, 2));
}

if (require.main === module) {
    main();
}