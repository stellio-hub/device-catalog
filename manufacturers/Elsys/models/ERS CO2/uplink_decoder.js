const generic = require("../../elsys_generic.js");
const ngsild = require("../../ngsild_wrapper.js");

function main() {
    const payload = process.argv[3];
    const time = process.argv[4];
    const entity_id = "urn:ngsi-ld:Device:" + process.argv[5];

    const bytes = generic.hexToBytes(payload);
    const decoded = generic.DecodeElsysPayload(bytes);
    const ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);

    process.stdout.write(JSON.stringify(ngsild_payload, null, 4));
}
    
if (require.main === module) {
    main();
}
