let watteco = require("../../decode.js")
let ngsild = require("../../ngsi-ld.js")

let batch_param = [];

// Identical Physical quantities are grouped under the same property name (e.g. "temperature") and differentiated at datasetId level (2nd parts of the row. e.g. "Temperature1:Raw","Temperature2:Raw")
// Similar approach is done to group alarms under the same property
// Each item of endpointCorresponder should be a multiple of 3
// First third lists the NGSLI-LD property names
// Second third lists their corresponding NGSI-LD datasetId
// Third third lists their corresponding NGSI-LD unitCodes
// An empty datasetID will create a non temporal attribute 
// By setting teh value to ["Ignore"], thne item will be explicitely ignored. If not present, it is also ioghnore by default. 
// Additionnel fields can be added from the WATTECO document "TIC Sensors - Application layer description" 
let endpointCorresponder={
    _TICFrameType: ["Ignore"], // To be ignored
    _Descriptor: ["Ignore"], // To be ignored
    DATE: ["Ignore"], // To be ignored
    disposable_battery_voltage: ["batteryLevel", "Disposable_battery_voltage:Raw","VLT"],
    nb_samples: ["","pulses","", "Raw","",""],
    active_energy: ["","activeEnergy","","Raw","","KWH"],
    reactive_energy: ["","reactiveEnergy", "","Raw", "","K3"],
    active_power: ["","activePower","","Raw","","KWT"],
    reactive_power: ["","reactivePower", "","Raw", "","KVR"],
    // Linky Parameters
    EAST: ["activeEnergy", "EAST:Raw", "WHR"],
    EAIT: ["activeEnergy", "EAIT:Raw", "WHR"],
    ADSC: ["counterId", "", ""],
    LTARF: ["CurrentSupplierPrice","Raw",""],
    NGTF: ["offerLabel", "", ""],
    PREF: ["referenceApparentPower", "", "KVA"],
    PCOUP: ["cuttingApparentPower", "", "KVA"],
    EASF01: ["activeEnergy", "EASF01:Raw", "WHR"],
    EASF02: ["activeEnergy", "EASF02:Raw", "WHR"],
    EASF03: ["activeEnergy", "EASF03:Raw", "WHR"],
    EASF04: ["activeEnergy", "EASF04:Raw", "WHR"],
    EASF05: ["activeEnergy", "EASF05:Raw", "WHR"],
    EASF06: ["activeEnergy", "EASF06:Raw", "WHR"],
    
    // PMEPMI Parameters
    EAP_s: ["activeEnergy", 'EAP_s:Raw', "KWH"],
    EAP_i: ["activeEnergy", 'EAP_i:Raw', "KWH"],   
    ADS: ["counterId", "", ""],
    MESURES1: ["offerLabel", "MESURES1:Raw", ""],
    PTCOUR1: ["CurrentSupplierPrice","Raw",""],
    PS: ["referenceApparentPower", "", "KVA"],
};

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // ********* Test pattern (uncomment to test behaviour) ********************
        // payload = "310a00520000410c000047ffffbe0063002fffd6" // uplink standard report containing simple metering         
        // payload = "110A005601004113240205144515040C0A09210001968200F17FC5" //
        // payload = "110a005700004115650328292a0c0415093b3527f7e5a0000004064410" //
        // payload = "110a0056010041170410003445140a0313000283494e440000462c00233f4c" // 
        // payload = "110a0056010041132402051445140a180525190001a81401cd4593" //
        // payload = "110100000002000D0305020015E2" //Firmware version
        // payload = "110A00500006410503040E6804" //Battery charge
        // entity_id  ="EntityID"
        // time=Date.now()
    // ********* End test pattern ***********************

    var decoded = watteco.Decode(payload,time,batch_param,endpointCorresponder);
    var ngsild_payload = ngsild.ngsildWrapper(decoded, time, entity_id);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
    }
    // console.log(ngsild_payload)
}

if (require.main === module) {
    main();
}
