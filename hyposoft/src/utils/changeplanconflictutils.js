import { assetRef, racksRef, modelsRef, usersRef, firebase, datacentersRef, changeplansRef } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as assetIDutils from './assetidutils'
import * as datacenterutils from './datacenterutils'
import * as assetnetworkportutils from './assetnetworkportutils'
import * as assetpowerportutils from './assetpowerportutils'
//for testing/console logging purposes:
import errorStrings from '../res/errorMessages.json'

//check add asset change plan edits

//check edit asset change plan edits

//check decomm asset change plan edits

//the callback(false) ight not serve any purpose, was thinking of using it in unit testing or as a return val?


const rackNonExistent = (changePlanID, stepID, rackName, datacenter, callback) => {
    let splitRackArray = rackName.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])
    let errorIDSet = new Set();

    rackutils.getRackID(rackRow, rackNum, datacenter, function (rackID) {
        if (!rackID) {
            errorIDSet.add("rackErrID")

            addConflictToDB(changePlanID, stepID, "rack", errorIDSet, status => {

                callback(status)
            });

        }
        //rack exists
        else {
            callback(false)
        }

    })

}

const datacenterNonExistent = (changePlanID, stepID, datacenterName, callback) => {
    let errorIDSet = new Set();
    datacenterutils.getDataFromName(datacenterName, async function (data) {
        if (!data) {
            errorIDSet.add("datacenterErrID")

            addConflictToDB(changePlanID, stepID, "datacenter", errorIDSet, status => {

                callback(status)
            })
        }
        else { callback(false) }

    })

}

const hostnameConflict = (changePlanID, stepID, hostname, callback) => {
    let errorIDSet = new Set();
    assetRef.where("hostname", "==", hostname).get().then(async function (docSnaps) {
        if (!docSnaps.empty && hostname !== "") {

            errorIDSet.add("hostnameErrID")

            addConflictToDB(changePlanID, stepID, "hostname", errorIDSet, status => {
                callback(status)
            })

        }
        else {
            callback(false)
        }

    })

}

//does the owner still exist?
const ownerConflict = (changePlanID, stepID, owner, callback) => {
    let errorIDSet = new Set();
    if (owner !== "") {
        let username = owner;
        usersRef.where('username', '==', username).get().then(async function (querySnapshot) {
            if (querySnapshot.empty) {
                errorIDSet.add("ownerErrID")
                addConflictToDB(changePlanID, stepID, "owner", errorIDSet, status => {

                    callback(status)
                })
            }
            else {
                callback(false)
            }
        })
    }
    else {
        //there is no conflict
        callback(false)
    }
}

//was the assetID you were planning to use taken?
const assetIDConflict = (changePlanID, stepID, assetID, callback) => {
    let errorIDSet = new Set()
    if (assetID !== "") {
        assetRef.doc(assetID).get().then(async function (assetDoc) {
            if (assetDoc.exists) {
                errorIDSet.add("assetIDErrID")
                addConflictToDB(changePlanID, stepID, "assetID", errorIDSet, status => {
                    callback(status)
                })
            }
            else {
                callback(false)
            }
        })
    }
    else { callback(false) }
}

const modelConflict = (changePlanID, stepID, model, callback) => {
    let errorIDSet = new Set()
    modelsRef.doc(model).get().then(async function (modelDoc) {
        if (!modelDoc.exists) {
            errorIDSet.add("modelErrID")
            addConflictToDB(changePlanID, stepID, "model", errorIDSet, status => {
                callback(status)
            })
        }
        else {
            callback(false)
        }
    })
}

// "rackUFitErrID": "An asset at this rack U will not fit on the rack.",
//for add. When editing the change plan, how to check for self-conflicting?
//Also need to test this rigorously
//if there are no conflicts, will this work properly?
// const rackUConflict = (changePlanID, stepID, model, datacenter, rackName, rackU, callback) => {
//     let splitRackArray = rackName.split(/(\d+)/).filter(Boolean)
//     let rackRow = splitRackArray[0]
//     let rackNum = parseInt(splitRackArray[1])

//     let errorIDSet = new Set();

//     //need to get the rackID
//     rackutils.getRackID(rackRow, rackNum, datacenter, async function (rackID) {

//         racksRef.doc(rackID).get().then(async function (querySnapshot) {
//             //checking if the rack exists
//             if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number) {
//                 let rackHeight = querySnapshot.docs[0].data().height
//                 modelutils.getModelByModelname(model, async function (doc) {
//                     //doc.data().height refers to model height
//                     //need to get get model height
//                     rackutils.checkAssetFits(rackU, doc.data().height, rackID, async function (status) {
//                         if (status && !(rackHeight > parseInt(rackU) + doc.data().height)) {
//                             //asset conflicts with other assets and does not fit on the rack
//                             errorIDSet.add("rackUConflictErrID")
//                             errorIDSet.add("rackUFitErrID")

