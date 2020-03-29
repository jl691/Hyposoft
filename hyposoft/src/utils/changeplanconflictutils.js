import { assetRef, racksRef, modelsRef, usersRef, firebase, datacentersRef, changeplansRef, decommissionRef } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as assetIDutils from './assetidutils'
import * as datacenterutils from './datacenterutils'
import * as assetnetworkportutils from './assetnetworkportutils'
import * as assetpowerportutils from './assetpowerportutils'
import * as changeplanutils from './changeplanutils'
//for testing/console logging purposes:
import errorStrings from '../res/errorMessages.json'
import { addAsset } from './assetutils'

//the callback(false) ight not serve any purpose, was thinking of using it in unit testing or as a return val?


const rackNonExistent = (changePlanID, stepID, rackName, datacenter, callback) => {
    let splitRackArray = rackName.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])
    let errorIDSet = new Set();


    rackutils.getRackID(rackRow, rackNum, datacenter, function (rackID) {
        //what if datacenter does not exist?
        //if(rackID===null)
        if (!rackID) {
            //console.log("The rack exists")
            errorIDSet.add("rackErrID")

            addConflictToDBDatabase(changePlanID, stepID, "rack", errorIDSet, status => {

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

            addConflictToDBDatabase(changePlanID, stepID, "datacenter", errorIDSet, status => {

                callback(status)
            })
        }
        else {
            // console.log("The datacenter does not exist")
            callback(false)
        }

    })

}

const hostnameConflict = (changePlanID, stepID, assetID, hostname, callback) => {
    let errorIDSet = new Set();
    assetRef.where("hostname", "==", hostname).get().then(async function (docSnaps) {

        if (!docSnaps.empty && hostname !== "" && docSnaps.docs[0].data().assetId !== assetID) {

            errorIDSet.add("hostnameErrID")

            addConflictToDBDatabase(changePlanID, stepID, "hostname", errorIDSet, status => {
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
                addConflictToDBDatabase(changePlanID, stepID, "owner", errorIDSet, status => {

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
const assetIDConflict = (changePlanID, stepID, assetID, callback, isEdit = null) => {
    let errorIDSet = new Set()
    if (assetID !== "" && !isEdit) {
        assetRef.doc(assetID).get().then(async function (assetDoc) {
            if (assetDoc.exists && !isEdit) {
                if (isEdit) {
                    callback(false)
                }
                else {
                    errorIDSet.add("assetIDErrID")
                    addConflictToDBDatabase(changePlanID, stepID, "assetID", errorIDSet, status => {
                        callback(status)
                    })

                }
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
    //need to get modelID and pass that into doc
    // console.log(model)
    modelutils.getModelByModelname(model, modelDoc1 => {

        if (modelDoc1) {
            modelsRef.doc(modelDoc1.id).get().then(async function (modelDoc2) {
                if (!modelDoc2.exists) {
                    errorIDSet.add("modelErrID")
                    addConflictToDBDatabase(changePlanID, stepID, "model", errorIDSet, status => {
                        //console.log(status)
                        callback(status)
                    })
                }
                else {
                    callback(false)
                }
            })

        }
        else {
            errorIDSet.add("modelErrID")

            addConflictToDBDatabase(changePlanID, stepID, "model", errorIDSet, status => {
                //console.log(status)
                callback(status)
            })

        }

    })

}

const rackUConflict = (changePlanID, stepID, assetID, model, datacenter, rackName, rackU, callback) => {
    let splitRackArray = rackName.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    let errorIDSet = new Set();

    rackutils.getRackID(rackRow, rackNum, datacenter, async function (rackID) {
        if (rackID) {
            racksRef.doc(rackID).get().then(async function (querySnapshot) {
                //checking if the rack exists
                if (!querySnapshot.empty) {
                    modelutils.getModelByModelname(model, async function (doc) {
                        //doc.data().height refers to model height
                        //need to get get model height

                        if (doc) {


                            rackutils.checkAssetFits(rackU, doc.data().height, rackID, async function (status) {
                                if (status && status.length) {
                                    //asset conflicts with other assets
                                    errorIDSet.add("rackUConflictErrID")
                                    addConflictToDBDatabase(changePlanID, stepID, "rackU", errorIDSet, status => {
                                        //console.log(status)
                                        callback(status)
                                    })

                                }
                                else {
                                    //what if model was deleted? Then
                                    callback(false)
                                }
                            }, assetID)


                        }




                    })
                }
                else {
                    // console.log("rack does not exists")
                    callback(false)
                }
            })

        }
        else {
            //the rack no longer exists
            errorIDSet.add("rackErrID")
            addConflictToDBDatabase(changePlanID, stepID, "rack", errorIDSet, status => {
                //(status)
                callback(status)
            })
            callback(false)
        }

    })

}

const powerConnectionOccupied = (datacenter, rack, rackU, pduSide, port, errorIDSet, assetID, callback) => {
    assetpowerportutils.checkConflicts(datacenter, rack, rackU, pduSide, port, async function (status) {
        //console.log("powerportutils checkConflict callback: " + status)
        if (status) {
            errorIDSet.add("powerConnectionConflictErrID")

        }
        callback()

    }, assetID)
    //pass in the option assetID parameter here so there's no self conflicts
}

const powerConnectionConflict = (changePlanID, stepID, powerConnections, datacenter, rack, rackU, assetID, callback) => {

    let errorIDSet = new Set()
    if (!powerConnections.length) {
        callback(false)
    }
    let count = 0;
    for (let i = 0; i < powerConnections.length; i++) {
        let pduSide = powerConnections[i].pduSide;
        let port = powerConnections[i].port;


        powerConnectionOccupied(datacenter, rack, rackU, pduSide, port, errorIDSet, assetID, callback1 => {
            addConflictToDBDatabase(changePlanID, stepID, "powerConnections", errorIDSet, status => {
                //console.log(status)
                count++;
                if (count === powerConnections.length) {
                    callback(status)
                }

            })
        })
    }
}

//networkConnections is an array
//does old networkConnections is a map
const networkConnectionConflict = (changePlanID, stepID, networkConnections, oldNetworkConnections, callback) => {
    let errorIDSet = new Set()
    if (!networkConnections.length) {
        callback(false)
    }
    let count = 0;
    for (let i = 0; i < networkConnections.length; i++) {
        let thisPort = networkConnections[i].thisPort
        let otherAssetID = networkConnections[i].otherAssetID
        let otherPort = networkConnections[i].otherPort

        networkConnectionOtherAssetID(otherAssetID, errorIDSet, otherAssetStatus => {
            // console.log(otherAssetStatus)
            count++;
            if (!otherAssetStatus) {
                //trying to connect to a nonexistent asset
                //Don't do some checks, because it will error out because of the query.
                errorIDSet.add("networkConnectionNonExistentOtherPortErrID")
                console.log([...Object.entries(errorIDSet)])
                addConflictToDBDatabase(changePlanID, stepID, "networkConnections", errorIDSet, status => {
                    if (count === networkConnections.length) {
                        callback(status)
                    }

                })
            } else {
                networkConnectionOtherAssetPortExist(otherAssetID, otherPort, errorIDSet, callback2 => {

                    networkConnectionConflictsHelper(oldNetworkConnections, thisPort, otherAssetID, otherPort, errorIDSet, callback3 => {
                        console.log([...Object.entries(errorIDSet)])
                        addConflictToDBDatabase(changePlanID, stepID, "networkConnections", errorIDSet, status => {

                            if (count === networkConnections.length) {
                                callback(status)

                            }
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
//When editing, do need to pass in the oldNetworkConnections properly in the package funciton
//Need to double check why oldetworkConnections is here. Is it just for updating and to check self conflicting?
//Is it bad if it's null? No, can be null. It appears that it is for self-conflicting, but double check w Allen
function networkConnectionConflictsHelper(oldNetworkConnections, thisPort, otherAssetID, otherPort, errorIDSet, callback) {
    assetnetworkportutils.checkNetworkPortConflicts(oldNetworkConnections, thisPort, otherAssetID, otherPort, status => {
        console.log(status)
        if (status) {
            // console.log(status)
            errorIDSet.add("networkConnectionConflictErrID")
        }
        callback()
    }, oldNetworkConnections)

}


//no need to check for self conflicts in an edit change
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

//This is a check against the live db. If there is an edit step, and it's editing an asset that has been recently deleted or decomm
//assetID refers to assetID of the edit step we are checking
function editCheckAssetNonexistent(changePlanID, stepID, assetID, callback) {
    let errorIDSet = new Set()
    if (assetID !== "") {
        assetRef.doc(assetID).get().then(async function (assetDoc) {
            if (!assetDoc.exists) {
                errorIDSet.add("editNonexistentErrID")
                addConflictToDBDatabase(changePlanID, stepID, "delete", errorIDSet, status => {
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

//trying to edit one that was decommissioned
// function editCheckAssetDecommissioned(changePlanID, stepID, assetID, callback) {
//     let errorIDSet = new Set()
//     if (assetID !== "") {
//         decommissionRef.where("assetId", "==", assetID).get().then(async function (decommDoc) {
//             if (decommDoc.exists) {
//                 errorIDSet.add("editDecommissionedErrID")
//                 addConflictToDBDatabase(changePlanID, stepID, "decommission", errorIDSet, status => {
//                     callback(status)
//                 })
//             }
//             else {
//                 callback(false)
//             }
//         })
//     }
//     else { callback(false) }
// }

//might move this up a level: to when you click on a changeplan
function checkLiveDBConflicts(isExecuted, changePlanID, stepNum, model, hostname, datacenter, rack, rackU, owner, assetID, powerConnections, networkConnections, callback) {

    if (!isExecuted) {
        changeplanutils.getStepDocID(changePlanID, stepNum, thisStepID => { //querySnapshot is all docs in changes
            //console.log(thisStepID)
            changeplansRef.doc(changePlanID).collection('changes').doc(thisStepID).get().then(docSnap => {
                //let thisStepNum = docSnap.data().step
                let changeType = docSnap.data().change
                if (changeType === "add") {
                    addAssetChangePlanPackage(changePlanID, thisStepID, model, hostname, datacenter, rack, rackU, owner, assetID, powerConnections, networkConnections, status => {
                        callback()
                        console.log("Add live db check calling back.")
                    })
                }
                else if (changeType === "edit") {
                    //the current step that we're on is an edit, and need to check all of its fields fo live conflcit db checks
                    //first, check out which functions in adAssetChangePlanPackage can be reused
                    editAssetChangePlanPackage(changePlanID, thisStepID, model, hostname, datacenter, rack, rackU, owner, assetID, powerConnections, networkConnections, status => {
                        console.log("Edit live db check calling back.")
                        callback()
                    })
                }
                else {
                    decommissionAssetChangePlanPackage(changePlanID, thisStepID, status => {
                        console.log("Decommission live db check calling back.")
                        callback()
                    })

                }

            })


        })
    }
}
function editAssetChangePlanPackage(changePlanID, stepID, model, hostname, datacenter, rack, rackU, owner, assetID, powerConnections, networkConnections, callback) {

    //how to pass in oldNetworkConnections? what are they exactly? Object or Array? What does it need to be?
    assetRef.doc(assetID).get().then(doc => {
        let oldNetworkConnections = doc.data().networkConnections;
        assetID = assetID.toString()

        rackNonExistent(changePlanID, stepID, rack, datacenter, status1 => {
            datacenterNonExistent(changePlanID, stepID, datacenter, status2 => {
                hostnameConflict(changePlanID, stepID, assetID, hostname, status3 => {
                    ownerConflict(changePlanID, stepID, owner, status4 => {
                        assetIDConflict(changePlanID, stepID, assetID, status5 => {
                            modelConflict(changePlanID, stepID, model, status6 => {
                                rackUConflict(changePlanID, stepID, assetID, model, datacenter, rack, rackU, status7 => {//converting networkConnections into an array
                                    let networkConnectionsArray = assetnetworkportutils.networkConnectionsToArray(networkConnections)

                                    networkConnectionConflict(changePlanID, stepID, networkConnectionsArray, oldNetworkConnections, status8 => {

                                        powerConnectionConflict(changePlanID, stepID, powerConnections, datacenter, rack, rackU, assetID, status9 => {
                                            // editCheckAssetDecommissioned(changePlanID, stepID, assetID, status10 => {
                                            //   editCheckAssetDeleted(changePlanID, stepID, assetID, status11 => {

                                            callback()
                                            //  })
                                            // })
                                        })
                                    })
                                })
                            })
                        }, true)
                    })
                })
            })
        })
    })

}


//rename package to db
function decommissionAssetChangePlanPackage(changePlanID, stepID, callback) {
    changeplansRef.doc(changePlanID).collection('changes').doc(stepID).get().then(stepDoc => {
        let errorIDSet = new Set()
        let decommAssetID = stepDoc.data().assetID.toString()

        assetRef.doc(decommAssetID).get().then(assetDoc => {
            if (!assetDoc.exists) {
                errorIDSet.add("decommissionDBErrID")
                addConflictToDBDatabase(changePlanID, stepID, "decommission", errorIDSet, status => {
                    // console.log(status)
                    callback(status)
                })


            }
        })
    })
}

function addAssetChangePlanPackage(changePlanID, stepID, model, hostname, datacenter, rack, rackU, owner, assetID, powerConnections, networkConnections, callback) {

    let oldNetworkConnections = null;
    assetID = assetID.toString()

    rackNonExistent(changePlanID, stepID, rack, datacenter, status1 => {
        datacenterNonExistent(changePlanID, stepID, datacenter, status2 => {
            hostnameConflict(changePlanID, stepID, assetID, hostname, status3 => {
                ownerConflict(changePlanID, stepID, owner, status4 => {
                    assetIDConflict(changePlanID, stepID, assetID, status5 => {
                        modelConflict(changePlanID, stepID, model, status6 => {
                            rackUConflict(changePlanID, stepID, null, model, datacenter, rack, rackU, status7 => {
                                networkConnectionConflict(changePlanID, stepID, networkConnections, oldNetworkConnections, status8 => {

                                    powerConnectionConflict(changePlanID, stepID, powerConnections, datacenter, rack, rackU, assetID, status9 => {
                                        callback()
                                    })
                                })

                            })

                        })
                    })

                })
            })
        })

    })
}
//current step is in a for loop
function checkSequentialStepConflicts(executed, changePlanID) {
    if (!executed) {
        changeplansRef.doc(changePlanID).collection('changes').get().then(querySnapshot => {
            for (let i = 0; i < querySnapshot.size; i++) {
                let thisStepID = querySnapshot.docs[i].id
                //console.log(thisStepID)
                changeplansRef.doc(changePlanID).collection('changes').doc(thisStepID).get().then(docSnap => {
                    let thisStepNum = docSnap.data().step
                    console.log("ON CURRENT STEP " + thisStepNum)
                    if (thisStepNum > 1) {
                        checkWithPreviousSteps(changePlanID, thisStepID, thisStepNum, status => {
                            /// console.log("Finished checkWithPreviousStpes")
                        })
                    }
                })
            }
        })
    }
}

//checking current step with many other previous steps
function checkWithPreviousSteps(changePlanID, thisStepID, thisStepNum, callback) {
    changeplansRef.doc(changePlanID).collection('changes').doc(thisStepID).get().then(stepDoc => {
        let thisStepData = stepDoc.data();
        //console.log(thisStepData)
        let thisChangeType = thisStepData.change
        //maybe compare this step (which is 2+) to other previous steps, in ascending order? ie 3 to 1, then 3 to 2 vs. 3 to 2, then 3 to 1. Or does it not matter? Can you think of a case where it does matter?
        for (let i = thisStepNum - 1; i > 0; i--) {
            console.log("COMPARING TO STEP " + thisStepNum + " TO STEP " + i)
            let otherStepNum = i;
            if (thisChangeType === "add") {
                addChangeCheck(changePlanID, thisStepData, thisStepID, otherStepNum)
            }
            else if (thisChangeType == "edit") {
                editChangeCheck(changePlanID, thisStepID, otherStepNum)
            }
            else {
                //decommission
                decommissionChangeCheck(changePlanID, thisStepID, otherStepNum, thisStepData, callback)
            }

        }
        callback()
    })
}

//If the current step is an edit step, and we need to check it against all the previous steps
function editChangeCheck(changePlanID, thisStepID, thisStepNum, otherStepNum) {
    changeplanutils.getMergedAssetAndChange(changePlanID, thisStepNum, thisStepData => {
        if (thisStepData) {

            // console.log(thisStepData)
            //loop over and check
            changeplanutils.getStepDocID(changePlanID, otherStepNum, otherStepID => {
                changeplansRef.doc(changePlanID).collection('changes').doc(otherStepID).get().then(otherStepDoc => {
                    if (otherStepDoc.data().change === "add") {
                        let otherRack = otherStepDoc.data().changes.rack.new
                        let otherRackU = otherStepDoc.data().changes.rackU.new
                        let otherDatacenter = otherStepDoc.data().changes.datacenter.new
                        let otherModel = otherStepDoc.data().changes.model.new
                        let otherAssetID = otherStepDoc.data().assetID
                        let otherHostname = otherStepDoc.data().changes.hostname.new
                        let otherPowerConnections = otherStepDoc.data().changes.powerConnections.new
                        let otherNetworkConnections = otherStepDoc.data().changes.networkConnections.new
                        rackUStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherModel, otherDatacenter, otherRack, otherRackU, callback1 => {
                            assetIDStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherAssetID, callback2 => {
                                hostnameStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherHostname, callback3 => {
                                    powerConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherPowerConnections, otherDatacenter, otherRack, callback4 => {
                                        networkConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherNetworkConnections, otherAssetID, callback5 => {
                                            console.log("editChangeCheck() against add step completed.")

                                        })
                                    })
                                })
                            })
                        })

                    }
                    else if (otherStepDoc.data().change === "edit") {
                        changeplanutils.getMergedAssetAndChange(changePlanID, otherStepNum, otherAssetData => {
                            //this gets all the fields, not just the changes
                            console.log(otherAssetData)
                            let otherAssetID = otherAssetData.assetId
                            let otherRack = otherAssetData.rack
                            let otherRackU = otherAssetData.rackU
                            let otherDatacenter = otherAssetData.datacenter
                            let otherModel = otherAssetData.model
                            let otherHostname = otherAssetData.hostname
                            let otherPowerConnections = otherAssetData.powerConnections
                            let otherNetworkConnections = otherAssetData.networkConnections
                            rackUStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherModel, otherDatacenter, otherRack, otherRackU, callback1 => {
                                assetIDStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherAssetID, callback2 => {
                                    hostnameStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherHostname, callback3 => {
                                        powerConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherPowerConnections, otherDatacenter, otherRack, callback4 => {

                                            networkConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherNetworkConnections, otherAssetID, callback5 => {
                                                console.log("editChangeCheck() against edit step completed.")

                                            })
                                        })
                                    })
                                })
                            })


                        })

                    }
                    else {
                        //trying to edit an asset that was decomm in a previous step
                        let errorIDSet = new Set()
                        let otherAssetID = otherStepDoc.data().assetID
                        let thisAssetID = thisStepData.assetID
                        //console.log(otherAssetID, thisAssetID)
                        if (otherAssetID == thisAssetID && otherAssetID !== "" && thisAssetID !== "") {
                            errorIDSet.add("decommissionStepErrID")
                            addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, null, otherStepNum, errorIDSet, status => {

                                let thisNetworkConnections = thisStepData.changes.networkConnections.new
                                let otherStepAssetID = otherStepDoc.data().assetID
                                networkConnectionOtherAssetIDStep(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, thisNetworkConnections, otherStepAssetID, callback1 => {
                                    console.log("editChangeCheck() against decomm step completed.")

                                })
                            })
                        }
                    }

                }).catch(error => console.log(error))
            })


        }
    })

}

//at the level of checking step against step
function addChangeCheck(changePlanID, thisStepData, thisStepID, otherStepNum) {
    changeplanutils.getStepDocID(changePlanID, otherStepNum, otherStepID => {
        changeplansRef.doc(changePlanID).collection('changes').doc(otherStepID).get().then(otherStepDoc => {
            //be careful with what you are comparing
            //since otherStepNum changes

            //TODO: separate this out into own if (add) else if(edit)
            if (otherStepDoc.data().change === "add") {
                let otherRack = otherStepDoc.data().changes.rack.new
                let otherRackU = otherStepDoc.data().changes.rackU.new
                let otherDatacenter = otherStepDoc.data().changes.datacenter.new
                let otherModel = otherStepDoc.data().changes.model.new
                let otherAssetID = otherStepDoc.data().assetID
                let otherHostname = otherStepDoc.data().changes.hostname.new
                let otherPowerConnections = otherStepDoc.data().changes.powerConnections.new
                let otherNetworkConnections = otherStepDoc.data().changes.networkConnections.new
                rackUStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherModel, otherDatacenter, otherRack, otherRackU, callback1 => {
                    assetIDStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherAssetID, callback2 => {
                        hostnameStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherHostname, callback3 => {
                            powerConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherPowerConnections, otherDatacenter, otherRack, callback4 => {
                                networkConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherNetworkConnections, otherAssetID, callback5 => {
                                    console.log("addChangeCheck() completed.")

                                })
                            })
                        })
                    })
                })
            }
            else if (otherStepDoc.data().change === "edit") {
                //want to get all possible data from the other edit step to compare this step against
                changeplanutils.getMergedAssetAndChange(changePlanID, otherStepNum, otherAssetData => {
                    //this gets all the fields, not just the changes
                    console.log(otherAssetData)
                    let otherAssetID = otherAssetData.assetId
                    let otherRack = otherAssetData.rack
                    let otherRackU = otherAssetData.rackU
                    let otherDatacenter = otherAssetData.datacenter
                    let otherModel = otherAssetData.model
                    let otherHostname = otherAssetData.hostname
                    let otherPowerConnections = otherAssetData.powerConnections
                    let otherNetworkConnections = otherAssetData.networkConnections
                    rackUStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherModel, otherDatacenter, otherRack, otherRackU, callback1 => {
                        assetIDStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherAssetID, callback2 => {
                            hostnameStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherHostname, callback3 => {
                                powerConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherPowerConnections, otherDatacenter, otherRack, callback4 => {

                                    networkConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherNetworkConnections, otherAssetID, callback5 => {
                                        console.log("addChangeCheck() completed.")

                                    })
                                })
                            })
                        })
                    })


                })
            }
            else {
                //console.log("The other step is decomm")
                let thisNetworkConnections = thisStepData.changes.networkConnections.new
                let otherStepAssetID = otherStepDoc.data().assetID
                networkConnectionOtherAssetIDStep(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, thisNetworkConnections, otherStepAssetID, callback1 => {
                    console.log("addChangeCheck() completed.")

                })

            }

        })
    })

}

function decommissionChangeCheck(changePlanID, thisStepID, otherStepNum, thisStepData, callback) {
    let errorIDSet = new Set()
    let decommThisAsset = thisStepData.assetID
    //console.log(decommThisAsset)

    changeplanutils.getStepDocID(changePlanID, otherStepNum, otherStepID => {
        changeplansRef.doc(changePlanID).collection('changes').doc(otherStepID).get().then(otherStepDoc => {
            let otherStepType = otherStepDoc.data().change
            if (otherStepType === "decommission") {

                let decommOtherAsset = otherStepDoc.data().assetID

                if (decommThisAsset === decommOtherAsset) {
                    //console.log("up in this bitch rn")
                    errorIDSet.add("decommissionStepErrID")

                    //TODO: is it necessary to have symmetric conflicts here? So if you want to decommission asset X in step 4, and you check previous steps and found that asset X has been decommissioned in step 2, then is it necessary for step 2 to also show the conflict too?
                    addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, null, otherStepNum, errorIDSet, status => {
                        callback(status)
                    })
                }

            }
            else {
                callback(false)
            }
        })
    })
}

//TODO: also do the live db comparison for decomms

function networkConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherNetworkConnections, otherAssetID, callback) {
    let errorIDSet = new Set()
    let thisNetworkConnections = thisStepData.changes.networkConnections.new //this is a map object since we are getting it from changeplans
    //three things to check for, each with own errID (double check messages say correct thing in JSON)

    Object.keys(otherNetworkConnections).forEach(otherConnKey => {
        Object.keys(thisNetworkConnections).forEach(thisConnKey => {
            let otherConnOtherAssetID = otherNetworkConnections[otherConnKey].otherAssetID
            let otherConnOtherPort = otherNetworkConnections[otherConnKey].otherPort
            let thisConnOtherAssetID = thisNetworkConnections[thisConnKey].otherAssetID
            let thisConnOtherPort = thisNetworkConnections[thisConnKey].otherPort
            //2 does my current otherAssetID, otherPort match with another step's assetID and thisPort?
            //otherAssetID, otherPort conflict check
            if (thisConnOtherAssetID === otherConnOtherAssetID && thisConnOtherPort === otherConnOtherPort) {
                errorIDSet.add("networkConnectionConflictErrID")

            }
            //3 does my current thisPort match with another step's otherport?
            else if (thisConnKey === otherConnKey && otherAssetID === thisStepData.assetID && otherAssetID !== "" && thisStepData.assetID !== "") {
                errorIDSet.add("networkConnectionThisPortConflictErrID")
            }


        })
    })

    addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, otherStepID, otherStepNum, errorIDSet, status => {
        callback(status)
    })


}

//call this in the else: know that it's a decomm change
// is the other asset i want to connect to been decomm by a previous /otherstep?
//networkConnections is an array
function networkConnectionOtherAssetIDStep(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, thisNetworkConnections, otherStepAssetID, callback) {
    let errorIDSet = new Set();

    if (!thisNetworkConnections.size) {
        callback(false)
    }
    Object.keys(thisNetworkConnections).forEach(thisConnThisPort => {
        if (thisNetworkConnections[thisConnThisPort].otherAssetID == otherStepAssetID) {
            errorIDSet.add("networkConnectionOtherAssetIDErrID")
            errorIDSet.add("networkConnectionNonExistentOtherPortErrID")
        }

    })

    addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, null, otherStepNum, errorIDSet, status => {
        callback(status)
    })

}

//TODO: need to test this
function powerConnectionsStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherPowerConnections, otherDatacenter, otherRack, callback) {
    //how to tell if 2 steps share the same power connection?
    let errorIDSet = new Set()
    let thisPowerConnections = thisStepData.changes.powerConnections.new
    let thisDatacenter = thisStepData.changes.datacenter.new
    let thisRack = thisStepData.changes.rack.new

    if (otherDatacenter == thisDatacenter && otherRack == thisRack) {
        for (let i = 0; i < thisPowerConnections.length; i++) {
            let thisPduSide = thisPowerConnections[i].pduSide
            let thisPort = thisPowerConnections[i].port
            for (let j = 0; j < otherPowerConnections.length; j++) {
                let otherPduSide = otherPowerConnections[j].pduSide
                let otherPort = otherPowerConnections[j].port

                if (thisPort == otherPort && thisPduSide == otherPduSide) {
                    errorIDSet.add("powerConnectionConflictErrID")
                }
            }
        }
        addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, otherStepID, otherStepNum, errorIDSet, status => {
            callback(status)
        })
    }
    else {
        callback(false)
    }

}
function assetIDStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherAssetID, callback) {
    let errorIDSet = new Set()
    let thisAssetID = thisStepData.assetID

    if (thisAssetID.toString() === otherAssetID.toString() && thisAssetID !== "" && otherAssetID !== "") {
        errorIDSet.add("assetIDErrID")
        addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, otherStepID, otherStepNum, errorIDSet, status => {
            callback(status)
        })
    } else {
        callback(false)
    }
}

function hostnameStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherHostname, callback) {
    let errorIDSet = new Set()
    let thisHostname = thisStepData.changes.hostname.new
    if (thisHostname === otherHostname) {
        errorIDSet.add("hostnameErrID")
        addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, otherStepID, otherStepNum, errorIDSet, status => {
            callback(status)
        })
    }
    else {
        callback(false)
    }
}

