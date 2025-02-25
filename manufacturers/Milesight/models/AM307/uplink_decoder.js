const codec = require("./decode.js")
const ngsild = require("../../ngsi-ld.js")

const parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    software_version: {label:"softwareVersion", unitCode: "", datasetId: null},
    temperature: {label:"temperature", unitCode: "CEL", datasetId: 'Raw'},
    humidity: {label:"humidity", unitCode: "P1", datasetId: 'Raw'},
    light_level: {label:"lightLevel", unitCode: "", datasetId: 'Raw'},
    // 0：0-5lux, 01：6-50lux, 2：51-100lux, 3：101-500lux, 4：501-2000lux, 5：>2000lux
    co2: {label:"co2", unitCode: "59", datasetId: 'Raw'}, // "59" is the unit code for ppm
    tvoc: {label:"tvoc", unitCode: "", datasetId: 'Raw'},
    pressure: {label:"pressure", unitCode: "P1", datasetId: 'Raw'},
    hcho: {label:"hcho", unitCode: "GP", datasetId: 'Raw'}, // "GP" is the unit code for mg/m3
    pm2_5: {label:"pm25", unitCode: "GQ", datasetId: 'Raw'}, // "GQ" is the unit code for μg/m3
    pm10: {label:"pm10", unitCode: "GQ", datasetId: 'Raw'},
    o3: {label:"o3", unitCode: "59", datasetId: 'Raw'}
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