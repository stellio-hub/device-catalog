let codec = require("./decode.js")
let ngsild = require("../ngsi-ld.js")

let parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    firmware_version: {label:"firmwareVersion", unitCode: "", datasetId: null},
    battery: {label:"batteryLevel", unitCode: "P1", datasetId: 'Raw'},
    distance: {label:"distance", unitCode: "MMT", datasetId: 'Raw'},
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