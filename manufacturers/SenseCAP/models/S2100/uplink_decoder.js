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
    if (bytes.length!==11 && bytes.length!==15 && bytes.length!==22 && bytes.length!==32 && bytes.length!==33) {
        decoded['valid'] = false;
        decoded['err'] = -2; // "length check fail."
        return {
            data: decoded
        };
    }
	
	var measNum = bytes[1]
	var meas_list = [];
	if(bytes.length===11)
	{
		meas_list.push(((bytes[3] << 24) + (bytes[4] << 16) + (bytes[5] << 8) + bytes[6])/1000);
		if(measNum===18)
		{
			meas_list.push(((bytes[7] << 24) + (bytes[8] << 16) + (bytes[9] << 8) + bytes[10])/1000);
		}
	}
	else if(bytes.length===22)
	{
		meas_list.push(((bytes[3] << 24) + (bytes[4] << 16) + (bytes[5] << 8) + bytes[6])/1000);
		meas_list.push(((bytes[7] << 24) + (bytes[8] << 16) + (bytes[9] << 8) + bytes[10])/1000);
		meas_list.push(((bytes[14] << 24) + (bytes[15] << 16) + (bytes[16] << 8) + bytes[17])/1000);
		var measNum4 = bytes[12]
		if(measNum4===52)
		{
			meas_list.push(((bytes[18] << 24) + (bytes[19] << 16) + (bytes[20] << 8) + bytes[21])/1000);
		}
	}
	else if(bytes.length===32)
	{
		meas_list.push(((bytes[3] << 24) + (bytes[4] << 16) + (bytes[5] << 8) + bytes[6])/1000);
		meas_list.push(((bytes[7] << 24) + (bytes[8] << 16) + (bytes[9] << 8) + bytes[10])/1000);
		meas_list.push(((bytes[13] << 24) + (bytes[14] << 16) + (bytes[15] << 8) + bytes[16])/1000);
		meas_list.push(((bytes[17] << 24) + (bytes[18] << 16) + (bytes[19] << 8) + bytes[20])/1000);
		meas_list.push(((bytes[24] << 24) + (bytes[25] << 16) + (bytes[26] << 8) + bytes[27])/1000);
		var measNum6 = bytes[22]
		if(measNum6===86)
		{
			meas_list.push(((bytes[28] << 24) + (bytes[29] << 16) + (bytes[30] << 8) + bytes[31])/1000);
		}
	}
	else if(bytes.length===33)
	{
		meas_list.push(((bytes[3] << 24) + (bytes[4] << 16) + (bytes[5] << 8) + bytes[6])/1000);
		meas_list.push(((bytes[7] << 24) + (bytes[8] << 16) + (bytes[9] << 8) + bytes[10])/1000);
		meas_list.push(((bytes[14] << 24) + (bytes[15] << 16) + (bytes[16] << 8) + bytes[17])/1000);
		meas_list.push(((bytes[18] << 24) + (bytes[19] << 16) + (bytes[20] << 8) + bytes[21])/1000);
		meas_list.push(((bytes[25] << 24) + (bytes[26] << 16) + (bytes[27] << 8) + bytes[28])/1000);
		var measNum6 = bytes[23]
		if(measNum===86)
		{
			meas_list.push(((bytes[29] << 24) + (bytes[30] << 16) + (bytes[31] << 8) + bytes[32])/1000);
		}
	}
	else if(bytes.length===15)
	{
		meas_list.push(bytes[1]);
	}
	
	for(var i = 0; i<meas_list.length; i++)
	{
		if(bytes.length===15){
			decoded.messages.push({
				type: 'report_telemetry',
				measurementId: 6,
				measurementValue: meas_list[i]
			});
		}
		else{
			decoded.messages.push({
				type: 'report_telemetry',
				measurementId: i,
				measurementValue: meas_list[i]
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
				if(messages[i].measurementId === 0) {
					ngsild_payload[0].value1 = ngsildInstance(messages[i].measurementValue, time, null, 'Raw');
				}
                else if (messages[i].measurementId === 1) {
					ngsild_payload[0].value2 = ngsildInstance(messages[i].measurementValue, time, null, 'Raw');
                }
				else if (messages[i].measurementId === 2) {
					ngsild_payload[0].value3 = ngsildInstance(messages[i].measurementValue, time, null, 'Raw');
                }
				else if (messages[i].measurementId === 3) {
					ngsild_payload[0].value4 = ngsildInstance(messages[i].measurementValue, time, null, 'Raw');
                }
				else if (messages[i].measurementId === 4) {
					ngsild_payload[0].value5 = ngsildInstance(messages[i].measurementValue, time, null, 'Raw');
                }
				else if (messages[i].measurementId === 5) {
					ngsild_payload[0].value6 = ngsildInstance(messages[i].measurementValue, time, null, 'Raw');
                }
				else if (messages[i].measurementId === 6) {
					ngsild_payload[0].battery = ngsildInstance(messages[i].measurementValue, time, 'P1', 'Raw');
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