function rackUStepConflict(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, otherModel, otherDatacenter, otherRack, otherRackU, callback) {
    let errorIDSet = new Set()
    let thisModel = thisStepData.changes.model.new
    //console.log(thisModel)
    modelutils.getModelByModelname(thisModel, async function (thisModelDoc) {
        modelutils.getModelByModelname(otherModel, async function (otherModelDoc) {
            let otherModelHeight = otherModelDoc.data().height
            let thisModelHeight = thisModelDoc.data().height
            let thisDatacenter = thisStepData.changes.datacenter.new
            let thisRack = thisStepData.changes.rack.new
            let thisRackU = thisStepData.changes.rackU.new
            //console.log(otherModelHeight, thisModelHeight, thisDatacenter, thisRackU, thisRack)

            let thisOccupied = []
            for (let i = 0; i < thisModelHeight; i++) {
                let occupiedThisPos = thisRackU + i
                thisOccupied.push(occupiedThisPos)
            }
            let otherOccupied = []
            for (let j = 0; j < otherModelHeight; j++) {
                let occupiedOtherPos = otherRackU + j
                otherOccupied.push(occupiedOtherPos)
            }

            if (otherDatacenter == thisDatacenter && otherRack == thisRack) {
                let intersection = thisOccupied.filter(x => otherOccupied.includes(x));
                if (intersection.length) {

                    errorIDSet.add("rackUConflictErrID")
                    addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, otherStepID, otherStepNum, errorIDSet, status => {
                        callback(status)
                    })
                }
                else {
                    //not intersecting each other on the rack in terms of rackU
                    callback(false)
                }
            }
            else {
                //not in the same datacenter and rack
                callback(false)
            }
        })
    })
}

