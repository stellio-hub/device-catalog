let codec = require("./decode.js")
let ngsild = require("./ngsi-ld.js")

let parametersMapping =  {
    // Profile === 1
    IEaPInst: {label:"activeEnergy", unitCode: "KWH", datasetId: 'Pos:Raw'},
    IEaNInst: {label:"activeEnergy", unitCode: "KWH", datasetId: 'Neg:Raw'},
    IErPInst: {label:"reactiveEnergy", unitCode: "K3", datasetId: 'Pos:Raw'},
    IErNInst: {label:"reactiveEnergy", unitCode: "K3", datasetId: 'Neg:Raw'},
    ITotalMeter: {label:"pulse", unitCode: "", datasetId: 'Raw'},
    // Profile === 2
    IEaPInst1: {label:"activeEnergy", unitCode: "KWH", datasetId: 'L1:Pos:Raw'},
    IErPInst1: {label:"reactiveEnergy", unitCode: "K3", datasetId: 'L1:Pos:Raw'},
    IEaPInst2: {label:"activeEnergy", unitCode: "KWH", datasetId: 'L2:Pos:Raw'},
    IErPInst2: {label:"reactiveEnergy", unitCode: "K3", datasetId: 'L2:Pos:Raw'},
    IEaPInst3: {label:"activeEnergy", unitCode: "KWH", datasetId: 'L3:Pos:Raw'},
    IErPInst3: {label:"reactiveEnergy", unitCode: "K3", datasetId: 'L3:Pos:Raw'},
    IEaPInst4: {label:"activeEnergy", unitCode: "KWH", datasetId: 'L4:Pos:Raw'},
    IErPInst4: {label:"reactiveEnergy", unitCode: "K3", datasetId: 'L4:Pos:Raw'},
    // Profile === 3
    IEaNInst1: {label:"activeEnergy", unitCode: "KWH", datasetId: 'L1:Neg:Raw'},
    IEaNInst2: {label:"activeEnergy", unitCode: "KWH", datasetId: 'L2:Neg:Raw'},
    IEaNInst3: {label:"activeEnergy", unitCode: "KWH", datasetId: 'L3:Neg:Raw'},
    IEaNInst4: {label:"activeEnergy", unitCode: "KWH", datasetId: 'L4:Neg:Raw'},
    // Profile === 4
    IPSumAvgInst: {label:"activePower", unitCode: "KWT", datasetId: 'Avg:Raw'},
    IQSumAvgInst: {label:"reactivePower", unitCode: "KVR", datasetId: 'Avg:Raw'},
    ISSumAvgInst: {label:"apparentPower", unitCode: "KVR", datasetId: 'Avg:Raw'},
    IpFSumAvgInst: {label:"powerFactor", unitCode: "", datasetId: 'Avg:Raw'},
    IpFSumTypeAvg: {label:"powerFactor", unitCode: "", datasetId: 'Type:Raw'},
    II1AvgInst: {label:"current", unitCode: "AMP", datasetId: 'L1:Raw'},
    II2AvgInst: {label:"current", unitCode: "AMP", datasetId: 'L2:Raw'},
    II3AvgInst: {label:"current", unitCode: "AMP", datasetId: 'L3:Raw'},
    IFreqAvgInst: {label:"frequency", unitCode: "HTZ", datasetId: 'Avg:Raw'},
    IInstTemperature1: {label:"temperature", unitCode: "CEL", datasetId: 'In1:Avg:Raw'},
    IInstTemperature2: {label:"temperature", unitCode: "CEL", datasetId: 'In2:Avg:Raw'},
    IInstTemperature3: {label:"temperature", unitCode: "CEL", datasetId: 'In3:Avg:Raw'},
    // Profile === 5
    IPSumAvgInst1: {label:"activePower", unitCode: "KWT", datasetId: 'L1:Avg:Raw'},
    IQSumAvgInst1: {label:"reactivePower", unitCode: "KVR", datasetId: 'L1:Avg:Raw'},
    IPSumAvgInst2: {label:"activePower", unitCode: "KWT", datasetId: 'L2:Avg:Raw'},
    IQSumAvgInst2: {label:"reactivePower", unitCode: "KVR", datasetId: 'L2:Avg:Raw'},
    IPSumAvgInst3: {label:"activePower", unitCode: "KWT", datasetId: 'L3:Avg:Raw'},
    IQSumAvgInst3: {label:"reactivePower", unitCode: "KVR", datasetId: 'L3:Avg:Raw'},
    IPSumAvgInst4: {label:"activePower", unitCode: "KWT", datasetId: 'L4:Avg:Raw'},
    IQSumAvgInst4: {label:"reactivePower", unitCode: "KVR", datasetId: 'L4:Avg:Raw'},
    // Profile === 6
        // To be done. Unclear what is the load curve integrated over the uplink period but still express in W, Var rtather than Wh/Varh. Request for explanation sent to Socomec. 
    // Profile === 7
        // To be done. Unclear what is the load curve integrated over the uplink period but still express in W, Var rtather than Wh/Varh. Request for explanation sent to Socomec.
    // Common part
    IInputFct01: {label:"digitalInput", unitCode: "", datasetId: 'In1:Raw'},
    IInputFct02: {label:"digitalInput", unitCode: "", datasetId: 'In2:Raw'},
    IInputFct03: {label:"digitalInput", unitCode: "", datasetId: 'OptMod1:In1:Raw'},
    IInputFct04: {label:"digitalInput", unitCode: "", datasetId: 'OptMod1:In2:Raw'},
    IInputFct05: {label:"digitalInput", unitCode: "", datasetId: 'OptMod2:In1:Raw'},
    IInputFct06: {label:"digitalInput", unitCode: "", datasetId: 'OptMod2:In2:Raw'},
    IInputFct07: {label:"digitalInput", unitCode: "", datasetId: 'OptMod3:In1:Raw'},
    IInputFct08: {label:"digitalInput", unitCode: "", datasetId: 'OptMod3:In2:Raw'},
    IInputFct09: {label:"digitalInput", unitCode: "", datasetId: 'OptMod4:In1:Raw'},
    IInputFct10: {label:"digitalInput", unitCode: "", datasetId: 'OptMod4:In2:Raw'},
    CT1: {label:"digitalInput", unitCode: "", datasetId: 'iTR1:Raw'},
    CT2: {label:"digitalInput", unitCode: "", datasetId: 'iTR2:Raw'},
    CT3: {label:"digitalInput", unitCode: "", datasetId: 'iTR3:Raw'},
    CT4: {label:"digitalInput", unitCode: "", datasetId: 'iTR4:Raw'},
    CT1Cpt: {label:"digitalInput", unitCode: "", datasetId: 'iTR1:Count:Raw'},
    CT2Cpt: {label:"digitalInput", unitCode: "", datasetId: 'iTR1:Count:Raw'},
    CT3Cpt: {label:"digitalInput", unitCode: "", datasetId: 'iTR1:Count:Raw'},
    CT4Cpt: {label:"digitalInput", unitCode: "", datasetId: 'iTR1:Count:Raw'},
    Input1Cpt: {label:"digitalInput", unitCode: "", datasetId: 'In1:Count:Raw'},
    Input2Cpt: {label:"digitalInput", unitCode: "", datasetId: 'In2:Count:Raw'},
    Input3Cpt: {label:"digitalInput", unitCode: "", datasetId: 'OptMod1:In1:Count:Raw'},
    Input4Cpt: {label:"digitalInput", unitCode: "", datasetId: 'OptMod1:In2:Count:Raw'},
    // Alarms
    ILogicalAlarmValue1: {label:"alarm", unitCode: "", datasetId: 'Logical1:Raw'},
    ILogicalAlarmValue2: {label:"alarm", unitCode: "", datasetId: 'Logical2:Raw'},
    ILogicalAlarmValue3: {label:"alarm", unitCode: "", datasetId: 'Logical3:Raw'},
    ILogicalAlarmValue4: {label:"alarm", unitCode: "", datasetId: 'Logical4:Raw'},
    ICombiAlarmValue1: {label:"alarm", unitCode: "", datasetId: 'Combi1:Raw'},
    ICombiAlarmValue2: {label:"alarm", unitCode: "", datasetId: 'Combi2:Raw'},
    ICombiAlarmValue3: {label:"alarm", unitCode: "", datasetId: 'Combi3:Raw'},
    ICombiAlarmValue4: {label:"alarm", unitCode: "", datasetId: 'Combi4:Raw'},
    IAnalogAlarmValue1: {label:"alarm", unitCode: "", datasetId: 'Analog1:Raw'},
    IAnalogAlarmValue2: {label:"alarm", unitCode: "", datasetId: 'Analog2:Raw'},
    IAnalogAlarmValue3: {label:"alarm", unitCode: "", datasetId: 'Analog3:Raw'},
    IAnalogAlarmValue4: {label:"alarm", unitCode: "", datasetId: 'Analog4:Raw'},
    IAnalogAlarmValue5: {label:"alarm", unitCode: "", datasetId: 'Analog5:Raw'},
    IAnalogAlarmValue6: {label:"alarm", unitCode: "", datasetId: 'Analog6:Raw'},
    IAnalogAlarmValue7: {label:"alarm", unitCode: "", datasetId: 'Analog7:Raw'},
    IAnalogAlarmValue8: {label:"alarm", unitCode: "", datasetId: 'Analog8:Raw'},
    ISystemAlarmValue1: {label:"alarm", unitCode: "", datasetId: 'System1:Raw'},
    ISystemAlarmValue2: {label:"alarm", unitCode: "", datasetId: 'System2:Raw'},
    ISystemAlarmValue3: {label:"alarm", unitCode: "", datasetId: 'System3:Raw'},
    ISystemAlarmValue4: {label:"alarm", unitCode: "", datasetId: 'System4:Raw'},
    IProtectionAlarmValue1: {label:"alarm", unitCode: "", datasetId: 'Protection1:Raw'},
    IProtectionAlarmValue2: {label:"alarm", unitCode: "", datasetId: 'Protection2:Raw'},
    IProtectionAlarmValue3: {label:"alarm", unitCode: "", datasetId: 'Protection3:Raw'},
    IProtectionAlarmValue4: {label:"alarm", unitCode: "", datasetId: 'Protection4:Raw'},
    IProtectionAlarmValue5: {label:"alarm", unitCode: "", datasetId: 'Protection5:Raw'},
    IProtectionAlarmValue6: {label:"alarm", unitCode: "", datasetId: 'Protection6:Raw'},
    TimeRequest: {label:"alarm", unitCode: "", datasetId: 'TimeRequest:Raw'}

}


