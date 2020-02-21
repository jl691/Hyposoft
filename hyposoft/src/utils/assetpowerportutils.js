import { assetRef, racksRef, modelsRef, usersRef, firebase } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as assetIDutils from './assetidutils'

//Toast message at the front end level


function validatePowerConnections(powerConnections, PDUs, model, callback) {
//Assuming all or nothing. If an asset has 2 power ports, can't just plug one in
//Validate that the PDU is free at the location: call checkConflicts in this method

    for(let i =0; i < powerConnections.length; i++){
        let pduSide=powerConnections[i];
        let port=powerConnections[i];

        if(pduSide.trim()==="" && port.trim()===""){
            callback(null)
        }
        else if(pduSide.trim() !== "" && port.trim() !==""){

            modelsRef.where("modelName", "==", model).get().then(function (querySnapshot){
                let numPowerPorts=querySnapshot.docs[0].data().powerPorts;
                if(parseInt(port)<1 && parseInt(port)>24){
                    callback("Please enter a valid port number. Valid port numbers range from 1 to 24.")
                }
                if(powerConnections.length > numPowerPorts){
                    callback("Cannot make more power connections than the model " + model+ " allows. Can only make up to "+ numPowerPorts +" connections.")
                }





            }).catch(console.log("Could not find the model"))
            

        }
        else{
            callback("To make a power connection, must fill out all fields.")
        }


    }

}

function autofillPowerConnections(modelNumPorts, callback) {
    //If the model has 2 power ports, then the form should already be filled out: port 1 gets the left, topmost available,
    //And right needs to match the port number
    //^^How to extend the above to 8 ports?


}

function checkConflicts(powerConnections, PDUs){
    //No 'double connections': no PDU has more than one power port associated with it: conflicts/availability

}

//Call this in assetutils: addAsset()
//Need to add a powerConnections field to addAsset(0)
function addConnections(powerConnections){
    //validatePowerConnections
    //if there are 2 power ports (extend to more than 2), need to make symmetric connections
    //If it's right, plae it there (single port)
      //if left and port specficied, place there(single port)
    //If there are 2 power ports, find the first available spot on PDU on left and match on right. Keep moving down PDU if needed
  



}

export{
    validatePowerConnections,
    autofillPowerConnections,
    checkConflicts,
    addConnections,
}