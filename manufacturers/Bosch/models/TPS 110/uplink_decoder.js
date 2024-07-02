// Decoders and NGSI-LD wrappers to be inserted

function main() {
        var fport = process.argv[2];
        var bytes = Uint8Array.from(Buffer.from(process.argv[3], 'hex'));
        var time = process.argv[4];
        var decoded = Decode(fport, bytes);
        var ngsild_payload = ngsildWrapper(decoded, time);
        process.stdout.write(JSON.stringify(ngsild_payload));
}

if (require.main === module) {
        main();
}
