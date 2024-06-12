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

function ngsildWrapper(input, time) {
    var ngsild_payload = {}
    for (let i = 0; i < input.data.length; i++) {
        let result=[]
        let data = input.data[i]
        instance = ngsildInstance(data.value,data.date,data.unitCode, 'Raw')
        if (ngsild_payload[data.variable] === undefined){
            result.push(instance)
            ngsild_payload[data.variable]=result
        } else  ngsild_payload[data.variable][ngsild_payload[data.variable].length] = instance
    }
    return ngsild_payload

}

module.exports = {
    ngsildWrapper: ngsildWrapper,
}