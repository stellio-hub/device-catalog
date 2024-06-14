const standard = require("./standard.js");
const batch = require("./batch.js");

function watteco_decodeUplink(input, batch_parameters, endpoint_parameters) {
    let bytes = input.bytes;
    let port = input.fPort;
    let date = input.recvTime;

    try {
        let decoded = standard.normalisation_standard(input, endpoint_parameters)
        let payload = decoded.payload;
        if (decoded.type === "batch") {
            let batchInput = {
                batch1: batch_parameters[0],
                batch2: batch_parameters[1],
                payload: payload,
                date: date,
            }
            try {
                let decoded = batch.normalisation_batch(batchInput)
                return {
                    data: decoded,
                    warnings: [],
                }
            } catch (error) {
                return {
                    error: error.message,
                    warnings: [],
                }
            }
        } else {
            decoded.data[0].date = new Date(decoded.data[0].date).toISOString();
            return {
                data: decoded.data,
                warnings: decoded.warning,

            };
        }
    } catch (error) {
        return {
            error: error.message,
            warnings: [],
        };
    }
}

function decodeUplink(input,batch_param,endpointCorresponder) {
    return watteco_decodeUplink(input,batch_param,endpointCorresponder);
}

//required to change input payload into an array of bytes. More elegant solutions likely exist to make it
function Decode(msg,date,batch_param,endpointCorresponder){
if (msg && typeof msg === 'string') {

//    const buffer = Buffer.from(msg, 'base64'); // The frame arrives in base64 in msg.payload.data
    a = msg;
    b = a.match(/.{2}/g);
    L=a.length

    // Create byte array 
    let buffer = new ArrayBuffer(L/2)
    let bytes = new Uint8Array(buffer)

    // Populate array 
    for(let i = 0; i < L/2; ++i) {
        bytes[i] = parseInt(b[i], 16);
    }

    // Convert and print 
    let view = new DataView(buffer)
    
    var inputObject = {
        "bytes": bytes, // The frame in a bytes list
        "fPort": 125,    // The port (Watteco always use 125)
        "recvTime": date // The date in ISO 8601 format
    }

} else {
    throw new Error("The message doesn't carry a Base64 frame");
}
out = decodeUplink(inputObject,batch_param,endpointCorresponder); // The frame is decoded
return out;
}

module.exports = {
    watteco_decodeUplink: watteco_decodeUplink,
    Decode: Decode,
}

