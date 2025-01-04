let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")

let batch_param = [3, [{taglbl: 0, resol: 1, sampletype: 4, lblname: "occupancy", divide: 1, unit: ""},
    {taglbl: 1, resol: 10, sampletype: 7, lblname: "temperature", divide: 100, unit: "CEL"},
    {taglbl: 2, resol: 100, sampletype: 6, lblname: "humidity", divide: 100, unit: "P1"},
    {taglbl: 3, resol: 10, sampletype: 6, lblname: "co2", divide: 1, unit: "52"},
    {taglbl: 4, resol: 10, sampletype: 6, lblname: "tvoc", divide: 1, unit: ""},
    {taglbl: 5, resol: 10, sampletype: 6, lblname: "illuminance", divide: 1, unit: "LUX"},
    {taglbl: 6, resol: 10, sampletype: 6, lblname: "pressure", divide: 10, unit: "A97"}]];
let endpointCorresponder={}

function main() {
    //var payload = process.argv[3];
    //var time = process.argv[4];
    //var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // ********* Test pattern (uncomment to test behaviour) ********************
        payload = "310a00520000410c000047ffffbe0063002fffd6" // uplink standard report containing simple metering         // payload = "110A005601004113240205144515040C0A09210001968200F17FC5" //
        // payload = "110a0056010041170410003445140a0313000283494e440000462c00233f4c" // 
        entity_id  ="EntityID"
        time=Date.now()
    // ********* End test pattern ***********************

    var decoded = watteco.Decode(payload,time,batch_param,endpointCorresponder);
    console.log(decoded)
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
    }
    console.log(ngsild_payload)
}

if (require.main === module) {
    main();
}
