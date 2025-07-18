import json
import sys

def ngsild_instance(value, time=None, unit_code=None, dataset_id=None):
    ngsild_instance = {
        "type": "Property",
        "value": value,
        **({"observedAt": time} if time is not None else {}),
        **({"unitCode": unit_code} if unit_code is not None else {}),
        **({"datasetId": dataset_id} if dataset_id is not None else {})
    }
    return ngsild_instance

def add_to_payload(payload, key, value, entity_id, entity_type):
        only_this_id = [d for d in payload if d['id'] == entity_id]
        if all(key in d for d in only_this_id):
            payload.append({"id": entity_id, "type": entity_type, key: value})
        else:
            for d in payload:
                if d['id'] == entity_id and key not in d:
                    d[key] = value
                    break

def flow_mapping(mapping_entities, source_payload):
    output = []
    for mapping in mapping_entities:
        attributes_to_map = mapping['attributesToMap'] if type(mapping['attributesToMap']) is list else [mapping['attributesToMap']]
        ngsild_payload = []
        for item in source_payload:
            for key in item:
                for attrs in attributes_to_map:
                    if key == attrs['value']:
                        attribute = item[key] if type(item[key]) is list else [item[key]]
                        for dataset in attribute:
                            if ("datasetId" in dataset and attrs['sourceDatasetId']['value'] == dataset['datasetId']) or ("datasetId" not in dataset and attrs['sourceDatasetId']['value'] == "@none"):
                                add_to_payload(ngsild_payload, attrs['attribute']['value'], ngsild_instance(dataset['value'], dataset.get('observedAt'), dataset.get('unitCode'), attrs['targetDatasetId']['value']), attrs['hasTargetEntity']['object'], attrs['targetEntityType']['value'])
        if ngsild_payload != []:
            output.append({"payload": ngsild_payload, "context": mapping['context']['value']})
    return output

def main():
    inc = json.load(sys.stdin)
    source_payload = source_payload = inc[0]['sourcePayload'] if type(inc[0]['sourcePayload']) is list else [inc[0]['sourcePayload']]
    out = flow_mapping(inc, source_payload)
    json.dump(out, sys.stdout, indent=4)

if __name__ == "__main__":
    main()