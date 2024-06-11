let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")

let batch_param = [3, [{taglbl: 0,resol: 1, sampletype: 4,lblname: "occupancy", divide: 1, unit: ""},
    { taglbl: 1, resol: 10, sampletype: 7,lblname: "temperature_1", divide: 100, unit: "CEL"},
    { taglbl: 2, resol: 100, sampletype: 6,lblname: "humidity_1", divide: 100, unit: "P1"},
    { taglbl: 3, resol: 10, sampletype: 6,lblname: "CO2", divide: 1, unit: "52"},
    { taglbl: 4, resol: 10, sampletype: 6,lblname: "TVOC", divide: 1, unit: ""},
    { taglbl: 5, resol: 10, sampletype: 6,lblname: "illuminance", divide: 1, unit: "LUX"},
    { taglbl: 6, resol: 10, sampletype: 6,lblname: "pressure", divide: 10, unit: "A97"}]];

let endpointCorresponder = {
    concentration: ["TVOC", "CO2"],
    temperature: ["temperature_1","temperature_2"],
    humidity: ["humidity_1","humidity_2"],
    pin_state:["violation_detection"]
}


function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    // Test pattern (uncomment to test behaviour)
    payload = "621380f2b11c05b7d0de02557615e0006e390064520c0028f06e14268e10d1febae56068b849812878dd0205bc6e82fa5db71c96048fc7e54041531430019a697c486800a5084b0e5bb44100a01f";
    time=Date.now();
    // Fin test pattern

    var decoded = watteco.Decode(payload,time,batch_param,endpointCorresponder);
    console.log(decoded);
   // var ngsild_payload = ngsild.ngsildWrapper(decoded, time);
    //process.stdout.write(JSON.stringify(ngsild_payload));
}

if (require.main === module) {
    main();
}