function addConflictToDBDatabase(changePlanID, stepID, fieldName, errorIDSet, callback) {

    //Call this method at each validation function at the end, where appropriate
    //What if the stepID doc does not exist? Does .set() take care of this for you?
    //the answer: yes, set with merge will update fields in the document or create it if it doesn't exists
    let errorIDArray = [...errorIDSet]

    if (errorIDArray.length) {

        console.log("Error ID(s) that will be added to the conflict/stepID doc: " + [...errorIDArray])
        changeplansRef.doc(changePlanID).collection('conflicts').doc(stepID).set({
            database: {
                [fieldName]: errorIDArray
            }

        }, { merge: true }).then(function () {
            console.log("Successfully added the conflict to the database: database for this step: " + stepID)
            return (callback(true))

        }).catch(error => {
            callback(false)
            console.log("Error adding conflict to the db")
        }
        )
    }
    else {
        //no IDs in the array. If this works, can refactor the basic tests
        //console.log("No conflicts found.")
        callback(false)
    }
}

function addConflictToDBSteps(changePlanID, stepID, stepNum, otherStepID, otherStepNum, errorIDSet, callback) {

    let errorIDArray = [...errorIDSet]
    if (errorIDArray.length) {

        console.log("Error ID(s) that will be added to the conflict/stepID doc: " + [...errorIDArray])
        changeplansRef.doc(changePlanID).collection('conflicts').doc(stepID).set({
            steps: {
                [otherStepNum]: firebase.firestore.FieldValue.arrayUnion(...errorIDArray)
            }

        }, { merge: true }).then(function () {
            //this is for symmetric add of conflicts. Decomm check doesn't need a symm add, therefore the if statement below

            if (otherStepID) {
                changeplansRef.doc(changePlanID).collection('conflicts').doc(otherStepID).set({
                    steps: {
                        [stepNum]: firebase.firestore.FieldValue.arrayUnion(...errorIDArray)
                    }

                }, { merge: true }).then(function () {

                    console.log("Successfully added the conflict to the database: steps.")
                    return (callback(true))

                })

            }

        }).catch(error => {
            callback(false)
            console.log("Error adding conflict to the db: " + error)
        }
        )
    }
    else {
        //no IDs in the array. If this works, can refactor the basic tests
        //console.log("No conflicts found.")
        callback(false)
    }
}

