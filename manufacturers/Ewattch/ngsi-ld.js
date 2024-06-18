// Added by EGM for NGSI-LD conversion

let UnitCorresponder = {
    Ah: "AMH",
    mAh: "E09",
    mA: "4K",
    A: "AMP",
    W: "WTT",
    ppm: "59",
    s: "SEC",
    '°C': "CEL",
    '%RH': "P1",
    lx: "LUX"
}
let AttributeCorresponder = {
    current: "current",
    currentIndex: "currentIndex",
    power: "power",
    co2: "co2",
    temperature: "temperature",
    humidity: "humidity",
    luminosity: "luminosity",
    motion: "motion",
    periodicity: "periodicity",
    batteryLevel: "batteryLevel",
    version: "hardwareVersion",
}

    function ngsildInstance(value, time, unit, dataset_suffix) {

    var ngsild_instance = {
        type: 'Property',
        value: value,
        observedAt: time
    }
    if (unit !== undefined) {
        ngsild_instance.unitCode = unit
    }
    if (dataset_suffix !== null) {
        ngsild_instance.datasetId = 'urn:ngsi-ld:Dataset:' + dataset_suffix
    }
  
    return ngsild_instance
}

function ngsildWrapper(input, time) {
    var ngsild_payload = {}
    for (let i = 0; i < input.data.length; i++) {
        let result = []
        let dataSetID = 'Raw'
        let data = input.data[i]
        // adapt datasetID in case several measurement of same type are present form different sensors (e.g. current clamps)
        if (typeof data.uuid !== 'undefined') {dataSetID=data.uuid.concat(":Raw")}
        // Verify that mesured property is one to be reported
        if (data.type in AttributeCorresponder){
            instance = ngsildInstance(data.value, time, UnitCorresponder[data.unit], dataSetID)
            if (ngsild_payload[AttributeCorresponder[data.type]] === undefined){
                result.push(instance)
                ngsild_payload[AttributeCorresponder[data.type]] = result
            } else ngsild_payload[AttributeCorresponder[data.type]][ngsild_payload[AttributeCorresponder[data.type]].length] = instance
        }
    }
    return ngsild_payload
}

module.exports = {
    ngsildWrapper: ngsildWrapper,
}