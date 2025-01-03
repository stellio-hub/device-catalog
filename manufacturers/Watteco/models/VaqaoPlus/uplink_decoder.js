let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")

let batch_param = [3, [{taglbl: 0, resol: 1, sampletype: 4, lblname: "occupancy", divide: 1, unit: ""},
    {taglbl: 1, resol: 10, sampletype: 7, lblname: "temperature", divide: 100, unit: "CEL"},
    {taglbl: 2, resol: 100, sampletype: 6, lblname: "humidity", divide: 100, unit: "P1"},
    {taglbl: 3, resol: 10, sampletype: 6, lblname: "co2", divide: 1, unit: "52"},
    {taglbl: 4, resol: 10, sampletype: 6, lblname: "tvoc", divide: 1, unit: ""},
    {taglbl: 5, resol: 10, sampletype: 6, lblname: "illuminance", divide: 1, unit: "LUX"},
    {taglbl: 6, resol: 10, sampletype: 6, lblname: "pressure", divide: 10, unit: "A97"}]];

// Merged temperature_1 and temperature_2 under the same temperature property as it seems to only be a variation  of accuracy depending on the temperature range 
let endpointCorresponder = {
    concentration: ["tvoc", "co2"],
    temperature: ["temperature","temperature"],
    humidity: ["humidity","humidity"],
    pin_state:["violation_detection"]
}

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // ********* Test pattern (uncomment to test behaviour) ********************
        // Pattern batch
        // payload = "7013007455ba047bd96e3d0294a8ff044960278300c137008f746765000a6272136a4940bb6d6904ed96a576128bbb65c16e59a480764d9800c080762f54010ce002";
        // Pattern non batch
        // payload = "110a040600001801"// uplink standard report containing occupancy value 
        // payload = "110A04020000290B89" // uplink standard report containing temperature value
        // payload = "110A04050000210E89" // uplink standard report containing humidity value 
        // payload = "110A800C0000210019" // uplink standard report containing TVOC value
        // payload = "110A000F00551001" // uplink standard report containing state of the case
        // payload = "110100000002000D0305020015E2" //uplink standard report containing firmware version 
        // payload = "110A00500006410503040E6804" //uplink standard report  containing battery charge
        // time=Date.now();
        // entity_id="entityID"
    // ********* End test pattern ***********************

    var decoded = watteco.Decode(payload,time,batch_param,endpointCorresponder);
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
    }
   // console.log(ngsild_payload)
}

if (require.main === module) {
    main();
}