//this will delete the entire doc if necessary. This is so DetailedChangePlanScreen will know whether or not there are conflicts
//in the entire change plan
function deleteConflictFromDB(changePlanID, thisStepID, thisStepNum, callback) {
    //need to test this for deleting a change plan step with just steps, just database, and both
    changeplansRef.doc(changePlanID).collection('conflicts').doc(thisStepID).get().then(deleteStepDoc => {
        console.log("These are the steps to be symmetrically deleted:" + deleteStepDoc.data().steps)
        if (deleteStepDoc.data().steps) {
            symmetricStepDelete(changePlanID, thisStepNum, deleteStepDoc, status => {
                if (status) {
                    console.log("symmetricStepDelete() completed. Should only see this once for one step deleted.")
                    //recursiveDeleteSteps(changePlanID, deleteStepDoc.id, status => {
                    changeplansRef.doc(changePlanID).collection('conflicts').doc(thisStepID).delete().then(function () {
                        console.log("FINAL: Done with deleting step conflicts")
                        callback(true)
                    }).catch(function (error) {
                        console.log(error)
                        callback(false)
                    })
                    //})
                } else {
                    console.log("symmetricStepDelete() called back false")
                    callback(false)
                }
            })
        } else {
            //recursive delete on database after we delete just the database object
            //then need to delete the entire doc regardless
            changeplansRef.doc(changePlanID).collection('conflicts').doc(thisStepID).delete().then(function () {
                console.log("Database deletes only. Done with deleting step conflicts.")
                callback(true)
            }).catch(function (error) {
                console.log(error)
                callback(false)
            })
        }
    }).catch(function (error) {
        console.log(error)
        callback(false)
    })
}
/**
 * 
 * @param {*} changePlanID 
 * @param {*} otherStepNum if you are deleting step 2, and it also conflicts with steps 1, 3, 4, then otherStepNum = 1, 3, 4 in loop
 * @param {*} conflictStepNumArray continuing with example above. these are the errorIDs assoc with the step. ie: step3:["hostnameErrID", "rackUErrID"]
 * @param {*} deleteStepNum this is the step number of step you are currently trying to delete. In the example, 2
 * @param {*} deleteStepDoc 
 * @param {*} callback 
 */
