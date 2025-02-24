const codec = require("./decode.js")
const ngsild = require("../ngsi-ld.js")

const parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    software_version: {label:"softwareVersion", unitCode: "", datasetId: null},
    people_count_all: {label:"peopleCount", unitCode: "", datasetId: 'All:Raw'},
    region_count: {label:"numberOfRegion", unitCode: "", datasetId: null},
    // 1 = region occupied, 0  = region vacant
    region_1: {label:"occupancy", unitCode: "", datasetId: 'Region1:Raw'},
    region_2: {label:"occupancy", unitCode: "", datasetId: 'Region2:Raw'},
    region_3: {label:"occupancy", unitCode: "", datasetId: 'Region3:Raw'},
    region_4: {label:"occupancy", unitCode: "", datasetId: 'Region4:Raw'},
    region_5: {label:"occupancy", unitCode: "", datasetId: 'Region5:Raw'},
    region_6: {label:"occupancy", unitCode: "", datasetId: 'Region6:Raw'},
    region_7: {label:"occupancy", unitCode: "", datasetId: 'Region7:Raw'},
    region_8: {label:"occupancy", unitCode: "", datasetId: 'Region8:Raw'},
    region_9: {label:"occupancy", unitCode: "", datasetId: 'Region9:Raw'},
    region_10: {label:"occupancy", unitCode: "", datasetId: 'Region10:Raw'},
    region_11: {label:"occupancy", unitCode: "", datasetId: 'Region11:Raw'},
    region_12: {label:"occupancy", unitCode: "", datasetId: 'Region12:Raw'},
    region_13: {label:"occupancy", unitCode: "", datasetId: 'Region13:Raw'},
    region_14: {label:"occupancy", unitCode: "", datasetId: 'Region14:Raw'},
    region_15: {label:"occupancy", unitCode: "", datasetId: 'Region15:Raw'},
    region_16: {label:"occupancy", unitCode: "", datasetId: 'Region16:Raw'},
    people_count_max: {label:"peopleCount", unitCode: "", datasetId: 'Max:Raw'},
    region_1_count: {label:"peopleCount", unitCode: "", datasetId: 'Region1:Raw'},
    region_2_count: {label:"peopleCount", unitCode: "", datasetId: 'Region2:Raw'},
    region_3_count: {label:"peopleCount", unitCode: "", datasetId: 'Region3:Raw'},
    region_4_count: {label:"peopleCount", unitCode: "", datasetId: 'Region4:Raw'},
    region_5_count: {label:"peopleCount", unitCode: "", datasetId: 'Region5:Raw'},
    region_6_count: {label:"peopleCount", unitCode: "", datasetId: 'Region6:Raw'},
    region_7_count: {label:"peopleCount", unitCode: "", datasetId: 'Region7:Raw'},
    region_8_count: {label:"peopleCount", unitCode: "", datasetId: 'Region8:Raw'},
    region_9_count: {label:"peopleCount", unitCode: "", datasetId: 'Region9:Raw'},
    region_10_count: {label:"peopleCount", unitCode: "", datasetId: 'Region10:Raw'},
    region_11_count: {label:"peopleCount", unitCode: "", datasetId: 'Region11:Raw'},
    region_12_count: {label:"peopleCount", unitCode: "", datasetId: 'Region12:Raw'},
    region_13_count: {label:"peopleCount", unitCode: "", datasetId: 'Region13:Raw'},
    region_14_count: {label:"peopleCount", unitCode: "", datasetId: 'Region14:Raw'},
    region_15_count: {label:"peopleCount", unitCode: "", datasetId: 'Region15:Raw'},
    region_16_count: {label:"peopleCount", unitCode: "", datasetId: 'Region16:Raw'},
    people_in: {label:"peopleCount", unitCode: "", datasetId: 'In:Raw'},
    people_out: {label:"peopleCount", unitCode: "", datasetId: 'Out:Raw'},
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