//                         }
//                         else if (status && (rackHeight > parseInt(rackU) + doc.data().height)) {
//                             //asset conflicts with other assets, but does fit on the rack
//                             errorIDSet.add("rackUConflictErrID")

//                         }
//                         else if (rackHeight > parseInt(rackU) + doc.data().height) {
//                             //asset does not fit within the rack at the rackU
//                             errorIDSet.add("rackUFitErrID")

//                         }
//                         else{
//                             callback(false)
//                         }
//                     })

//                     addConflictToDB(changePlanID, stepID, "rackU", errorIDSet, status =>{
//                         console.log(status)
//                         callback(status)
//                     })

//                 })
//             }
//         })
//     })

// }

const rackUConflict = (changePlanID, stepID, model, datacenter, rackName, rackU, callback) => {
    let splitRackArray = rackName.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    let errorIDSet = new Set();

    rackutils.getRackID(rackRow, rackNum, datacenter, async function (rackID) {

        racksRef.doc(rackID).get().then(async function (querySnapshot) {
            //checking if the rack exists
            if (!querySnapshot.empty) {
                modelutils.getModelByModelname(model, async function (doc) {
                    //doc.data().height refers to model height
                    //need to get get model height
                    rackutils.checkAssetFits(rackU, doc.data().height, rackID, async function (status) {
                        if (status) {
                            //asset conflicts with other assets
                            errorIDSet.add("rackUConflictErrID")
                            addConflictToDB(changePlanID, stepID, "rackU", errorIDSet, status => {
                                console.log(status)
                                callback(status)
                            })

                        }
                        else {
                            callback(false)
                        }
                    })



                })
            }
            else {
                console.log("rack does not exists")
                callback(false)
            }
        })
    })

}


//instead of an array, use a set!! and then make it into an array before you add to the database
const powerConnectionOccupied = (datacenter, rack, rackU, pduSide, port, errorIDSet, callback) => {
    assetpowerportutils.checkConflicts(datacenter, rack, rackU, pduSide, port, async function (status) {
        console.log("powerportutils checkConflict callback: " + status)
        if (status) {
            errorIDSet.add("powerConnectionConflictErrID")

        }
        callback()

    })
}

// const powerConnectionIncompleteForm = async (pduSide, port, errorIDSet) => {
//     if (pduSide.trim() === "" && port.trim() === "") {
//         console.log("All fields for power connections in asset change plan have been filled out appropriately.")
//     }
//     else if (pduSide.trim() !== "" && port.trim() !== "") {
//         console.log("No power connections were made for this asset in the change plan. ")
//     }
//     else {
//         errorIDSet.add("powerConnectionsIncompleteFormErrID")
//     }
// }

// const powerConnectionInvalidNum = async (port, errorIDSet) => {
//     (port >= 1 && port <= 24) ?
//         console.log("Valid port numbers. In changeplanconflictutils")
//         : errorIDSet.add("powerConnectionsInvalidPortErrID")
// }

//TODO: double check this logic. What if no power connections were made? numPowerPOrts is 0? how can you conclude model 0 in the else?
// const powerConnectionNumConnections = (powerConnections, model, errorIDSet, callback) => {
//     modelsRef.where("modelName", "==", model).get().then(function (querySnapshot) {
//         let numPowerPorts = querySnapshot.docs[0].data().powerPorts ? querySnapshot.docs[0].data().powerPorts : 0;
//         console.log("Num powerPorts for this model: " + numPowerPorts)

//         if (powerConnections.length !== numPowerPorts) {
//             if (numPowerPorts > 0) {
//                 errorIDSet.add("powerConnectionsIncorrectNumConnectionsErrID")
//             }
//             else {
//                 errorIDSet.add("powerConnectionModel0ErrID")
//             }
//         }
//         callback()
//     })
// }
//Lmao need to test this rigorously
const powerConnectionConflict = (changePlanID, stepID, powerConnections, datacenter, rack, rackU, callback) => {

    let errorIDSet = new Set()
    for (let i = 0; i < powerConnections.length; i++) {
        let pduSide = powerConnections[i].pduSide;
        let port = powerConnections[i].port;


        powerConnectionOccupied(datacenter, rack, rackU, pduSide, port, errorIDSet, callback1 => {
            addConflictToDB(changePlanID, stepID, "powerConnections", errorIDSet, status => {
                console.log(status)
                callback(status)
            })
        })
    }
    // console.log("These are the error IDs for this change plan set for power connections: " + [...errorIDSet.entries()])
}