function deleteErrIDInArray(changePlanID, otherStepNum, conflictStepNumArray, deleteStepNum, deleteStepDoc, callback) {
    let counter = 0;
    console.log("Delete step: " + deleteStepNum)
    console.log("This is the otherStepNum corresponding to step you are trying to delete: " + otherStepNum)
    console.log(" THIS IS THE CONFLICTS ARRAY: ")
    console.log([...conflictStepNumArray])
    for (let i = 0; i < conflictStepNumArray.length; i++) {
        let errID = conflictStepNumArray[i] //we are in the conflicts doc of the step we want to delete, in map steps, which has arrays that indicate the other steps it has symmetric conflicts to. The 'otherStepNumArray' indicates ties that we (to be deleted doc) have in the remaining steps of the change plan
        console.log("Trying to delete this error from corresponding conflicting step: " + errID)

        changeplanutils.getStepDocID(changePlanID, otherStepNum, otherStepDocID => {
            //console.log(otherStepDocID)

            if (otherStepDocID) {
                changeplansRef.doc(changePlanID).collection('conflicts').doc(otherStepDocID).update({
                    ['steps.' + deleteStepNum.toString()]: firebase.firestore.FieldValue.arrayRemove(errID)

                }).then(() => {
                    //TODO: use an iterator to know when to callback once. This gives a double toast, but properly deletes the doc
                    // if (i == conflictStepNumArray.length - 1) {
                    // console.log(Object.keys(deleteStepDoc.data().steps))
                    counter++;
                    console.log("Incremented the counter to : " + counter)
                    if (counter === conflictStepNumArray.length) {
                        //only when you have gone through all the errorIDs of stepYoureDeleting -> conflicts -> correspondingStepWithConflicts->[errID1, errID2] and deleted them do you callback
                        //recursiveDeleteSteps(changePlanID, otherStepDocID, status => {
                        //to prevent the multiple toast messages popping up
                        //recursiveDeleteSteps does not callback a boolean, just need to know it tried to delete as far as possible
                        console.log("Succeeded in conflict deleteErrIDInArray(). Should see this message outer loop size number of times.")
                        //return(callback)??
                        callback(true)

                        // })

                    }

                }).catch(function (error) {
                    console.log(error)
                    callback(false)
                })

            }
            else {
                //had trouble getting the otherStepDocID
                console.log("In deleteErrIDArray() and failed to get otherStepDoc")
                console.log("For this otherStepNum: " + otherStepNum)
                callback(false)
            }

        })
    }


}

