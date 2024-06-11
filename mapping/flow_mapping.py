import json
import sys

def flow_mapping(mapping_entities, source_payload):
    output = []
    for mapping in mapping_entities:
        payloads = []
        maps = mapping['attributesToMap'] if type(mapping['attributesToMap']) is list else [mapping['attributesToMap']]
        for key in source_payload:
            for map in maps:
                valid_payload = False
                if key == map['value']:
                    attribute = source_payload[key] if type(source_payload[key]) is list else [source_payload[key]]
                    for dataset in attribute:
                        if ("datasetId" in dataset and map['sourceDatasetId']['value'] == dataset['datasetId']) or ("datasetId" not in dataset and map['sourceDatasetId']['value'] == "@none"):
                            payload = {
                                "id": map['hasTargetEntity']['object'],
                                "type": map['targetEntityType']['value'],
                                map['attribute']['value']: dataset.copy()
                            }
                            payload[map['attribute']['value']]['datasetId'] = map['targetDatasetId']['value']
                            if 'instanceId' in payload[map['attribute']['value']]:
                                del payload[map['attribute']['value']]['instanceId']
                            valid_payload = True
                if valid_payload:
                    payloads.append(payload)
        if payloads != []:
            output.append({"payload": payloads, "context": mapping['context']['value']})
    return output

def main():
    input = json.load(sys.stdin)
    source_payload = input[0]['sourcePayload']
    output = flow_mapping(input, source_payload)
    json.dump(output, sys.stdout, indent=4)

if __name__ == "__main__":
    main()
  