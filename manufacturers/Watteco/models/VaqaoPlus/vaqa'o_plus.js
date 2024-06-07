let watteco = require("../../decode.js")
let batch_param = [3, [{taglbl: 0,resol: 1, sampletype: 4,lblname: "occupancy", divide: 1},
    { taglbl: 1, resol: 10, sampletype: 7,lblname: "temperature_1", divide: 100},
    { taglbl: 2, resol: 100, sampletype: 6,lblname: "humidity_1", divide: 100},
    { taglbl: 3, resol: 10, sampletype: 6,lblname: "CO2", divide: 1},
    { taglbl: 4, resol: 10, sampletype: 6,lblname: "TVOC", divide: 1},
    { taglbl: 5, resol: 10, sampletype: 6,lblname: "illuminance", divide: 1},
    { taglbl: 6, resol: 10, sampletype: 6,lblname: "pressure", divide: 10}]];

let endpointCorresponder = {
    concentration: ["TVOC", "CO2"],
    temperature: ["temperature_1","temperature_2"],
    humidity: ["humidity_1","humidity_2"],
    pin_state:["violation_detection"]
}
function decodeUplink(input) {
    return watteco.watteco_decodeUplink(input,batch_param,endpointCorresponder);
}
//exports.decodeUplink = decodeUplink;

//////////////////////////////

var inp = {
    "bytes": [17, 10, 4, 2, 0, 0, 41, 11, 137],  // The frame in a bytes list
    "fPort": 125,                                // The port (Watteco always use 125)
    "recvTime": "2023-07-19T07:51:31.598957793Z" // The date in ISO 8601 format
}
var msg = "70060000e2760090cfc0015b028423fb03272919804c121c003ebc5bd6895f0040000b68b72c27a0ddb4dc8076db920c68b72c19605b04"
if (msg && typeof msg === 'string') {

//    const buffer = Buffer.from(msg, 'base64'); // The frame arrives in base64 in msg.payload.data
    a = msg;
b = a.match(/.{2}/g);
L=a.length
console.log(L)
// Create byte array 
let buffer = new ArrayBuffer(L/2)
let bytes = new Uint8Array(buffer)

// Populate array 
for(let i = 0; i < L/2; ++i) {
    bytes[i] = parseInt(b[i], 16);
}

// Convert and print 
let view = new DataView(buffer)
//console.log(bytes)
//console.log(view.getFloat64(0, false));
    
    var date = Date.now();
    //new Date(msg.payload.time); // The date is recuperated from msg.payload.time
                                          // under any format and is transformed to ISO 8601
    var inputObject = {
        "bytes": bytes, // The frame in a bytes list
        "fPort": 125,    // The port (Watteco always use 125)
        "recvTime": date // The date in ISO 8601 format
    }
    console.log(inputObject);

} else {
    node.error("The message doesn't carry a Base64 frame");
    return null;
}

out = decodeUplink(inputObject); // The frame is decoded
console.log(out);
return out;

console.log("Try programiz.pro");
