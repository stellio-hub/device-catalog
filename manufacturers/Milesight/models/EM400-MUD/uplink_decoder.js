const codec = require("../decode.js")
const ngsild = require("../ngsi-ld.js")

const parametersMapping =  {
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