//this just removes yourself from the field array
function symmetricStepDelete(changePlanID, deleteStepNum, deleteStepDoc, callback) {

    let outerCounter = 0;

    //Object.keys(deleteStepDoc.data().steps).forEach(function (otherStepNum) {
    console.log("Outer loop size: " + Object.keys(deleteStepDoc.data().steps).length)
    for (let j = 0; j < Object.keys(deleteStepDoc.data().steps).length; j++) {
        //Look into the conflicts doc of the step you are currently deleting. Find all the steps that currently have errors corresponding to the step you are deleting
        let otherStepNum = Object.keys(deleteStepDoc.data().steps)[j]
        //other stepNum: for example, if you are deleting step 2, and it has conflicts with steps 1, 3, and 4, then eaach time this for loop runs, otherStepNum should take on these values

        //each time the outer for loop runs, the innter for loop will change how many times it will run. Does this make sense?
        let conflictStepNumArray = deleteStepDoc.data().steps[otherStepNum]
        //Each otherStepNum comes with its own array of errorIDs. So for example, step 1:["hostnameErrID", "rackUErrID"]
        //console.log(otherStepNum)
        //console.log(...conflictStepNumArray)


        console.log("Inner loop size:" + conflictStepNumArray.length)
        deleteErrIDInArray(changePlanID, otherStepNum, conflictStepNumArray, deleteStepNum, deleteStepDoc,
            status => {
                outerCounter++;
                if (outerCounter === Object.keys(deleteStepDoc.data().steps).length) {
                    callback(status)
                }

            })


        // })
        //outer for loop close bracket
    }
    //maybe add a callback() here? in case you dont enter for loop

}

