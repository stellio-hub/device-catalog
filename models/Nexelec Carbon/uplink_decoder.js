// v3 to v4 compatibility wrapper
function decodeUplink(input) {
    return {
            data: Decode(input.fPort, input.bytes, input.variables)
    };
}

function encodeDownlink(input) {
    return {
            bytes: Encode(input.fPort, input.data, input.variables)
    };
}

// Decode decodes an array of bytes into an object.
//  - fPort contains the LoRaWAN fPort number
//  - bytes is an array of bytes, e.g. [225, 230, 255, 0]
//  - variables contains the device variables e.g. {"calibration": "3.5"} (both the key / value are of type string)
// The function must return an object, e.g. {"temperature": 22.5}
function Decode(fPort, bytes, variables) {
var hex2=[];
var decode=[];
var string_bin="";
var tab_bin=[];
var string_bin_elements="";
var buffer=[];
var i=0;
var j=0;

// Mise en forme de la payload propre à TTN

for(i=0;i<bytes.length;i++){ // conversion d'hexa à binaire de tous les bytes puis regroupement sous un seul string
 string_bin_elements=bytes[i].toString(2);
 if(string_bin_elements.length<8){ // PadStart
   var nb_zeros=8-string_bin_elements.length;
   for (j=0;j<nb_zeros;j++){
     string_bin_elements="0"+string_bin_elements;
   }
 }
 string_bin=string_bin+string_bin_elements;
}

var compte=0;
for(i=0;i<2*bytes.length;i++){
 buffer[i]="";

for( j=0;j<4;j++){ // tableau contenant un hexa de la payload par adresse

 buffer[i]=buffer[i]+string_bin.charAt(compte);
 compte++;
 }
 buffer[i]=parseInt(buffer[i],2);
}



// Décodage

var Insafe_Carbon_LoRa=0x7;

switch(buffer[0]){

case Insafe_Carbon_LoRa:
    decode[0]={"Type_of_Product":"Insafe_Carbon_LoRa"};
    break;


}



if (buffer[0]==Insafe_Carbon_LoRa){


    // On crée les différents tableaux correspondant à la taille de chaque data en terme de  bits

    var tab_decodage_Real_Time=[4,4,8,8,8,3,4,3,3,3,3,2,3];  // Exemple: la 2ème information donc [1] est codée sur 4 bits
    var tab_decodage_Product_Status_Message=[4,4,2,1,3,2,8,8,6,4,5,5,6,6];
    var tab_decodage_Push=[4,4,3,3,2];
    var tab_decodage_Datalog=[4,4,8,8,8,8,8,8,8,8,8,4,3,1];
    var tab_decodage_Temperature_Alert=[4,4,8,1,1,3,3];
    var tab_decodage_CO2_Alert=[4,4,8,3,1,1,3];
    var tab_decodage_Config_CO2=[4,4,8,8,6,6,6,6,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,8];
    var tab_decodage_Config_General=[4,4,1,1,1,1,1,1,1,1,8,8,8,8,8,8,8,8,2,6];
    var tab_decodage_Keepalive=[4,4];


    // On initialise les différents type de message pour les Carbon

    var Type_Real_Time= 0x2;
    var Type_Product_Status_Message=0x3;
    var Type_Push= 0x4;
    var Type_Datalog=0x5;
    var Type_Temperature_Alert=0x6;
    var Type_CO2_Alert=0x7;
    var Type_Config_CO2=0x8;
    var Type_Config_General=0x9;
    var Type_Keep_Alive=0xA;

    //Tous les indicateurs sont codés de la même manière pour coder plus efficacement on crée un tableau
    // qui contient tous ces adjectifs


    var tab_adjectif=["Excellent","Good","Fair","Poor","Bad","Erreur","All","Dryness Indicator","Mould Indicator","Dust Mites Indicator","CO","CO2"];



    // Avec buffer[1], on détermine le Type de Message
    switch(buffer[1]){
    case Type_Real_Time:
            tab_decode(tab_decodage_Real_Time); //(VOIR EN FIN DE PROGRAMME) On passe le tableau correspondant au message dans la fonction tab_decode, cette fonction renvoie tab_bin.
            decode[1]={"Type_of_message":"Real_Time"};
            decode[2]={"CO2_concentration": 20*tab_bin[2]};
            decode[3]={"Temperature": Math.round(0.2*tab_bin[3] * 10) / 10};
            decode[4]={"Relative_Humidity": 0.5*tab_bin[4]};
            decode[5]={"IAQ_GLOBAL":get_iaq(tab_bin[5])};
            decode[6]={"IAQ_SRC":get_iaq_SRC(tab_bin[6])};
            decode[7]={"IAQ_CO2":get_iaq(tab_bin[7])};
            decode[8]={"IAQ_DRY":get_iaq(tab_bin[8])};
            decode[9]={"IAQ_MOULD":get_iaq(tab_bin[9])};
            decode[10]={"IAQ_DM":get_iaq(tab_bin[10])};
            decode[11]={"IAQ_HCI":get_IAQ_HCI(tab_bin[11])};
            decode[12]={"Frame_Index":tab_bin[12]};

            break;

    case Type_Product_Status_Message:
            tab_decode(tab_decodage_Product_Status_Message);
            decode[1]={"Type_of_message":"Product_Status_Message"};
            decode[2]={"Battery_level":battery(tab_bin[2])};
            decode[3]={"HW_Fault_mode":hw_mode(tab_bin[3])};
            decode[4]={"Frame_Index":tab_bin[4]};
            decode[5]={"Not_used":""};
            decode[6]={"Product_hours_meter_per_month":tab_bin[6]};
            decode[7]={"CO2_autocalibration_value_ppm": 20*tab_bin[7]};
            decode[8]={"Product_RTC_date_since_2000_in_years": tab_bin[8]};
            decode[9]={"Product_RTC_date_Month_of_the_year":tab_bin[9]};
            decode[10]={"Product_RTC_date_Day_of_the_month":tab_bin[10]};
            decode[11]={"Product_RTC_date_Hours_of_the_day":tab_bin[11]};
            decode[12]={"Product_RTC_date_Minutes_of_the_hour":tab_bin[12]};
            decode[13]={"Not_used":""};
            break;

    case Type_Push:
            tab_decode(tab_decodage_Push);
            decode[1]={"Type_of_message":"Push"};
            decode[2]={"Push_Button_Action": push_button(tab_bin[2])};
            decode[3]={"Frame_Index":tab_bin[3]};
            decode[4]={"Not_used":""}
            break;

    case Type_Datalog:
            tab_decode(tab_decodage_Datalog);
            decode[1]={"Type_of_message":"Datalog"};
            decode[2]={"CO2_concentration_n-2": 20*tab_bin[2]};
            decode[3]={"Temperature_n-2": Math.round(0.2*tab_bin[3] * 10) / 10};
            decode[4]={"Relative_Humidity_n-2": 0.5*tab_bin[4]};
            decode[5]={"CO2_concentration_n-1": 20*tab_bin[5]};
            decode[6]={"Temperature_n-1": Math.round(0.2*tab_bin[6] * 10) / 10};
            decode[7]={"Relative_Humidity_n-1": 0.5*tab_bin[7]};
            decode[8]={"CO2_concentration_n": 20*tab_bin[8]};
            decode[9]={"Temperature_n": Math.round(0.2*tab_bin[9] * 10) / 10};
            decode[10]={"Relative_Humidity_n": 0.5*tab_bin[10]};
            decode[11]={"Time_between_measurements_in_minutes": 10*tab_bin[11]};
            decode[12]={"Frame_Index":tab_bin[12]};
            decode[13]={"Not_used":""};
            break;

    case Type_Temperature_Alert:
            tab_decode(tab_decodage_Temperature_Alert);
            decode[1]={"Type_of_message":"Temperature_Alert"};
            decode[2]={"Temperature": Math.round(0.2*tab_bin[2] * 10) / 10};
            decode[3]={"Temperature_threshold_1":th(tab_bin[3])};
            decode[4]={"Temperature_threshold_2":th(tab_bin[4])};
            decode[5]={"Frame_Index":tab_bin[5]};
            decode[6]={"Not_used":""};
            break;

    case Type_CO2_Alert:
            tab_decode(tab_decodage_CO2_Alert);
            decode[1]={"Type_of_message":"CO2_Alert"};
            decode[2]={"CO2_concentration": 20*tab_bin[2]};
            decode[3]={"Frame_Index":tab_bin[3]};
            decode[4]={"CO2_threshold_1":th(tab_bin[4])};
            decode[5]={"CO2_threshold_2":th(tab_bin[5])};
            decode[6]={"Not_used":""};
            break;

    case Type_Config_CO2:
            tab_decode(tab_decodage_Config_CO2);
            decode[1]={"Type_of_message":"Config_CO2"};
            decode[2]={"CO2_threshold_1":20*tab_bin[2]};
            decode[3]={"CO2_threshold_2":20*tab_bin[3]};
            decode[4]={"Smart_Period_1_start_at_in_hour":0.5*tab_bin[4]};
            decode[5]={"Smart_Period_1_duration_in_hour":0.5*tab_bin[5]};
            decode[6]={"Smart_Period_2_start_at_in_hour":0.5*tab_bin[6]};
            decode[7]={"Smart_Period_2_duration_in_hour":0.5*tab_bin[7]};
            decode[8]={"Smart_Period_1": active(tab_bin[8])};
            decode[9]={"Smart_Period_1_on_Monday": active(tab_bin[9])};
            decode[10]={"Smart_Period_1_on_Tuesday": active(tab_bin[10])};
            decode[11]={"Smart_Period_1_on_Wednesday": active(tab_bin[11])};
            decode[12]={"Smart_Period_1_on_Thursday": active(tab_bin[12])};
            decode[13]={"Smart_Period_1_on_Friday": active(tab_bin[13])};
            decode[14]={"Smart_Period_1_on_Saturday": active(tab_bin[14])};
            decode[15]={"Smart_Period 1_on_Sunday": active(tab_bin[15])};
            decode[16]={"Smart_Period_2": active(tab_bin[16])};
            decode[17]={"Smart_Period_2_on_Monday": active(tab_bin[17])};
            decode[18]={"Smart_Period_2_on_Tuesday": active(tab_bin[18])};
            decode[19]={"Smart_Period_2_on_Wednesday": active(tab_bin[19])};
            decode[20]={"Smart_Period_2_on_Thursday": active(tab_bin[20])};
            decode[21]={"Smart_Period_2_on_Friday": active(tab_bin[21])};
            decode[22]={"Smart_Period_2_on_Saturday": active(tab_bin[22])};
            decode[23]={"Smart_Period_2_on_Sunday": active(tab_bin[23])};
            decode[24]={"Altitude":50*tab_bin[24]};

            break;

    case Type_Config_General:
            tab_decode(tab_decodage_Config_General);
            decode[1]={"Type_of_message":"Config_General"};
            decode[2]={"LED_blink": active(tab_bin[2])};
            decode[3]={"Button_Notification": active(tab_bin[3])};
            decode[4]={"Real-time_data": active(tab_bin[4])};
            decode[5]={"Datalog_enable": active(tab_bin[5])};
            decode[6]={"Temperature_Alert": active(tab_bin[6])};
            decode[7]={"CO2_Alert": active(tab_bin[7])};
            decode[8]={"Keep_Alive": active(tab_bin[8])};
            decode[9]={"Orange_Led":active(tab_bin[9])};
            decode[10]={"Period_between_measurements_CO2_temperature_humidity_minutes": tab_bin[10]};
            decode[11]={"Datalog_decimation_factor_record_only_1_on_x_samples)":tab_bin[11]};
            decode[12]={"Temperature_alert_threshold_1": 0.2*tab_bin[12]};
            decode[13]={"Temperature_alert_threshold_2": 0.2*tab_bin[13]};
            decode[14]={"Temperature_change_leading_to_a_real-time_message_transmission": 0.1*tab_bin[14]};
            decode[15]={"Relative_humidity_change_leading_to_a_real-time message_transmission": 0.5*tab_bin[15]};
            decode[16]={"CO2_concentration_change_leading_to_a_realtime message_transmission": 20*tab_bin[16]};
            decode[17]={"Keepalive_period (h)": tab_bin[17]};
            decode[18]={"NFC_status":nfc_status(tab_bin[18])};
            decode[19]={"Not_Used":""};

            break;

    case Type_Keep_Alive:
            decode[1]={"Type_of_message":"Keep_Alive"};
            break;
    }


}





var new_msg={payload:decode};
return new_msg;


function tab_decode (tab){ // on rentre en paramètre la table propre à chaque message

    var compteur=0;

    for ( i=0; i<tab.length;i++){  // tab.length nousdonne donc le nombre d'information à décoder pour ce message

            tab_bin[i]="";
            for ( j=0; j<tab[i];j++){ // tab[i] nous donne le nombre de bits sur lequel est codée l'information i

                    str1=string_bin.charAt(compteur); // compteur va aller de 0 jusqu'à la longueur de string_bin
                    tab_bin[i]=tab_bin[i]+str1;       // A la fin de ce deuxième for: tab_bin[i] sera composé de tab[i] bits
                    compteur++;
            }

            // Problème si tab[i] bits est différent de 4 (ou 8) bits ca ne correspond à 1 (ou 2) hexa donc:  ne pourra pas conrrectement convertir les binaires en hexa
            // Donc  il faut qu'on fasse un bourrage de 0 grâce à padstart
            if (tab_bin[i].length>4){ // pour les données de tailles supérieures à 4 bits et inféireures ou égales à 8 bits

                    //tab_bin[i]=tab_bin[i].padStart(8,'0');
                    tab_bin[i]=parseInt(tab_bin[i] , 2).toString(16).toUpperCase(); // Puis on convertit les binaire en hexa (en string)
                    tab_bin[i]=parseInt(tab_bin[i],16) ;//puis on convertit les string en int

            }

            else{ // pour les données de tailles inférieures ou égales à 4 bits

                    //tab_bin[i]=tab_bin[i].padStart(4,'0');
                    tab_bin[i]=parseInt(tab_bin[i] , 2).toString(16).toUpperCase();
                    tab_bin[i]=parseInt(tab_bin[i], 16);
            }
    }
}


function get_iaq (a){

    var result="";
    switch(a){


    case 0:
            result=tab_adjectif[0];
            break;

    case 1:
            result=tab_adjectif[1];
            break;

    case 2:
            result=tab_adjectif[2];
            break;

    case 3:
            result=tab_adjectif[3];
            break;

    case 4:
            result=tab_adjectif[4];
            break;

    case 5:
            result=tab_adjectif[5];
            break;

    }
    return result;
}

function get_iaq_SRC(a){

    var result="";

    switch(a){
    case 0:
            result=tab_adjectif[6];
            break;

    case 1:
            result=tab_adjectif[7];
            break;

    case 2:
            result=tab_adjectif[8];
            break;

    case 3:
            result=tab_adjectif[9];
            break;

    case 4:
            result=tab_adjectif[10];
            break;

    case 5:
            result=tab_adjectif[11];
            break;

    case 15:

            result=tab_adjectif[5];
            break;
    }
    return result;
}


function get_IAQ_HCI(a){
    var result="";
    switch(a){

    case 0:
            result=tab_adjectif[1];
            break;

    case 1:
            result=tab_adjectif[2];
            break;

    case 2:
            result=tab_adjectif[4];
            break;

    case 3:
            result=tab_adjectif[5];
            break;


    }
    return result;
}




// C'est la fonction la plus importante du programme

function tab_decode (tab){ // on rentre en paramètre la table propre à chaque message


    var compteur=0;

    for ( i=0; i<tab.length;i++){  // tab.length nousdonne donc le nombre d'information à décoder pour ce message

            tab_bin[i]="";
            for ( j=0; j<tab[i];j++){ // tab[i] nous donne le nombre de bits sur lequel est codée l'information i

                    str1=string_bin.charAt(compteur); // compteur va aller de 0 jusqu'à la longueur de string_bin
                    tab_bin[i]=tab_bin[i]+str1;       // A la fin de ce deuxième for: tab_bin[i] sera composé de tab[i] bits
                    compteur++
            }

            // Problème si tab[i] bits est différent de 4 (ou 8) bits ca ne correspond à 1 (ou 2) hexa donc:  ne pourra pas conrrectement convertir les binaires en hexa
            // Donc  il faut qu'on fasse un bourrage de 0 grâce à padstart
            if (tab_bin[i].length>4){ // pour les données de tailles supérieures à 4 bits et inféireures ou égales à 8 bits
                    var nb_zeros=8-tab_bin[i].length;
   for (j=0;j<nb_zeros;j++){
     tab_bin[i]="0"+tab_bin[i];
   }

                    tab_bin[i]=parseInt(tab_bin[i] , 2).toString(16).toUpperCase(); // Puis on convertit les binaire en hexa (en string)
                    tab_bin[i]=parseInt(tab_bin[i],16) //puis on convertit les string en int

            }

            else{ // pour les données de tailles inférieures ou égales à 4 bits
                    var nb_zeros=8-tab_bin[i].length;
                    for (j=0;j<nb_zeros;j++){
     tab_bin[i]="0"+tab_bin[i];
   }


                    tab_bin[i]=parseInt(tab_bin[i] , 2).toString(16).toUpperCase();
                    tab_bin[i]=parseInt(tab_bin[i], 16);
            }
    }

    return tab_bin;

}


function battery(a){
    result="";
    switch(a){
    case 0:
            result="High";
            break;
    case 1:
            result="Medium";
            break;
    case 2:
            result="Critical";
            break;
    }
    return result;
}


function hw_mode(a){
    result="";
    switch(a){
    case 0:
            result=" non activated";
            break;
    case 1:
            result=" activated";
            break;
    }
    return result;
}

function push_button(a){
    result="";
    switch(a){
    case 0:
            result="Short Push";
            break;

    case 1:
            result="Long Push";
            break;

    case 2:
            result="Multiple Push(x3)";
            break;

    case 3:
            result="Multiple Push(x6)";
            break;
    }

    return result;
}

function th(a){
    result="";
    switch(a){
    case 0:
            result="not reached";
            break;


    case 1:
            result="reached";
            break;
    }

    return result;
}

function active(a){
    result="";
    switch(a){
    case 0:
            result="Non-Active";
            break;
    case 1:
            result="Active";
    }
    return result;
}

function nfc_status(a)
{
result="";
    switch(a){
    case 0:
            result="Discoverable";
            break;
    case 1:
            result="Not_Discoverable";
    }
    return result;
}

msg.payload=decode;
return msg;

}

