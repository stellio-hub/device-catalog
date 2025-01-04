let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")


let batch_param = [3, [{taglbl: 0,resol: 10, sampletype: 7,lblname: "temperature_1", divide: 100, unit: "CEL"},
    { taglbl: 1, resol: 10, sampletype: 7,lblname: "temperature_2", divide: 100, unit: "CEL"},
    { taglbl: 5, resol: 100, sampletype: 6, lblname: "battery_voltage", divide: 1000, unit: "VLT"}]];

let endpointCorresponder={
    temperature:["temperature_1","temperature_2"],
}

let attributeUnitDatasetMapping={
    temperature1:["CEL","temperature_1:raw"],
}

function main() {
    // var payload = process.argv[3];
    // var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // ********* Test pattern (uncomment to test behaviour) ********************
        // Pattern uplink standard report containing temperature value
         payload = "110A04020000290B89";
        // Pattern uplink standard report containing firmware version
        // payload = "110100000002000D0305020015E2"
        // Pattern uplink standard report  containing battery charge
        // payload = "110A00500006410503040E6804"
        // Pattern uplink batch report
        // payload = "26020000803606A2FC11E4F7"
        time=Date.now();
    // ********* End test pattern ***********************

    var decoded = watteco.Decode(payload,time,batch_param,endpointCorresponder,attributeUnitDatasetMapping);
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
        console.log(ngsild_payload)
    }
}

if (require.main === module) {
    main();
}
