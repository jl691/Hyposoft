import { assetRef, racksRef, modelsRef, usersRef, firebase } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as assetIDutils from './assetidutils'

//Toast message at the front end level


function validatePowerConnections(powerConnections, PDUs, model, callback) {
    //Both L/R and port number are filled out (no empty fields)
//Port number is 1-24
//Assuming all or nothing. If an asset has 2 power ports, can't just plug one in
//That the number of power ports connected does not exceed the number on the model 
// ^^ Do something on frontend to limit num times you can add connection

//If all the fields are empty, then 'No connection' (see superscript 7 in requirements). use callback or promise apprpriately
//call checkConflicts


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


}

export{
    validatePowerConnections,
    autofillPowerConnections,
    checkConflicts,
    addConnections,
}