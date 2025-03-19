// Added by EGM for NGSI-LD conversion

function ngsildInstance(value, time, unit, dataset_suffix) {
    if (value !== null && value !== undefined && !Number.isNaN(value) && time !== "null") {
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
    } else {return  null;}
    
}

function ngsildWrapper(input, time, entity_id,parametersMapping) {
    if (Object.keys(input.data).length !== 0){
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
    
        let timestamp = input.timestamp || time;
        let measureTime = timestamp;
        let instance = "";
        for (const [key, value] of Object.entries(input.data)) {
            if (key == "timestamp_t0" || key == "timestamp_t1") {
                measureTime = value;
            }
            if (parametersMapping[key]) {
                if (key.includes("ILast")) {
                    instance = ngsildInstance(value, measureTime, parametersMapping[key].unitCode, parametersMapping[key].datasetId);
                } else {
                    instance = ngsildInstance(value, timestamp, parametersMapping[key].unitCode, parametersMapping[key].datasetId);
                }
                if (instance !==null) {addToPayload(parametersMapping[key].label, instance)};
            }
            
        }
        return ngsild_payload
    }
}

module.exports = {
    ngsildWrapper: ngsildWrapper,
}