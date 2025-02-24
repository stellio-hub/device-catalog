let generic = require("../../elsys_generic.js");
let ngsild = require("../../ngsild_wrapper.js");

function main() {
    let payload = process.argv[3];
    let time = process.argv[4];
    let entity_id = "urn:ngsi-ld:Device:" + process.argv[5];

    let bytes = generic.hexToBytes(payload);
    let decoded = generic.DecodeElsysPayload(bytes);
    let ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);

    process.stdout.write(JSON.stringify(ngsild_payload, null, 4));
}
    
if (require.main === module) {
    main();
}
