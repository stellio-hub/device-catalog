let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")

// See here for explanations on batch parameters: https://support.watteco.com/
// batch_param has been updated from Watteco driver so that: 
// lbnlname : used as NGSI-LD propertu name
// unit : used as NGSI-LD unitCode
// datasetId : used as NGSI-LD unitCode (optional. "Raw" by default)
let batch_param = [4, [{taglbl: 0,resol: 1, sampletype: 10,lblname: "pulses", divide: 1, unit: "", datasetId: "index1:Raw"},
    { taglbl: 1, resol: 1, sampletype: 10,lblname: "pulses", divide: 1, unit: "", datasetId: "index2:Raw"},
    { taglbl: 2, resol: 1, sampletype: 10,lblname: "pulses", divide: 1, unit: "", datasetId: "index3:Raw"},
    { taglbl: 3, resol: 1, sampletype: 1,lblname: "digitalInput", divide: 1, unit: "", datasetId: "In1:Raw"},
    { taglbl: 4, resol: 1, sampletype: 1,lblname: "digitalInput", divide: 1, unit: "", datasetId: "In2:Raw"},
    { taglbl: 5, resol: 1, sampletype: 1,lblname: "digitalInput", divide: 1, unit: "", datasetId: "In3:Raw"},
    { taglbl: 6, resol: 100, sampletype: 6,lblname: "batteryLevel", divide: 1000, unit: "VLT", datasetId: "BatteryVoltage:Raw"},
//    { taglbl: 7, resol: 1, sampletype: 6,lblname: "multi_state", divide: 100, unit: "", datasetId: "Raw"} // No infomration about multi_state in Pulsenso configuration
]];

// Identical Physical quantities are grouped under the same property name (e.g. "temperature") and differentiated at datasetId level (2nd parts of the row. e.g. "Temperature1:Raw","Temperature2:Raw")
// Similar approach is done to group alarms under the same property
// Each item of endpointCorresponder should be a multiple of 3
// First third lists the NGSLI-LD property names
// Second third lists their corresponding NGSI-LD datasetId
// Third third lists their corresponding NGSI-LD unitCodes
// An empty datasetID will create a non temporal attribute 
let endpointCorresponder={
    disposable_battery_voltage: ["batteryLevel", "Disposable_battery_voltage:Raw","VLT"],
    index:["pulses","pulses","pulses","index1:Raw","index2:Raw","index3:Raw","","",""],
    pin_state:["digitalInput","digitalInput","digitalInput","In1:Raw","In2:Raw","In3:Raw","","",""],
    pin_state_4:["Ignore"],
    pin_state_5:["Ignore"],
    pin_state_6:["Ignore"],
    pin_state_7:["Ignore"],
    pin_state_8:["Ignore"],
    pin_state_9:["Ignore"],
    pin_state_10:["Ignore"],
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
        // console.log(ngsild_payload);
    }
}

if (require.main === module) {
    main();
}
