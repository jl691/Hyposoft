import { modelsRef } from './firebaseutils'



function getNetworkPortLabels(model, callback) {
    let modelNetworkPorts;

    modelsRef.where("modelName", "==", model).get().then(function (modelDoc) {
        if(!modelDoc.empty){ 
            modelNetworkPorts = modelDoc.docs[0].data().networkPorts
            callback(modelNetworkPorts);
        }
        else{
            callback(null)
        }
       
    }).catch(error=>console.log(error))

}

//Puts the MAC address into canonical form: lower case and colon-delimited
function fixMACAddress(mac) {
    let noSepMac;
    if (mac.charAt(2) === "-") {
        noSepMac = mac.split("-").join("");

    } else if (mac.charAt(2) === "_") {
        noSepMac = mac.split("_").join("");
    }
    else {//if the admin put in a mac address with no separators
        noSepMac = mac;
    }

    let canonicalMAC = noSepMac.substr(0, 2).toLowerCase() + ":" + noSepMac.substr(2, 2).toLowerCase() + ":" + noSepMac.substr(4, 2).toLowerCase() + ":" + noSepMac.substr(6, 2).toLowerCase() + ":" + noSepMac.substr(8, 2).toLowerCase() + ":" + noSepMac.substr(10, 2).toLowerCase();
    console.log("Canonical MAC: " + canonicalMAC)
    return canonicalMAC;
}

//TODO: NEED TO FIX THIS SINCE IT USES STATE
//toLowercase, to colon
function handleMacAddressFixAndSet(event) {

    let fixedMAC = "";
    if (this.state.macAddress && !/^([0-9a-f]{2}[:]){5}([0-9a-f]{2})$/.test(this.state.macAddress)) {
        fixedMAC = this.fixMACAddress(this.state.macAddress);

    } else if (this.state.macAddress) {
        fixedMAC = this.state.macAddress;
    }
    //RACE CONDITION: i think it's not setting the state before calling this.state.macAddress in addAsset()
    this.setState({ macAddress: fixedMAC })

    console.log("MAC address passed to database: " + fixedMAC)
    console.log(this.state.networkConnections)


}

export {
    getNetworkPortLabels,
    fixMACAddress,
    handleMacAddressFixAndSet,

}