import { racksRef, modelsRef } from './firebaseutils'
import * as datacenterutils from './datacenterutils'

//Toast message at the front end level


function validatePowerConnections(inputDatacenter, inputRack, inputRackU, powerConnections, model, callback) {
    // assuming all or nothing. If an asset has 2 power ports, can't just plug one in

    //How to handle when the rack does not have a network managed port?? How does this affect the detailed view? Getting the status?
    let success = 0;
    for (let i = 0; i < powerConnections.length; i++) {
        
        let pduSide = powerConnections[i].pduSide;
        let port = powerConnections[i].port;

        if (pduSide.trim() === "" && port.trim() === "") {
            success++;
            
            if (success == powerConnections.length) {
                console.log("Returning successfully")
                console.log(powerConnections.length)
                callback(null)
            }
            //TODO: need to signify to store a null in the DB. That way, can do a .length check to know to dispplay "no connection" in the asset detail view
        }

        //take out else and try with jsut if???
        else if (pduSide.trim() !== "" && port.trim() !== "") {


            modelsRef.where("modelName", "==", model).get().then(function (querySnapshot) {
                let numPowerPorts = querySnapshot.docs[0].data().powerPorts;
                console.log("Num powerPorts for this model: " + numPowerPorts)

                if (parseInt(port) >= 1 && parseInt(port) <= 24) {

                    //all or nothing
                    if (powerConnections.length === numPowerPorts) {
                        //check for conflicts
                        checkConflicts(inputDatacenter, inputRack, inputRackU, pduSide, port, status => {
                            if (status) {
                                callback(status)
                            }
                            else {
                                success++;
                                if (success == powerConnections.length) {
                                    console.log("Returning successfully")
                                    callback(null)
                                }
                            }

                        })

                    }
                    else if (numPowerPorts!=null){

                        //THIS SHOWS UP TOO MANY TIMES
                        callback("To make power connections for this model " + model + ", you need to make " + numPowerPorts + " connections.")

                    }

                } else {

                    callback("To make a power connection, please enter a valid port number. Valid port numbers range from 1 to 24.")

                }

            }).catch(function (error) {console.log("Could not find the model: " + error)})


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
                //console.log(rackRow, rackNum, id)

                racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).where("datacenter", "==", id).get().then(function (querySnapshot) {

                    rackPowerConns = querySnapshot.docs[0].data().powerPorts

                    for (let i = 0; i < rackPowerConns.length; i++) {

                        if (rackPowerConns[i].pduSide === "Left") {
                            occupiedLeft.push(parseInt(rackPowerConns[i].port))
                            //console.log(occupiedLeft)
                        }
                        else {
                            occupiedRight.push(parseInt(rackPowerConns[i].port))
                        }
                    }
                    //Take the difference to find all the free ports available for each PDU side

                    freeLeft = allPorts.filter(x => !occupiedLeft.includes(x));
                    freeRight = allPorts.filter(x => !occupiedRight.includes(x));
                    // console.log(freeLeft)
                    // console.log(freeRight)

                    let firstFreeLeft;
                    let firstFreeRight;

                    let portLimit = 24
                    let count = 0
                    while (count <= portLimit) {
                        count++;
                        firstFreeLeft = Math.min(...freeLeft)
                        // console.log("Min port on the left: " + firstFreeLeft)
                        firstFreeRight = Math.min(...freeRight)

                        //Test this function some more by changing db values
                        //Add a 'no connection' button
                        if (firstFreeRight > firstFreeLeft) {
                            var indexLeft = freeLeft.indexOf(firstFreeLeft);
                            if (indexLeft !== -1) freeLeft.splice(indexLeft, 1);
                            //console.log("Should have min removed: " + freeLeft)
                        }
                        else if (firstFreeRight < firstFreeLeft) {

                            var indexRight = freeRight.indexOf(firstFreeRight);
                            if (indexRight !== -1) freeRight.splice(indexRight, 1);
                        }
                        else {
                            returnPort = firstFreeRight
                            break;
                        }
                    }
                    callback(returnPort)


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

function checkConflicts(inputDatacenter, inputRack, inputRackU, pduSide, port, callback) {
    //No 'double connections': no PDU has more than one power port associated with it: conflicts/availability

    if (parseInt(inputRackU) < 10) {
        inputRackU = "0" + inputRackU
    }

    datacenterutils.getDataFromName(inputDatacenter, (id, abbrev) => {

        let splitRackArray = inputRack.split(/(\d+)/).filter(Boolean)
        let rackRow = splitRackArray[0]
        let rackNum = parseInt(splitRackArray[1])

        racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).where("datacenter", "==", id).get().then(function (rackConnectionsDoc) {
            let rackPowerConns = rackConnectionsDoc.docs[0].data().powerPorts
            console.log(rackConnectionsDoc)
            console.log(rackPowerConns)

            if(rackPowerConns.length){
                //So the rack already has occupied power ports
                rackPowerConns.forEach(function (powerConn) {
                    //checking all the occupied ports against a single port, port, which you are passing in
                    //NEED TO COUNT TO CALLBACK  
                    if (powerConn.pduSide === pduSide && powerConn.port === port) {
                        callback("Trying to make a conflicting power connection at " + pduSide + " " + port)
                    }
                    else {
                        callback(null)
                    }
                })


            }
            else{
                //There are no occupied ports on the rack
                callback(null)
            }
            
        }).catch(error => console.log(error))

    })

}

//This is so the db in assets collection will store null instead of "" if no power connections are made
function formatPowerConnections(powerPorts) {
    //need to return null if no power port conections have been made
    if (powerPorts[0].pduSide === "") {
        //TODO:didn't fill out anything. But what if first is empty but second is not?
        powerPorts=[];
        return powerPorts;
    }
    else {
        return powerPorts;
    }

}

export {
    validatePowerConnections,
    checkConflicts,
    getFirstFreePort,
    formatPowerConnections,
    
}