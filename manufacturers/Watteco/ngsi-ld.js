// Added by EGM for NGSI-LD conversion

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
        let data = input.data[i];
        addToPayload(data.variable, ngsildInstance(data.value, data.date, data.unitCode, data.datasetId || "Raw"))
    }

    return ngsild_payload
}

module.exports = {
    ngsildWrapper: ngsildWrapper,
}