let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")

let batch_param = [1, [{taglbl: 0,resol: 10, sampletype: 7,lblname: "temperature", divide: 100, unit: "CEL"},
    { taglbl: 1, resol: 100, sampletype: 6,lblname: "battery_voltage", divide: 1000, unit: "VLT"}]];
let endpointCorresponder={}

let attributeUnitDatasetMapping={
    temperature1:["CEL","temperature_1:raw"],
}

function main() {
    //var payload = process.argv[3];
    //var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // ********* Test pattern (uncomment to test behaviour) ********************
        // Pattern uplink standard report containing temperature value
        // payload = "110A04020000290B89";
        // Pattern uplink standard report containing firmware version
        // payload = "110100000002000D0305020015E2"
        // Pattern uplink standard report  containing battery charge
        // payload = "110A00500006410503040E6804"
        // Pattern uplink batch report
         payload = "1000a062bfecc11715b45b96dd2d8b76cb12bb65c5b35bd67705"
         time=Date.now();
    // ********* End test pattern ***********************

    var decoded = watteco.Decode(payload,time,batch_param,endpointCorresponder,attributeUnitDatasetMapping);
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
         console.log(ngsild_payload);
    }
}

if (require.main === module) {
    main();
}
