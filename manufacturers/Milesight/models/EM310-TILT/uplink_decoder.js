const codec = require("./decode.js")
const ngsild = require("../ngsi-ld.js")

const parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    software_version: {label:"softwareVersion", unitCode: "", datasetId: null},
    battery: {label:"batteryLevel", unitCode: "P1", datasetId: 'Raw'},
    angle_x: {label:"angleX", unitCode: "DD", datasetId: 'Raw'},
    angle_y: {label:"angleY", unitCode: "DD", datasetId: 'Raw'},
    angle_z: {label:"angleZ", unitCode: "DD", datasetId: 'Raw'}
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