const networkConnectionConflict = async (changePlanID, stepID, networkConnections, oldNetworkConnections, callback) => {
    let errorIDSet = new Set()
    for (let i = 0; i < networkConnections.length; i++) {
        let thisPort = networkConnections[i].thisPort
        let otherAssetID = networkConnections[i].otherAssetID
        let otherPort = networkConnections[i].otherPort

        networkConnectionOtherAssetID(otherAssetID, errorIDSet, otherAssetStatus => {
            console.log(otherAssetStatus)
            if (!otherAssetStatus) {
                //trying to connect to a nonexistent asset
                //Don't do some checks, because it will error out because of the query. 
                errorIDSet.add("networkConnectionNonExistentOtherPortErrID")
                console.log([...Object.entries(errorIDSet)])
                addConflictToDB(changePlanID, stepID, "networkConnections", errorIDSet, status => {
                    callback(status)
                })
            } else {
                networkConnectionOtherAssetPortExist(otherAssetID, otherPort, errorIDSet, callback2 => {
                    networkConnectionConflictsHelper(oldNetworkConnections, thisPort, otherAssetID, otherPort, errorIDSet, callback3 => {
                        console.log([...Object.entries(errorIDSet)])
                        addConflictToDB(changePlanID, stepID, "networkConnections", errorIDSet, status => {
                            callback(status)
                        })
                    })
                })
            }
        })

    }
}

function networkConnectionOtherAssetPortExist(otherAssetID, otherPort, errorIDSet, callback) {
    assetnetworkportutils.checkOtherAssetPortsExist(otherAssetID, otherPort, status => {
        console.log(status)
        if (status) {
            errorIDSet.add("networkConnectionNonExistentOtherPortErrID")
        }
        //if timing is weird or unit tests keep failing randomly, move this callback
        callback()
    })
}

//Need to double check why oldetworkConnections is here. Is it just for updating and to check self conflicting?
//Is it bad if it's null? No, can be null. It appears that it is for self-conflicting, but double check w Allen
function networkConnectionConflictsHelper(oldNetworkConnections, thisPort, otherAssetID, otherPort, errorIDSet, callback) {
    assetnetworkportutils.checkNetworkPortConflicts(oldNetworkConnections, thisPort, otherAssetID, otherPort, status => {
        console.log(status)
        if (status) {
            console.log(status)
            errorIDSet.add("networkConnectionConflictErrID")
        }
        callback()
    })

}

function networkConnectionOtherAssetID(otherAssetID, errorIDSet, callback) {
    assetRef.doc(otherAssetID).get().then(function (otherAssetModelDoc) {
        if (!otherAssetModelDoc.exists) {
            errorIDSet.add("networkConnectionOtherAssetIDErrID")
            callback(false)

        }
        else {
            callback(true)
        }
    })

}


//NEED TO REWRITE THIS AND INTEGRATE AGAIN
async function addAssetChangePlanPackage(changePlanID, stepID, model, hostname, datacenter, rack, rackU, owner, assetID, powerConnections, networkConnections) {

    let oldNetworkConnections = null;
    assetID = assetID.toString()

    // await rackNonExistent(changePlanID, stepID, rack, datacenter)
    // await datacenterNonExistent(changePlanID, stepID, datacenter)
    // await hostnameConflict(changePlanID, stepID, hostname)
    // await ownerConflict(changePlanID, stepID, owner)
    // await assetIDConflict(changePlanID, stepID, assetID)
    // await modelConflict(changePlanID, stepID, model)

    //need to to test that all possible errors are caught at once
    // await rackUConflict(changePlanID, stepID, model, datacenter, rack, rackU)
    // await networkConnectionConflict(networkConnections, oldNetworkConnections, model)
    // await powerConnectionConflict(changePlanID, stepID, powerConnections, datacenter, rack, rackU, model, assetID)

}

function addConflictToDB(changePlanID, stepID, fieldName, errorIDSet, callback) {

    //Call this method at each validation function at the end, where appropriate
    //What if the stepID doc does not exist? Does .set() take care of this for you?
    //the answer: yes, set with merge will update fields in the document or create it if it doesn't exists
    let errorIDArray = [...errorIDSet]

    if (errorIDArray.length) {

        console.log("Error ID(s) that will be added to the conflict/stepID doc: " + [...errorIDArray])
        changeplansRef.doc(changePlanID).collection('conflicts').doc(stepID).set({
            [fieldName]: errorIDArray

        }, { merge: true }).then(function () {
            console.log("Successfully added the conflict to the database.")
            return (callback(true))

        }).catch(error => {
            callback(false)
            console.log("Error adding conflict to the db")
        }
        )
    }
    else {
        //no IDs in the array. If this works, can refactor the basic tests
        console.log("No conflicts found.")
        callback(false)
    }
}

export {

    addAssetChangePlanPackage,
    rackNonExistent,
    datacenterNonExistent,
    hostnameConflict,
    ownerConflict,
    assetIDConflict,
    modelConflict,
    rackUConflict,
    powerConnectionConflict,
    networkConnectionConflict



}