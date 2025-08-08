function Decode(fPort, bytes) {
    var bytesString = bytes2HexString(bytes).toLocaleUpperCase();
    var fport = parseInt(fPort);
    // var bytesString = input
    var decoded = {
        // valid
        valid: true,
        err: 0,
        // bytes
        payload: bytesString,
        // messages array
        messages: []
    };

    // CRC check
    if (!crc16Check(bytesString)) {
        decoded['valid'] = false;
        decoded['err'] = -1; // "crc check fail."
        return {
            data: decoded
        };
    }
	
	// Length Check
    if (bytesString.length !== 40 && bytesString.length !== 44 && bytesString.length !== 60) {
        decoded['valid'] = false;
        decoded['err'] = -2; // "length check fail."
        return {
            data: decoded
        };
    }
	const ids = [ 4097, 4098, 4099, 4190, 4105, 4104, 4113, 4101, 4173, 4174]
	var frameID = bytes[0]
	if(frameID===1)
	{
		var meas_list01=[];
		meas_list01.push(((bytes[1] << 8) + bytes[2])/10);
		meas_list01.push(bytes[3]);
		meas_list01.push((bytes[4] << 24) + (bytes[5] << 16) + (bytes[6] << 8) + bytes[7]);
		meas_list01.push(bytes[8]/10);
		meas_list01.push(((bytes[9]<<8) + bytes[10])/10);
		meas_list01.push((bytes[12]<<8) + bytes[13]);
		meas_list01.push(((bytes[14] << 24) + (bytes[15] << 16) + (bytes[16] << 8) + bytes[17])/1000);
		meas_list01.push(((bytes[18]<<8) + bytes[19])*10);
		if(bytes.length===22)
		{
			meas_list01.push(bytes[21]);
		}
		for(var i = 0; i<meas_list01.length; i++)
		{
			decoded.messages.push({
                type: 'report_telemetry',
				measurementId: ids[i],
                measurementValue: meas_list01[i]
			});
		}
	}
	else if(frameID===4)
	{
		var meas_list04=[];
		meas_list04.push(((bytes[11] << 8) + bytes[12])/10);
		meas_list04.push(bytes[13]);
		meas_list04.push((bytes[14] << 24) + (bytes[15] << 16) + (bytes[16] << 8) + bytes[17]);
		meas_list04.push(bytes[18]/10);
		meas_list04.push(((bytes[19]<<8) + bytes[20])/10);
		meas_list04.push((bytes[22]<<8) + bytes[23]);
		meas_list04.push(((bytes[24] << 24) + (bytes[25] << 16) + (bytes[26] << 8) + bytes[27])/1000);
		meas_list04.push(((bytes[28]<<8) + bytes[29])*10);
		meas_list04.push(bytes[1]);
		meas_list04.push((bytes[6]<<8) + bytes[7]);
		for(var i = 0; i<meas_list04.length; i++)
		{
			decoded.messages.push({
                type: 'report_telemetry',
				measurementId: i,
                measurementValue: meas_list04[i]
			});
		}
	}
    // return
    return {
        data: decoded
    };
}

function crc16Check(data) {
    return true;
}

// util
function bytes2HexString(arrBytes) {
    var str = '';
    for (var i = 0; i < arrBytes.length; i++) {
        var tmp;
        var num = arrBytes[i];
        if (num < 0) {
            tmp = (255 + num + 1).toString(16);
        } else {
            tmp = num.toString(16);
        }
        if (tmp.length === 1) {
            tmp = '0' + tmp;
        }
        str += tmp;
    }
    return str;
}

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

function ngsildWrapper(input, time, entity_id) {
    var ngsild_payload = [{
        id: entity_id,
        type: "Device"
    }];
    var messages = input.data.messages;
    var error = true
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].type === 'report_telemetry' && messages[i].measurementValue !== 0 && messages[i].measurementValue !== 2000001) {
            error = false
        }
    }
    if (error){
        ngsild_payload[0].error = ngsildInstance(1, time, null, null)
    } else {
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].type === 'report_telemetry') {
				if(messages[i].measurementId === 4097) {
					ngsild_payload[0].airTemperature = ngsildInstance(messages[i].measurementValue, time, 'CEL', 'Raw');
				}
                else if (messages[i].measurementId === 4098) {
					ngsild_payload[0].airHumidity = ngsildInstance(messages[i].measurementValue, time, 'P1', 'Raw');
                }
				else if (messages[i].measurementId === 4099) {
					ngsild_payload[0].lightIntensity = ngsildInstance(messages[i].measurementValue, time, 'LUX', 'Raw');
                }
				else if (messages[i].measurementId === 4190) {
					ngsild_payload[0].uvIndex = ngsildInstance(messages[i].measurementValue, time, null, 'Raw');
                }
				else if (messages[i].measurementId === 4105) {
					ngsild_payload[0].windSpeed = ngsildInstance(messages[i].measurementValue, time, 'MTS', 'Raw');
                }
				else if (messages[i].measurementId === 4104) {
					ngsild_payload[0].windDirection = ngsildInstance(messages[i].measurementValue, time, 'DD', 'Raw');
                }
				else if (messages[i].measurementId === 4113) {
					ngsild_payload[0].rainfallIntensity = ngsildInstance(messages[i].measurementValue, time, 'H67', 'Raw');
                }
				else if (messages[i].measurementId === 4101) {
					ngsild_payload[0].barometricPressure = ngsildInstance(messages[i].measurementValue, time, 'PAL', 'Raw');
                }
				else if (messages[i].measurementId === 4173) {
					ngsild_payload[0].battery = ngsildInstance(messages[i].measurementValue, time, 'P1', 'Raw');
                }
				else if (messages[i].measurementId === 4174) {
					ngsild_payload[0].interval = ngsildInstance(messages[i].measurementValue, time, 'MIN', 'Raw');
                }
            }
        }
    }
    return ngsild_payload;
}

function main() {
    var fport = process.argv[2];
    var bytes = Uint8Array.from(Buffer.from(process.argv[3], 'hex'));
    var time = process.argv[4];
	var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    var decoded = Decode(fport, bytes);
	var ngsild_payload = ngsildWrapper(decoded, time, entity_id);
    process.stdout.write(JSON.stringify(ngsild_payload));
}

if (require.main === module) {
    main();
}