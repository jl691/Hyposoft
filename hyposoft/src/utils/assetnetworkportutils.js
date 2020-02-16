import { assetRef, racksRef, modelsRef, usersRef, firebase } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as userutils from './userutils'
import * as assetIDutils from './assetidutils'

//TODO: ethernetPorts --> networkPorts 



//these fields come from the form being filled out
function validateNetworkConnections(thisModelName, networkPortConnections) {
    //Check for all empty or all filled fields
    //OTHERASSETID CAN BE EMPTY
    //The port needs to exist (so on this and other asset). Autcomplete picklist should help with this, but still need to throw correct error

    let numConnectionsMade = networkPortConnections.length
    let mostPossibleConnections = 0;


    return new PromiseRejectionEvent((resolve, reject) => {
        // Will check if port exists after checking all fields have been filled
        for (let i = 0; i < numConnectionsMade; i++) {

            networkPortConnections[i].map((otherAssetID, otherPort, thisPort) => {
                //Partially filled out is not okay
                if(otherAssetID.trim !== "" || otherPort.trim() === "" && thisPort.trim() === ""){
                    //reject

                }
                //All of the fields have been filled in
                else if (otherAssetID.trim !== "" && otherPort.trim() !== "" && thisPort.trim() !== "") {

                    modelsRef.doc().where("modelName", "===", thisModelName).get().then(function (thisModelDoc) {
                        console.log(thisModelDoc.ethernetPorts)
                        //Number of ports on the model that you are trying to add an asset of
                        let numThisModelPorts = thisModelDoc.ethernetPorts;

                        //Getting the number of ethernet ports from the asset trying to connect to
                        assetRef.doc(parseInt(otherAssetID)).get().then(function (docRef) {
                            let otherModel = docRef.model
                            console.log(otherModel)

                            modelsRef.doc().where("modelName", "===", otherModel).get().then(function (otherModelDoc) {

                                let numOtherModelPorts = otherModelDoc.ethernetPorts
                                console.log(numThisModelPorts)
                                console.log(numOtherModelPorts)
                                //Math.min with a null, null is treated as 0
                                mostPossibleConnections = Math.min(numThisModelPorts, numOtherModelPorts)
                                //https://javascript.info/comparison

                                if (numConnectionsMade > mostPossibleConnections) {
                                    if (mostPossibleConnections) {
                                        reject("Making too many network connections. The most connections you can make between existing hardware is " + mostPossibleConnections)

                                    }
                                    else {
                                        reject("Cannot make network connections. There are no ethernet ports on one or both assets.")

                                    }
                                }
                            })
                        })
                    })
                }
                else {
                    //none of the fields filled out
                    //resolve
                }

                //SHIFT: if filled, if else empty, else partial
            })
        }
    })


}

function checkNetworkPortConflicts(otherAsset, networkPortConnections) {
    //No doubly connected ports on this (see networkPortConns) and other asset
    //The error message ^ must be specific: “can’t connect host1 port e1 to switch1 port 22; that port is already connected to host5 port e1”).


}

//Call this addAsset. Need to pass in these two things though
function addNetworkPortConnections(networkPortConnections, otherAsset) {
    //Make sure connections are symmetric. Meaning the other asset should have their network port connectiosn updated too

}

export {
    validateNetworkConnections,
    checkNetworkPortConflicts,
    addNetworkPortConnections,

}