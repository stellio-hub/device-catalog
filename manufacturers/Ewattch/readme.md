This repository contains LoRaWAN decoders and NGSI-LD wrappers for eWattch devices.
It is based on [javascript decoders](https://ewattch-documentation.com/?page_id=540) as provided by eWattch

These decoders have been modified for *current* and *cun=rrentyIndex* measurements so that results are rendered in **A** rather than **mA**.

The NGSI-LD wrapping is configured through the mappings *UnitCorresponder* and *AttributeCorresponder* defined in *ngsi-ld.js*.
Only parameters declared in *AttributeCorresponder* are mapped into a NGSI-LD payload

When a device includes different sensors measuring tre same physical quantity (e.g. currents being measured by several clamps in a squid), the uuid of the measure is inserted in the dataSetID. Thus *urn:ngsi-ld:Dataset:Raw* is replaced by *urn:ngsi-ld:Dataset:clamp_s0_c2:Raw*
