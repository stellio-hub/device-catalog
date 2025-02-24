let codec = require("./decode.js")
let ngsild = require("../ngsi-ld.js")

let parametersMapping =  {
    sn: {label:"serialNumber", unitCode: "", datasetId: null},
    hardware_version: {label:"hardwareVersion", unitCode: "", datasetId: null},
    software_version: {label:"softwareVersion", unitCode: "", datasetId: null},
    people_count_all: {label:"totalPeopleCount", unitCode: "", datasetId: 'Raw'},
    region_count: {label:"totalRegionCount", unitCode: "", datasetId: 'Raw'},
    // 1 = region occupied, 0  = region vacant
    region_1: {label:"regionOccupancy", unitCode: "", datasetId: 'Region1:Raw'},
    region_2: {label:"regionOccupancy", unitCode: "", datasetId: 'Region2:Raw'},
    region_3: {label:"regionOccupancy", unitCode: "", datasetId: 'Region3:Raw'},
    region_4: {label:"regionOccupancy", unitCode: "", datasetId: 'Region4:Raw'},
    region_5: {label:"regionOccupancy", unitCode: "", datasetId: 'Region5:Raw'},
    region_6: {label:"regionOccupancy", unitCode: "", datasetId: 'Region6:Raw'},
    region_7: {label:"regionOccupancy", unitCode: "", datasetId: 'Region7:Raw'},
    region_8: {label:"regionOccupancy", unitCode: "", datasetId: 'Region8:Raw'},
    region_9: {label:"regionOccupancy", unitCode: "", datasetId: 'Region9:Raw'},
    region_10: {label:"regionOccupancy", unitCode: "", datasetId: 'Region10:Raw'},
    region_11: {label:"regionOccupancy", unitCode: "", datasetId: 'Region11:Raw'},
    region_12: {label:"regionOccupancy", unitCode: "", datasetId: 'Region12:Raw'},
    region_13: {label:"regionOccupancy", unitCode: "", datasetId: 'Region13:Raw'},
    region_14: {label:"regionOccupancy", unitCode: "", datasetId: 'Region14:Raw'},
    region_15: {label:"regionOccupancy", unitCode: "", datasetId: 'Region15:Raw'},
    region_16: {label:"regionOccupancy", unitCode: "", datasetId: 'Region16:Raw'},
    people_count_max: {label:"maxPeopleCount", unitCode: "", datasetId: 'Raw'},
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
    people_in: {label:"peopleIn", unitCode: "", datasetId: 'Raw'},
    people_out: {label:"peopleOut", unitCode: "", datasetId: 'Raw'},
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