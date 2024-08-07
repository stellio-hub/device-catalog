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

function ngsildWrapper(input, time, entity_id) {
    var ngsild_payload = [{
        id: entity_id,
        type: "Device"
    }];

    function addToPayload(key, value) {
        if (ngsild_payload.every(d => d.hasOwnProperty(key))) {
            ngsild_payload.push({id: entity_id, type: "Device", ...{[key]: value}});
        } else {
            for (let d of ngsild_payload) {
                if (!d.hasOwnProperty(key)) {
                    d[key] = value;
                    break;
                }
            }
        }
    }

    for (let i = 0; i < input.data.length; i++) {
        let dataSetId = 'Raw'
        let data = input.data[i]
        // Adapt datasetId in case several measurement of same type are present form different sensors (e.g. current clamps)
        if (typeof data.uuid !== 'undefined') {
            dataSetId=data.uuid.concat(":Raw")
        }
        // Verify that mesured property is one to be reported
        if (data.type in AttributeCorresponder) {
            addToPayload(AttributeCorresponder[data.type], ngsildInstance(data.value, time, UnitCorresponder[data.unit], dataSetId))
        }
    }

    return ngsild_payload
}

module.exports = {
    ngsildWrapper: ngsildWrapper,
}