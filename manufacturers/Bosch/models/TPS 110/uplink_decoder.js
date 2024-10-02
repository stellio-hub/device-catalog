// Decoders and NGSI-LD wrappers to be inserted
function decodeUplink(fport, time, input, entity_id) {
	var data = {
		id: entity_id,
		type: "Device"
	};
	let value = '';
	let debugCodes = [];
	let dataset_suffix = "Raw"
	switch (fport) {
		case 1: // Parking status
			value = (input[0] & 0x1) === 0x1;
			data.occupied = ngsildInstance(value, time, null, dataset_suffix)
			return data
			break;

		case 2: // Heartbeat
			value = (input[0] & 0x1) === 0x1;
			data.occupied = ngsildInstance(value, time, null, dataset_suffix)

			if (input.length >= 2) {
				value = input[1] & 0x80 ? input[1] - 0x100 : input[1];
			}
			data.temperature = ngsildInstance(value, time, "CEL", dataset_suffix)
			return data
			break;

		case 3: // Start-up   
			debugCodes = [];
			for (var i = 0; i <= 8; i += 4) {
				var debugCode = ((input[i + 1] & 0xf) << 8) | input[i];
				if (debugCode) {
					debugCodes.push(debugCode);
				}
			}

			data.debugCodes = ngsildInstance(debugCodes, null, null, dataset_suffix)

			data.firmwareVersion = ngsildInstance(input[12] + '.' + input[13] + '.' + input[14], null, null, dataset_suffix);

			resetCause = [
				undefined,
				'watchdog',
				'power on',
				'system request',
				'other',
			][input[15]];
			data.resetCause = ngsildInstance(resetCause, null, null, dataset_suffix)
			data.occupied = ngsildInstance((input[16] & 0x1) == 0x1, time, null, dataset_suffix);
			return data;
			break;

		case 4: // Device information
			//            data.type = 'device information';
			//            data.bytes = input;
			break;

		case 5: // Device usage
			//            data.type = 'device usage';
			//            data.bytes = input;
			break;

		case 6: // Debug
			//            data.type = 'debug';
			//            data.timestamp =
			//              (input[3] << 24) |
			//              (input[2] << 16) |
			//              (input[1] << 8) |
			//              input[0];
			//            data.debugCode = ((input[5] & 0xf) << 8) | input[4];
			//            data.sequenceNumber = (input[9] << 8) | input[8];
			break;
	}

}

function ngsildInstance(value, time = null, unit = null, dataset_suffix = null) {
	return {
		type: 'Property',
		value: value,
		...(time && { observedAt: time }),
		...(unit && { unitCode: unit }),
		...(dataset_suffix && { datasetId: `urn:ngsi-ld:Dataset:${dataset_suffix}` })
	};
}

function main() {
	// Use testMode = 1 to testwith sample payloads. Use testMode = 0 in operation.
	let testMode = 0;
	if (testMode == 1) {
		var time = '2019-09-07T15:50:00Z '
		var entity_id = "urn:ngsi-ld:Device:TEST"
		console.log("Parking status test pattern: ")
		console.log(decodeUplink(1, time, [1], entity_id)); // Parking status
		console.log("Heartbeat test pattern: ")
		console.log(decodeUplink(2, time, [0, 255], entity_id)); // Heartbeat
		console.log("Startup test pattern with debug codes 804 and 885: ")
		console.log(decodeUplink(3, time, [0x24, 3, 0, 0, 0x75, 3, 0, 0, 0, 0, 0, 0, 0, 29, 2, 3, 1], entity_id)); // Startup
		console.log("en version stringify")
		process.stdout.write(JSON.stringify(decodeUplink(3, time, [0x24, 3, 0, 0, 0x75, 3, 0, 0, 0, 0, 0, 0, 0, 29, 2, 3, 1], entity_id)));

	} else {
		var fport = process.argv[2];
		var bytes = Uint8Array.from(Buffer.from(process.argv[3], 'hex'));
		var time = process.argv[4];
		var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
		var ngsild_payload = decodeUplink(fport, time, bytes, entity_id);
		process.stdout.write(JSON.stringify(ngsild_payload));
	}
}

if (require.main === module) {
	main();
}