function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    // ********* Test pattern (uncomment to test behaviour) ********************
        // payload = "112854A28101000800" //frame_type_label: 'Alarm',
        // payload = "021125E681DE0000000000ba035d0000000000000cae0000000000b8aaec0000000000000f21000000000000000000030011" // profileLabel: '1- Single Load Energies (consumption/production)'
        // payload = "022125E681DE030103111301131123012311330133114301431153015311630163117301731100000000075BCD153C01A15" // profileLabel: '2- Multi-load – Energies (comsumption)'
        // payload = "023125E681DE030103111301131123012311330133114301431153015311630163117301731100000000075BCD153C01A15F" //  profileLabel: '3- Multi-load – Energies (consumption/production)'
        // payload = "02412750264400000fb6fffffd9200000fe603dc0001000006770000120c000032980000c3511C007fff7fff04331234A15F" // profileLabel: '4- Single-load – Monitoring',
        // payload = "025127502644101012341019123410201234102912341030123410391234104012341049123404331234A15F" // profileLabel: '5- Multi-load – Monitoring',
        // payload = "02612750264400000fb6fffffd9200000fe603dc0001000006770000120c000032980000c3511C007fff7fff04331234A15F" // profileLabel: '6- Single-load – Load curves'
        // payload = "02712750264400000fb6fffffd9200000fe603dc0001000006770000120c000032980000c3511C007fff7fff04331234A15F" // profileLabel: '7- Multi-load - Load curves'
        // payload = "02912750264400000fb6fffffd9200000fe603dc0001000006770000120c000032980000c3511C007fff7fff04331234A15F" // error: 'error, Profile type not managed'
        // payload = "112854A28101000800"
        // payload = "0101" //Date-Time update request
        // time=Date.now();
        // entity_id = "entity_id" 
    // ********* End test pattern ***********************



    var decoded = codec.decodeUplink(Buffer.from(payload,'hex'));
    // console.log(decoded)
    var ngsild_payload = ngsild.ngsildWrapper(decoded.data.socomec, time, entity_id,parametersMapping);
    if (Object.keys(ngsild_payload)[0] !== 'message_type'){
        process.stdout.write(JSON.stringify(ngsild_payload));
    }
    // console.log(ngsild_payload)

}

if (require.main === module) {
    main();
}