//delete that step from steps
//if we find that steps now has size 0
//delete steps
//if we ind that the conflict doc has no fields in it
//delete the doc
//If there are no docs in the subcollection
//then delete the conflict subcollection

//call this after we see what's left of the carnage of deleting symmetrically
//deepest level of recurion is that the entire doc gets deleted
//
function recursiveDeleteSteps(changePlanID, deleteStepID, callback) {
    console.log('Recurisvely deleting on this step ID: ' + deleteStepID)
    changeplansRef.doc(changePlanID).collection('conflicts').doc(deleteStepID).get().then(deleteDoc => {
        if (deleteDoc.data().steps) {
            Object.keys(deleteDoc.data().steps).forEach(function (otherStepNum) {
                console.log(otherStepNum)
                let conflictStepNumArray = deleteDoc.data().steps[otherStepNum]
                console.log(conflictStepNumArray.length)
                if (!conflictStepNumArray.length) {
                    let fieldDelete = "steps." + otherStepNum.toString()
                    changeplansRef.doc(changePlanID).collection('conflicts').doc(deleteStepID).update({

                        [fieldDelete]: firebase.firestore.FieldValue.delete()

                    }).then(function () {
                        changeplansRef.doc(changePlanID).collection('conflicts').doc(deleteStepID).get().then(updatedDeleteDoc1 => {

                            console.log(updatedDeleteDoc1.data().steps)
                            console.log(Object.keys(updatedDeleteDoc1.data().steps).length)
                            if (!Object.keys(updatedDeleteDoc1.data().steps).length) { //anything left in steps? if not, delete the field
                                changeplansRef.doc(changePlanID).collection('conflicts').doc(deleteStepID).update({
                                    steps: firebase.firestore.FieldValue.delete()
                                }).then(function () {
                                    console.log(Object.keys(deleteDoc.data()).length)

                                    changeplansRef.doc(changePlanID).collection('conflicts').doc(deleteStepID).get().then(updatedDeleteDoc2 => {

                                        if (!Object.keys(updatedDeleteDoc2.data()).length) {
                                            changeplansRef.doc(changePlanID).collection('conflicts').doc(deleteStepID).delete().then(function () {
                                                //Can use this as a check to tell whether or not a change plan has a conflict
                                                // changeplansRef.doc(changePlanID).collection('conflicts').get().then(query => {
                                                //     if(!query.size){

                                                //     }
                                                // })
                                                console.log("Succeeded in recursive delete for steps")
                                                callback(true)
                                            }).catch(function (error) {
                                                callback(false)
                                                console.log(error)
                                            })

                                        }
                                        else {
                                            callback()
                                        }
                                    }).catch(function (error) {
                                        callback()
                                        console.log(error)
                                    })
                                })
                            } else {
                                callback()
                            }

                        })

                    }).catch(function (error) {
                        callback()
                        console.log(error)
                    })

                }
                else { callback() }
            })

        }
        else {
            callback()
        }
    })
}

