// Added by EGM for NGSI-LD conversion

function ngsildInstance(value, time, unit, dataset_suffix) {

    var ngsild_instance = {
        type: 'Property',
        value: value,
        observedAt: time
    }
    if (unit !== "") {
        ngsild_instance.unitCode = unit
    }
    if (dataset_suffix !== null) {
        ngsild_instance.datasetId = 'urn:ngsi-ld:Dataset:' + dataset_suffix
    }
  
    return ngsild_instance
}

function ngsildWrapper(input, time, entity_id,parametersMapping) {
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
    let timestamp = input.timestamp
    for (const [key, value] of Object.entries(input.data)) {
        if (parametersMapping[key]) {
            if (key == "timestamp_t0"){timestamp = value}
            if (key == "timestamp_t1"){timestamp = value}
            addToPayload(parametersMapping[key].label, ngsildInstance(value, timestamp, parametersMapping[key].unitCode, parametersMapping[key].datasetId))
        }
        
    }

    return ngsild_payload
}

module.exports = {
    ngsildWrapper: ngsildWrapper,
}