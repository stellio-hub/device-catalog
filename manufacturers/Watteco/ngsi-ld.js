// Added by EGM for NGSI-LD conversion

function ngsildInstance(value, time, unit, dataset_suffix) {
    var ngsild_instance = {
        type: 'Property',
        value: value,
        observedAt: time
    }
    if (unit !== null) {
        ngsild_instance.unitCode = unit
    }
    if (dataset_suffix !== null) {
        ngsild_instance.datasetId = 'urn:ngsi-ld:Dataset:' + dataset_suffix
    }
    return ngsild_instance
}

function ngsildWrapper(input, time) {
    var payload = input.data
    if (payload.Type_of_message === 'Real_Time') {
        var ngsild_payload = { 
            pm1: ngsildInstance(payload['Concentration_PM_1'], time, 'GQ', 'Raw'),
            pm2_5: ngsildInstance(payload['Concentration_PM_2.5'], time, 'GQ', 'Raw'),
            pm10: ngsildInstance(payload['Concentration_PM_10'], time, 'GQ', 'Raw'),
            temperature: ngsildInstance(payload['Temperature(°C)'], time, 'CEL', 'Raw'),
            humidity: ngsildInstance(payload['Relative_Humidity_(%RH)'], time, 'P1', 'Raw'),
            co2: ngsildInstance(payload['Total_CO2(ppm)'], time, '59', 'Raw'),
            cov: ngsildInstance(payload['Total_COV(ppm)'], time, '59', 'Raw'),
            formaldehydes: ngsildInstance(payload['Formaldehydes(ppb)'], time, '61', 'Raw'),
            luminosity: ngsildInstance(payload['Luminosity(lux)'], time, 'LUX', 'Raw'),
            noise: ngsildInstance(payload['Average_Noise(dB)'], time, '2N', 'Raw'),
            peak_noise: ngsildInstance(payload['Peak_Noise(dB)'], time, '2N', 'Raw'),
            presence: ngsildInstance(payload['Presence_counter'], time, 'P1', 'Raw'),
            pressure: ngsildInstance(payload['Pressure'], time, 'A97', 'Raw'),
            indoorAirQuality: [
                ngsildInstance(payload['IAQ_CO2'], time, null, 'co2'),
                ngsildInstance(payload['IAQ_VOCs'], time, null, 'VOCs'),
                ngsildInstance(payload['IAQ_Formaldehyde'], time, null, 'Formaldehyde'),
                ngsildInstance(payload['IAQ_PM1.0'], time, null, 'PM1.0'),
                ngsildInstance(payload['IAQ_PM2.5'], time, null, 'PM2.5'),
                ngsildInstance(payload['IAQ_PM10'], time, null, 'PM10'),
                ngsildInstance(payload['IAQ_TH'], time, null, 'TH'),
            ]
        };
    }
    else if (payload.Type_of_message === 'Datalog') {
        var date = new Date(time);
        var time_n1 = new Date(date.setDate(date.getDate() - 1)).toISOString();
        var time_n2 = new Date(date.setDate(date.getDate() - 1)).toISOString();
        var ngsild_payload = {
            co2: [
                ngsildInstance(payload['CO2_concentration_n'], time, '59', 'Raw'),
                ngsildInstance(payload['CO2_concentration_n-1'], time_n1, '59', 'Raw'),
                ngsildInstance(payload['CO2_concentration_n-2'], time_n2, '59', 'Raw')
            ],
            temperature: [
                ngsildInstance(payload['Temperature_n'], time, 'CEL', 'Raw'),
                ngsildInstance(payload['Temperature_n-1'], time_n1, 'CEL', 'Raw'),
                ngsildInstance(payload['Temperature_n-2'], time_n2, 'CEL', 'Raw')
            ],
            humidity: [
                ngsildInstance(payload['Relative_Humidity_n'], time, 'P1', 'Raw'),
                ngsildInstance(payload['Relative_Humidity_n-1'], time_n1, 'P1', 'Raw'),
                ngsildInstance(payload['Relative_Humidity_n-2'], time_n2, 'P1', 'Raw')
            ]
        };
    }
    else if (payload.Type_of_message === 'Config_General') {
        delete payload.Type_of_Product;
        delete payload.Type_of_message;
        var ngsild_payload = {
            configGeneral: ngsildInstance(payload, time, null, null)
        };
    }
    else if (payload.Type_of_message === 'Config_CO2') {
        delete payload.Type_of_Product;
        delete payload.Type_of_message;
        var ngsild_payload = {
            co2Config: ngsildInstance(payload, time, null, null)
        };
    }
    else if (payload.Type_of_message === 'Product_Status_Message') {
        delete payload.Type_of_Product;
        delete payload.Type_of_message;
        var ngsild_payload = {
            productStatusMessage: ngsildInstance(payload, time, null, null)
        };
    }
    else if (payload.Type_of_message === 'Push') {
        delete payload.Type_of_Product;
        delete payload.Type_of_message;
        var ngsild_payload = {
            buttonActivation: ngsildInstance(1, time, null, null)
        };
    }
    else if (payload.Type_of_message === 'Keep_Alive') {
        var ngsild_payload = {};
    }
    else {
        throw new Error('Unsupported Type_of_message');
    }
    return ngsild_payload;
}

module.exports = {
    ngsildWrapper: ngsildWrapper,
}