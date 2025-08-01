let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")
let zonemap = require("../../../../utils/zonemap.js")
// See here for explanations on batch parameters: https://support.watteco.com/
// batch_param has been updated from Watteco driver so that: 
// lbnlname : used as NGSI-LD propertu name
// unit : used as NGSI-LD unitCode
// datasetId : used as NGSI-LD unitCode (optional. "Raw" by default)
let batch_param = [3, [{taglbl: 0, resol: 1, sampletype: 4, lblname: "occupancy", divide: 1, unit: "", datasetId: "Raw"},
    {taglbl: 1, resol: 10, sampletype: 7, lblname: "temperature", divide: 100, unit: "CEL", datasetId: "Raw"},
    {taglbl: 2, resol: 100, sampletype: 6, lblname: "humidity", divide: 100, unit: "P1", datasetId: "Raw"},
    {taglbl: 3, resol: 10, sampletype: 6, lblname: "co2", divide: 1, unit: "59", datasetId: "Raw"},
    {taglbl: 4, resol: 10, sampletype: 6, lblname: "tvoc", divide: 1, unit: "", datasetId: "Raw"}]];

// Identical Physical quantities are grouped under the same property name (e.g. "temperature") and differentiated at datasetId level (2nd parts of the row. e.g. "Temperature1:Raw","Temperature2:Raw")
// Similar approach is done to group alarms under the same property
// Each item of endpointCorresponder should be a multiple of 3
// First third lists the NGSLI-LD property names
// Second third lists their corresponding NGSI-LD datasetId
// Third third lists their corresponding NGSI-LD unitCodes
// An empty datasetID will create a non temporal attribute 
let endpointCorresponder = {
    concentration: ["tvoc", "co2","Raw","Raw","","59"],
    temperature: ["temperature", "temperature","Temperature1:Raw","Temperature2:Raw","CEL","CEL"],
    humidity: ["humidity", "humidity","Humidity1:Raw","Humidity2:Raw","P1","P1"],
    pin_state:["alarm","CaseViolation:Raw",""],
    disposable_battery_voltage: ["batteryLevel", "Disposable_battery_voltage:Raw","VLT"]
}

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    var decoded = watteco.Decode(payload,time,batch_param,endpointCorresponder);

    // Perform additional processing if needed
    let processedData = [];
    for (let i = 0; i < decoded.data.length; i++) {
        let data = decoded.data[i];

        // Estimate universal battery level indicator (#6027)
        if (data.variable === "batteryLevel" && data.datasetId === "Disposable_battery_voltage:Raw") { 
            let batteryLevel = zonemap.zonefromvalue(data.value, [3.2, 3.3, 3.4, 3.45]);
            processedData.push({
                variable: data.variable,
                value: batteryLevel,
                datasetId: "scale5",
                date: data.date
            });
        }
    }

    // If there are any processed data, append them to the decoded data
    if (processedData.length > 0) {
        decoded.data = decoded.data.concat(processedData);
    }

    // Convert the decoded data to NGSI-LD format
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
    }
}

if (require.main === module) {
    main();
}
