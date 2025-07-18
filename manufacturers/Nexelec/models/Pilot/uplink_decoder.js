const codec = require("./pilot_codec.js");
const ngsild = require("./ngsild_wrapper.js");

function main() {
    const fport = process.argv[2];
    const bytes = Uint8Array.from(Buffer.from(process.argv[3], 'hex'));
    const time = process.argv[4];
    const entityId = "urn:ngsi-ld:Device:" + process.argv[5];
    
    const decoded = codec.Decode(fport, bytes);
    const ngsildPayload = ngsild.Wrapper(decoded, time, entityId);
    
    process.stdout.write(JSON.stringify(ngsildPayload, null, 2));
}
    
if (require.main === module) {
    main();
}