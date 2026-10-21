const ewattch = require("../../ewattch_decode.js");
const ngsild = require("../../ngsi-ld.js");

function main() {
    const fPort = Number(process.argv[2]);
    const payload = process.argv[3];
    const time = process.argv[4];
    const entityId = "urn:ngsi-ld:Device:" + process.argv[5];
    if (!Number.isInteger(fPort)) throw new TypeError("fPort must be an integer");
    if (!/^(?:[0-9a-fA-F]{2})+$/.test(payload || "")) throw new TypeError("payload must be a non-empty, even-length hexadecimal string");
    const decoded = ewattch.LoraWANEwattchDecoder(payload, fPort);
    const errors = decoded.data.filter((item) => item.type === "error");
    if (errors.length) throw new Error(errors.map((item) => item.value || "Ewattch decoding error").join("; "));
    process.stdout.write(JSON.stringify(ngsild.ngsildWrapper(decoded, time, entityId)));
}

if (require.main === module) main();
