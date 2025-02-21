let codec = require("./decode.js")
let ngsild = require("../ngsi-ld.js")

let parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    software_version: {label:"softwareVersion", unitCode: "", datasetId: null},
    battery: {label:"batteryLevel", unitCode: "P1", datasetId: null},
    freq_weight: {label:"freqWeight", unitCode: "", datasetId: null},
    time_weight: {label:"timeWeight", unitCode: "", datasetId: null},
    sound_level: {label:"soundLevel", unitCode: "2N", datasetId: null},
    sound_level_eq: {label:"soundLevelEq", unitCode: "2N", datasetId: null},
    sound_level_max: {label:"soundLevelMax", unitCode: "2N", datasetId: null}
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