function parseISOString(s) {
        var b = s.split(/\D+/);
        return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
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

function ngsildWrapper(input, time) {
    var payload = {}
    for (let i = 0; i < input.payload.length; i++) {
        Object.assign(payload, input.payload[i])
    }
    if (payload.Type_of_message === 'Real_Time') {
        var ngsild_payload = {
            co2: ngsildInstance(payload.CO2_concentration, time, '59', 'Raw'),
            temperature: ngsildInstance(payload.Temperature, time, 'CEL', 'Raw'),
            humidity: ngsildInstance(payload.Temperature, time, 'P1', 'Raw'),
            indorAirQuality: [
                ngsildInstance(payload['IAQ_GLOBAL'], time, null, 'Global'),
                ngsildInstance(payload['IAQ_CO2'], time, null, 'co2'),
                ngsildInstance(payload['IAQ_DRY'], time, null, 'Drought_index'),
                ngsildInstance(payload['IAQ_MOULD'], time, null, 'Mold_index'),
                ngsildInstance(payload['IAQ_DM'], time, null, 'Mite_index'),
                ngsildInstance(payload['IAQ_HCI'], time, null, 'Hygrothermal_comfort')
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

function main() {
        var fport = process.argv[2];
        var bytes = Uint8Array.from(Buffer.from(process.argv[3], 'hex'));
        var time = process.argv[4];
        var decoded = Decode(fport, bytes);
        var ngsild_payload = ngsildWrapper(decoded, time);
        process.stdout.write(JSON.stringify(ngsild_payload));
}

if (require.main === module) {
        main();
}
