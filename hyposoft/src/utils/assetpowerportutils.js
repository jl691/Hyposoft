import { assetRef, racksRef, modelsRef, usersRef, firebase } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as assetIDutils from './assetidutils'
import * as datacenterutils from './datacenterutils'

//Toast message at the front end level


function validatePowerConnections(inputDatacenter, inputRack, inputRackU, powerConnections, model, callback) {
    //Assuming all or nothing. If an asset has 2 power ports, can't just plug one in
    //Validate that the PDU is free at the location: call checkConflicts in this method
    //the PDU is made up of hpdu-dataceneterAbbrev-rackandracku+l/r

    //How to handle when the rack does not have a network managed port?? How does this affect the detailed view? Getting the status?

    for (let i = 0; i < powerConnections.length; i++) {
        let pduSide = powerConnections[i];
        let port = powerConnections[i];

        if (pduSide.trim() === "" && port.trim() === "") {
            callback(null)
            //TODO: need to signify to store a null in the DB. That way, can do a .length check to know to dispplay "no connection" in the asset detail view
        }
        else if (pduSide.trim() !== "" && port.trim() !== "") {

            modelsRef.where("modelName", "==", model).get().then(function (querySnapshot) {
                let numPowerPorts = querySnapshot.docs[0].data().powerPorts;
                if (parseInt(port) < 1 && parseInt(port) > 24) {
                    callback("Please enter a valid port number. Valid port numbers range from 1 to 24.")
                }
                if (powerConnections.length > numPowerPorts) {
                    callback("Cannot make more power connections than the model " + model + " allows. Can only make up to " + numPowerPorts + " connections.")
                }






            }).catch(console.log("Could not find the model"))


        }
        else {
            callback("To make a power connection, must fill out all fields.")
        }


    }

}

function autofillPowerConnections(modelNumPorts, callback) {
    //If the model has 2 power ports, then the form should already be filled out: port 1 gets the left, topmost available,
    //And right needs to match the port number
    //^^How to extend the above to 8 ports?


}

//everytime I add, I keep a map in the rack DB, and asset DB
function checkConflicts(inputDatacenter, inputRack, inputRackU, inputModel, pduSide, port) {
    //No 'double connections': no PDU has more than one power port associated with it: conflicts/availability
    //the PDU:is made up of hpdu-dataceneterAbbrev-rackandracku+l/r, where if rackU is single digit, needs a 0 in front of it
    //Checking for conflicts is different if there's 1 or 2 power ports
    //In addition, someone might jsut fill out "Left"

    let oppositePDUSide=""
    let numPorts = 0;
    let PDU = "hpdu"
    if (parseInt(inputRackU) < 10) {
        inputRackU = "0" + inputRackU
    }

    datacenterutils.getDataFromName(inputDatacenter, (id, abbrev) => {
        //only rtp1 has network control over PDUs, but still need to be able to add power connections for racks that don't
        // PDU=PDU+"-"+abbrev+"-"+inputRack+"-"+inputRackU+pduSide.charAt(0)
        // console.log(PDU)
        oppositePDUSide= pduSide==="Left" ? "Right" : "Left"
        modelsRef.where("modelName", "==", inputModel).get().then(function (modelDoc) {
            numPorts = modelDoc.docs[0].data().powerPorts;
            //need to split rack into letter and number
            let splitRackArray = inputRack.split(/(\d+)/).filter(Boolean)
            let rackRow = splitRackArray[0]
            let rackNum = parseInt(splitRackArray[1])


            racksRef.where("letter", "==", rackRow).where("height", "==", rackNum).where("datacenter", "==", id).get().then(function (rackConnectionsDoc) {

                //go through the rack 'powerConnections' field to see if there's a match
               


            }).catch(error => console.log(error))

        }).catch(error => console.log(error))

    })



}

//Is this method even neessary when you can jsut pass in the array directly in?
//Call this in assetutils: addAsset()
//Call this after validating
function addConnections(newID, inputModel, powerConnections) {
    //Also need to update in racks, the power connections
    let numPorts = 0;

    powerConnections.forEach(function (connection){
        modelsRef.where("modelName", "==", inputModel).get().then(function (modelDoc){
            numPorts = modelDoc.docs[0].data().powerPorts;
    
            //Already validated the ports
             //have more than one port, need to add according to the fields. The fields should default to symm connections. So instead of if, just have each connection added accordingly
            if(numPorts == 1){
                assetRef.doc(newID).set({
                    powerConnections:{
                        pduSide: connection.pduSide,
                        port: connection.port
                    }
                }, {merge: true}) //double check that this is added correctly
    
    
            }
           
        

        }).catch(error => console.log(error))



    })

}

export {
    validatePowerConnections,
    autofillPowerConnections,
    checkConflicts,
    addConnections,
}