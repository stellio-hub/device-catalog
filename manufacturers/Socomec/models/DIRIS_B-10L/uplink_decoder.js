let codec = require("./decode.js")
let ngsild = require("./ngsi-ld.js")


function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // ********* Test pattern (uncomment to test behaviour) ********************
        // 112854A28101000800
        // 021125E681DE0000000000ba035d0000000000000cae0000000000b8aaec0000000000000f21000000000000000000030011
        // 022125E681DE030103111301131123012311330133114301431153015311630163117301731100000000075BCD153C01A15
        // 023125E681DE030103111301131123012311330133114301431153015311630163117301731100000000075BCD153C01A15F
        // 02412750264400000fb6fffffd9200000fe603dc0001000006770000120c000032980000c3511C007fff7fff04331234A15F
        // 025127502644101012341019123410201234102912341030123410391234104012341049123404331234A15F
        // 02612750264400000fb6fffffd9200000fe603dc0001000006770000120c000032980000c3511C007fff7fff04331234A15F
        // 02712750264400000fb6fffffd9200000fe603dc0001000006770000120c000032980000c3511C007fff7fff04331234A15F
        // 02912750264400000fb6fffffd9200000fe603dc0001000006770000120c000032980000c3511C007fff7fff04331234A15F
        // 112854A28101000800
    // ********* End test pattern ***********************

    var decoded = codec.Decode(...);
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
    }
}

if (require.main === module) {
    main();
}
