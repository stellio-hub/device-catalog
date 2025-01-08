// Added by EGM for NGSI-LD conversion
function ForcetoISOString(dateInput) {
    if (typeof dateInput === 'string') {
      // Check if it's an ISO string by creating a Date object
      const isoDate = new Date(dateInput);
      if (!isNaN(isoDate.getTime())) {
        // Valid ISO string
        return isoDate.toISOString();
      } else {
        throw new Error("Invalid ISO string format");
      }
    } else if (typeof dateInput === 'number') {
      // Assume it's an epoch time in milliseconds
      if (dateInput > 0) {
        return new Date(dateInput).toISOString();
      } else {
        throw new Error("Invalid epoch time");
      }
    } else {
      throw new Error("Unsupported date format");
    }
  }
  

function ngsildInstance(value, time, unit, dataset_suffix) {

    var ngsild_instance = {
        type: 'Property',
        value: value,
    }
    if (unit !== undefined) {
        ngsild_instance.unitCode = unit
    }
    if (dataset_suffix !== undefined) {
        ngsild_instance.datasetId = 'urn:ngsi-ld:Dataset:' + dataset_suffix
        ngsild_instance.observedAt = time
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
        addToPayload(data.variable, ngsildInstance(data.value, ForcetoISOString(data.date), data.unitCode, data.datasetId))
    }

    return ngsild_payload
}

module.exports = {
    ngsildWrapper: ngsildWrapper,
}