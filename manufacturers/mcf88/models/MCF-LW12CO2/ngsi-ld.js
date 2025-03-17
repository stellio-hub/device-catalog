function ngsildInstance(value, time, unit, dataset_suffix) {
    var ngsild_instance = {
        type: 'Property',
        value: value,
        observedAt: time
    };
    if (unit !== "") {
        ngsild_instance.unitCode = unit;
    }
    if (dataset_suffix !== null) {
        ngsild_instance.datasetId = 'urn:ngsi-ld:Dataset:' + dataset_suffix;
    }

    return ngsild_instance;
}

function ngsildWrapper(input, time, entity_id, parametersMapping) {
    var ngsild_payload = [{
        id: entity_id,
        type: "Device"
    }];
    function addToPayload(key, instance) {
        const entity = ngsild_payload[0]; 
        if (!entity[key]) {
            entity[key] = instance;
        } else {
            if (!Array.isArray(entity[key])) {
                entity[key] = [entity[key]];
            }
            const existingDatasetIds = entity[key].map(item => item.datasetId);
            if (!existingDatasetIds.includes(instance.datasetId)) {
                entity[key].push(instance);
            }
        }
    }
    for (const [key, value] of Object.entries(input)) {
        if (parametersMapping[key]) {
            const mapped = parametersMapping[key];
            const instance = ngsildInstance(value, time, mapped.unitCode, mapped.datasetId);
            addToPayload(mapped.label, instance);
        }
    }
    return ngsild_payload;
}

module.exports = {
    ngsildWrapper: ngsildWrapper,
};