function getErrorMessages(changePlanID, stepNum, callback) {

    changeplanutils.getStepDocID(changePlanID, stepNum, stepID => {
        changeplansRef.doc(changePlanID).collection('conflicts').doc(stepID).get().then(function (conflictDoc) {
            let errMessage = ""
            const data = conflictDoc.data();

            for (const conflictType in data) {
                const conflicts = data[conflictType];
                for (const key in conflicts) {

                    let value = conflicts[key]
                    value.forEach(errID => {
                        let message = errorStrings[errID]
                        errMessage = errMessage + "\n" + message

                    })
                }

            }
            callback(errMessage)


        }).catch(error => console.log(error))

    })

}

//if there are conflicts, callback the stepNums, or stepIDs that have them
//otherwise callback []
function changePlanHasConflicts(changePlanID, callback) {
    changeplansRef.doc(changePlanID).collection('conflicts').get().then(query => {
        let result = new Set()
        let count = query.docs.length;
        if (query.docs.length) {

            //if there are conflicts
            //console.log(query.docs)

            for (let i = 0; i < query.docs.length; i++) {

                changeplansRef.doc(changePlanID).collection('changes').doc(query.docs[i].id).get().then(stepDoc => {

                    let stepNum = stepDoc.data().step
                    result.add(stepNum)
                    count--;
                    if (count == 0) {
                        //console.log("This is the result set size: " + result.size)
                        let sortedResult = [...(result)].sort()
                        callback(sortedResult )
                    }

                }).catch(error => console.log(error))

            }

        }
        else {
            callback(result)
        }
    })

}

function checkAllLiveDBConflicts(changePlanID, callback){
    changeplansRef.doc(changePlanID).collection('changes').get().then(collectionDoc =>{
        if(!collectionDoc.empty){
            collectionDoc.forEach(stepDoc =>{
                let isExecuted = stepDoc.data().executed
                let stepNum = stepDoc.data().step

                let changes = stepDoc.data().changes
                let model= changes.model.new
                let hostname = changes.hostname.new
                // function checkLiveDBConflicts(isExecuted, changePlanID, stepNum, model, hostname, datacenter, rack, rackU, owner, assetID, powerConnections, networkConnections, callback)

            })
        }
    })

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
    networkConnectionConflict,
    getErrorMessages,
    checkSequentialStepConflicts,
    checkLiveDBConflicts,
    deleteConflictFromDB,
    changePlanHasConflicts,
    editCheckAssetNonexistent,
    checkAllLiveDBConflicts



}
