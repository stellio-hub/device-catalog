let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")

// See here for explanations on batch parameters: https://support.watteco.com/
// batch_param has been updated from Watteco driver so that: 
// lbnlname : used as NGSI-LD propertu name
// unit : used as NGSI-LD unitCode
// datasetId : used as NGSI-LD unitCode (optional. "Raw" by default)
let batch_param = [3, [{taglbl: 0,resol: 10, sampletype: 7,lblname: "temperature", divide: 100, unit: "CEL", datasetId: "Temperature1:Raw"},
    { taglbl: 1, resol: 10, sampletype: 7,lblname: "temperature", divide: 100, unit: "CEL", datasetId: "Temperature2:Raw"},
    { taglbl: 5, resol: 100, sampletype: 6, lblname: "batteryLevel", divide: 1000, unit: "VLT", datasetId: "BatteryVoltage:Raw"}]];

// Identical Physical quantities are grouped under the same property name (e.g. "temperature") and differentiated at datasetId level (2nd parts of the row. e.g. "Temperature1:Raw","Temperature2:Raw")
// Similar approach is done to group alarms under the same property
// Each item of endpointCorresponder should be a multiple of 3
// First third lists the NGSLI-LD property names
// Second third lists their corresponding NGSI-LD datasetId
// Third third lists their corresponding NGSI-LD unitCodes
// An empty datasetID will create a non temporal attribute 
let endpointCorresponder={
    disposable_battery_voltage: ["batteryLevel", "Disposable_battery_voltage:Raw","VLT"],
    temperature:["temperature","temperature","Temperature1:Raw","Temperature2:Raw","CEL","CEL"],
}

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // ********* Test pattern (uncomment to test behaviour) ********************
        // Pattern uplink standard report containing temperature value
        // payload = "110A04020000290B89";
        // payload = "110a04020000290064"
        // Pattern uplink standard report containing firmware version
        // payload = "110100000002000D0305020015E2"
        // Pattern uplink standard report  containing battery charge
        // payload = "110A00500006410503040E6804"
        // Pattern uplink batch report
        // payload = "26020000803606A2FC11E4F7"
        // payload = "22050010355c04b3c89e800e0c20005901c80a405600b2029085244992ea743800"
        // time=Date.now();
    // ********* End test pattern ***********************

    var decoded = watteco.Decode(payload,time,batch_param,endpointCorresponder);
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
        // console.log(ngsild_payload)
    }
}

if (require.main === module) {
    main();
}
