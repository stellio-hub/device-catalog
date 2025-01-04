let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")

let batch_param = [4, [{taglbl: 0,resol: 1, sampletype: 10,lblname: "index_1", divide: 1, unit: ""},
    { taglbl: 1, resol: 1, sampletype: 10,lblname: "index_2", divide: 1, unit: ""},
    { taglbl: 2, resol: 1, sampletype: 10,lblname: "index_3", divide: 1, unit: ""},
    { taglbl: 3, resol: 1, sampletype: 1,lblname: "pin_state_1", divide: 1, unit: ""},
    { taglbl: 4, resol: 1, sampletype: 1,lblname: "pin_state_2", divide: 1, unit: ""},
    { taglbl: 5, resol: 1, sampletype: 1,lblname: "pin_state_3", divide: 1, unit: ""},
    { taglbl: 6, resol: 100, sampletype: 6,lblname: "battery_voltage", divide: 1000, unit: "VLT"},
    { taglbl: 7, resol: 1, sampletype: 6,lblname: "multi_state", divide: 100, unit: ""}]];

let endpointCorresponder={
    index:["index_1","index_2","index_3"],
    pin_state:["pin_state_1","pin_state_2","pin_state_3"],
    pin_state_4:["NA"],
    pin_state_5:["NA"],
    pin_state_6:["NA"],
    pin_state_7:["NA"],
    pin_state_8:["NA"],
    pin_state_9:["NA"],
    pin_state_10:["NA"],
}

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // ********* Test pattern (uncomment to test behaviour) ********************
        // Pattern uplink standard report containing state of pin 1 
        // payload = "110A000F00551001";
        // Pattern uplink standard report containing number of pulse detection on input 1 
        // payload = "110A000F04022300000000";       
        // Pattern uplink standard report containing firmware version
        // payload = "110100000002000D0305020015E2"
        // Pattern uplink uplink standard report  containing battery charge
        // payload = "110A00500006410503040E6804"
        // Pattern uplink batch report
        // payload = "3203032cd2dc00000000117b02000080903d005000401040801d11604704d8119024912492247b"
        // time=Date.now();
    // ********* End test pattern ***********************

    var decoded = watteco.Decode(payload,time,batch_param,endpointCorresponder);
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
       //  console.log(ngsild_payload);
    }
}

if (require.main === module) {
    main();
}
