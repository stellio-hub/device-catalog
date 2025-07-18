// Added by EGM for NGSI-LD conversion

const PARAMETERS_MAPPING = {
    temperature: {label:"temperature", unitCode: "CEL", datasetId: 'Raw'},
    humidity: {label:"humidity", unitCode: "P1", datasetId: 'Raw'},
    light: {label:"illuminance", unitCode: "LUX", datasetId: 'Raw'},
    motion: {label:"motion", unitCode: null, datasetId: 'Raw'},
    co2: {label:"co2", unitCode: "59", datasetId: 'Raw'},
    vdd: {label:"batteryVoltage", unitCode: "VLT", datasetId: 'Raw'}
}

function ngsildInstance(value, time=null, unit=null, dataset_suffix=null) {
    let ngsild_instance = {
        type: 'Property',
        value: value
    }
    if (time !== null) {
        ngsild_instance.observedAt = time
    }
    if (unit !== null) {
        ngsild_instance.unitCode = unit
    }
    if (dataset_suffix !== null) {
        ngsild_instance.datasetId = 'urn:ngsi-ld:Dataset:' + dataset_suffix
    }
    return ngsild_instance
}

function ngsildWrapper(input, time, entity_id) {
    let ngsild_payload = [{
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
    for (const [key, value] of Object.entries(input)) {
        if (value != null) {
            const instance = ngsildInstance(value, time, PARAMETERS_MAPPING[key].unitCode, PARAMETERS_MAPPING[key].datasetId);
            addToPayload(PARAMETERS_MAPPING[key].label, instance);
        }
    }
    return ngsild_payload
}

module.exports = {
    ngsildWrapper: ngsildWrapper,
}