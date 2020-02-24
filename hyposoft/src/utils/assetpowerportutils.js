import { assetRef, racksRef, modelsRef, usersRef, firebase } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as assetIDutils from './assetidutils'
import * as datacenterutils from './datacenterutils'

//Toast message at the front end level


function validatePowerConnections(inputDatacenter, inputRack, inputRackU, powerConnections, model, callback) {
    // assuming all or nothing. If an asset has 2 power ports, can't just plug one in

    //How to handle when the rack does not have a network managed port?? How does this affect the detailed view? Getting the status?

    for (let i = 0; i < powerConnections.length; i++) {
        let success = 0;
        let pduSide = powerConnections[i].pduSide;
        let port = powerConnections[i].port;

        if (pduSide.trim() === "" && port.trim() === "") {
            success++;
            if (success == powerConnections.length) {
                callback(null)
            }

            //TODO: need to signify to store a null in the DB. That way, can do a .length check to know to dispplay "no connection" in the asset detail view
        }


        //TODO: check for the right number of connections



        else if (pduSide.trim() != "" && port.trim() != "") {
            console.log("up in this bitch")

            modelsRef.where("modelName", "==", model).get().then(function (querySnapshot) {
                // let numPowerPorts = querySnapshot.docs[0].data().powerPorts;
                //FOR TESTING
                let numPowerPorts = 1

                if (parseInt(port) >= 1 && parseInt(port) <= 24) {


                    if (powerConnections.length <= numPowerPorts) {
                        //check for conflicts
                        checkConflicts(inputDatacenter, inputRack, inputRackU, model, pduSide, port, status => {
                            if (status) {
                                callback(status)
                            }
                            else {
                                success++;
                                if (success == powerConnections.length) {
                                    callback(null)
                                }
                            }

                        })

                    }
                    else {
                        callback("Cannot make more power connections than the model " + model + " allows. Can only make up to " + numPowerPorts + " connections.")

                    }

                } else {

                    callback("To make a power connection, please enter a valid port number. Valid port numbers range from 1 to 24.")

                }

            }).catch(console.log("Could not find the model"))


        }
        else {
            callback("To make a power connection, must fill out all fields.")

        }


    }

}

function getFirstFreePort(rack, datacenter, callback) { //only expecting at most 2 ports
    console.log(rack)
    let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    let freeLeft = []
    let freeRight = []
    let occupiedLeft = []
    let occupiedRight = []
    let allPorts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
    //ASSUMING THAT PDUs ONLY HAVE PORTS UP TO 24
    let returnPort = -1
    let rackPowerConns;

    try {
        datacenterutils.getDataFromName(datacenter, (id, abbrev) => {
            if (rackRow.trim() !== "" && rackNum.trim !== "" && datacenter.trim() !== "") {
                console.log(rackRow, rackNum, id)

                racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).where("datacenter", "==", id).get().then(function (querySnapshot) {
                    console.log(querySnapshot)
                    //NEED TO ADD THIS POWERPORTS ARRAY TO THE DB
                    rackPowerConns = querySnapshot.docs[0].data().powerPorts
                    console.log(rackPowerConns)

                    for (let i = 0; i < rackPowerConns.length; i++) {

                        if (rackPowerConns[i].pduSide === "Left") {
                            occupiedLeft.push(rackPowerConns[i].port)
                        }
                        else {
                            occupiedRight.push(rackPowerConns[i].port)
                        }
                    }

                    //Take the difference to find all the free ports available for each PDU side

                    freeLeft = allPorts.filter(x => !occupiedLeft.includes(x));
                    freeRight = allPorts.filter(x => !occupiedRight.includes(x));
                    console.log(freeLeft)
                    console.log(freeRight)

                    let firstFreeLeft;
                    let firstFreeRight;

                    let portLimit = 24
                    let count = 0
                    while (count <= portLimit) {
                        count++;
                        firstFreeLeft = Math.min(...freeLeft)
                        console.log("Min port on the left: " + firstFreeLeft)
                        firstFreeRight = Math.min(...freeRight)

                        //Test this function some more by changing db values
                        //Add a 'no connection' button
                        if (firstFreeRight === firstFreeLeft) {
                            returnPort = firstFreeRight
                            callback(returnPort)
                            break;
                        }
                        else {
                            var indexLeft= freeLeft.indexOf(firstFreeLeft);
                            if (indexLeft !== -1) freeLeft.splice(indexLeft, 1);
                            console.log("Should have min removed: " + freeLeft)
                            var indexRight= freeRight.indexOf(firstFreeRight);
                            if (indexRight !== -1) freeLeft.splice(indexRight, 1);


                        }
                    }


                }).catch(error => console.log(error))



            }

        })


    }
    catch (error) {
        console.log(error)
        //return null;
        callback(null)
    }

}

function autofillPowerConnections(modelNumPorts, callback) {
    //If the model has 2 power ports, then the form should already be filled out: port 1 gets the left, topmost available,
    //And right needs to match the port number
    //^^How to extend the above to 8 ports? lol im just not



}

//everytime I add, I keep a map in the rack DB, and asset DB
function checkConflicts(inputDatacenter, inputRack, inputRackU, inputModel, pduSide, port, callback) {
    //No 'double connections': no PDU has more than one power port associated with it: conflicts/availability

    //let PDU = "hpdu"
    //only rtp1 has network control over PDUs, but still need to be able to add power connections for racks that don't
    // PDU=PDU+"-"+abbrev+"-"+inputRack+"-"+inputRackU+pduSide.charAt(0)
    // console.log(PDU)
    if (parseInt(inputRackU) < 10) {
        inputRackU = "0" + inputRackU
    }

    datacenterutils.getDataFromName(inputDatacenter, (id, abbrev) => {

        let splitRackArray = inputRack.split(/(\d+)/).filter(Boolean)
        let rackRow = splitRackArray[0]
        let rackNum = parseInt(splitRackArray[1])

        racksRef.where("letter", "==", rackRow).where("height", "==", rackNum).where("datacenter", "==", id).get().then(function (rackConnectionsDoc) {
            let rackPowerConns = rackConnectionsDoc.powerPorts
            console.log(rackPowerConns)
            rackPowerConns.forEach(function (powerConn) {
                if (powerConn.pduSide == pduSide && powerConn.port == port) {
                    callback("Trying to make a conflicting power connection at " + pduSide + " " + port)
                }
                else {
                    callback(null)
                }
            }).catch(error => console.log(error))

        }).catch(error => console.log(error))

    })

}

//Is this method even neessary when you can jsut pass in the array directly in? can delete--check
//Call this in assetutils: addAsset()
//Call this after validating
function addConnections(newID, inputModel, powerConnections) {

    let numPorts = 0;

    powerConnections.forEach(function (connection) {
        modelsRef.where("modelName", "==", inputModel).get().then(function (modelDoc) {
            numPorts = modelDoc.docs[0].data().powerPorts;

            //Already validated the ports
            //have more than one port, need to add according to the fields. The fields should default to symm connections. So instead of if, just have each connection added accordingly
            if (numPorts == 1) {
                assetRef.doc(newID).set({
                    powerConnections: {
                        pduSide: connection.pduSide,
                        port: connection.port
                    }
                }, { merge: true }) //double check that this is added correctly


            }

        }).then(
            //Also need to update in racks, the power connections
        ).
            catch(error => console.log(error))

    })

}

export {
    validatePowerConnections,
    autofillPowerConnections,
    checkConflicts,
    addConnections,
    getFirstFreePort,
}