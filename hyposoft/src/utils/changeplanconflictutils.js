import { assetRef, racksRef, modelsRef, usersRef, firebase, datacentersRef, changeplansRef } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as assetIDutils from './assetidutils'
import * as datacenterutils from './datacenterutils'
import * as assetnetworkportutils from './assetnetworkportutils'
import * as assetpowerportutils from './assetpowerportutils'
import * as changeplanutils from './changeplanutils'
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
        else { callback(false) }

    })

}

const hostnameConflict = (changePlanID, stepID, hostname, callback) => {
    let errorIDSet = new Set();
    assetRef.where("hostname", "==", hostname).get().then(async function (docSnaps) {
        if (!docSnaps.empty && hostname !== "") {

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
const assetIDConflict = (changePlanID, stepID, assetID, callback) => {
    let errorIDSet = new Set()
    if (assetID !== "") {
        assetRef.doc(assetID).get().then(async function (assetDoc) {
            if (assetDoc.exists) {
                errorIDSet.add("assetIDErrID")
                addConflictToDBDatabase(changePlanID, stepID, "assetID", errorIDSet, status => {
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
            addConflictToDBDatabase(changePlanID, stepID, "model", errorIDSet, status => {
                callback(status)
            })
        }
        else {
            callback(false)
        }
    })
}

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
                            addConflictToDBDatabase(changePlanID, stepID, "rackU", errorIDSet, status => {
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

const powerConnectionConflict = (changePlanID, stepID, powerConnections, datacenter, rack, rackU, callback) => {

    let errorIDSet = new Set()
    if (!powerConnections.length) {
        callback(false)
    }
    for (let i = 0; i < powerConnections.length; i++) {
        let pduSide = powerConnections[i].pduSide;
        let port = powerConnections[i].port;


        powerConnectionOccupied(datacenter, rack, rackU, pduSide, port, errorIDSet, callback1 => {
            addConflictToDBDatabase(changePlanID, stepID, "powerConnections", errorIDSet, status => {
                console.log(status)
                callback(status)
            })
        })
    }
    // console.log("These are the error IDs for this change plan set for power connections: " + [...errorIDSet.entries()])
}

//networkConnections is an array
const networkConnectionConflict = (changePlanID, stepID, networkConnections, oldNetworkConnections, callback) => {
    let errorIDSet = new Set()
    if (!networkConnections.length) {
        callback(false)
    }
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
                addConflictToDBDatabase(changePlanID, stepID, "networkConnections", errorIDSet, status => {
                    callback(status)
                })
            } else {
                networkConnectionOtherAssetPortExist(otherAssetID, otherPort, errorIDSet, callback2 => {
                    networkConnectionConflictsHelper(oldNetworkConnections, thisPort, otherAssetID, otherPort, errorIDSet, callback3 => {
                        console.log([...Object.entries(errorIDSet)])
                        addConflictToDBDatabase(changePlanID, stepID, "networkConnections", errorIDSet, status => {
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

//rename package to db
function decommissionAssetChangePlanPackage(changePlanID, stepID, callback) {
    changeplansRef.doc(changePlanID).collection('changes').doc(stepID).get().then(stepDoc => {
        let errorIDSet = new Set()
        let decommAssetID = stepDoc.data().assetID

        assetRef.doc(decommAssetID).get().then(assetDoc => {
            if (!assetDoc.exists) {
                errorIDSet.add("decommissionDBErrID")
                addConflictToDBDatabase(changePlanID, stepID, "decommission", errorIDSet, status => {
                    console.log(status)
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

            hostnameConflict(changePlanID, stepID, hostname, status3 => {

                ownerConflict(changePlanID, stepID, owner, status4 => {

                    assetIDConflict(changePlanID, stepID, assetID, status5 => {

                        modelConflict(changePlanID, stepID, model, status6 => {

                            rackUConflict(changePlanID, stepID, model, datacenter, rack, rackU, status7 => {

                                networkConnectionConflict(changePlanID, stepID, networkConnections, oldNetworkConnections, status8 => {

                                    powerConnectionConflict(changePlanID, stepID, powerConnections, datacenter, rack, rackU, status9 => {
                                        console.log("9 layered cake bitch!")
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
function checkSequentialStepConflicts(changePlanID) {
    changeplansRef.doc(changePlanID).collection('changes').get().then(querySnapshot => {
        console.log(querySnapshot.size)
        for (let i = 0; i < querySnapshot.size; i++) {
            let thisStepID = querySnapshot.docs[i].id
            //console.log(thisStepID)
            changeplansRef.doc(changePlanID).collection('changes').doc(thisStepID).get().then(docSnap => {
                let thisStepNum = docSnap.data().step
                console.log("ON CURRENT STEP " + thisStepNum)
                if (thisStepNum > 1) {
                    checkWithPreviousSteps(changePlanID, thisStepID, thisStepNum, status => {
                        console.log("Finished checkWithPreviousStpes")
                    })
                }
            })
        }
    })
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
                console.log("This step is an edit. Checking previous steps against this step for any conflicts")
                //editChangeCheck()
            }
            else {
                //decommission
                console.log("This step is a decommission.")
                decommissionChangeCheck(changePlanID, thisStepID, otherStepNum, thisStepData, callback)
            }

        }
        callback()
    })
}

//at the level of checking step against step
function addChangeCheck(changePlanID, thisStepData, thisStepID, otherStepNum) {
    changeplanutils.getStepDocID(changePlanID, otherStepNum, otherStepID => {
        changeplansRef.doc(changePlanID).collection('changes').doc(otherStepID).get().then(otherStepDoc => {
            //be careful with what you are comparing
            //since otherStepNum changes
            if (otherStepDoc.data().change === "add" || otherStepDoc.data().change === "edit") {
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
                                    console.log("x layered cake again !")

                                })
                            })
                        })
                    })
                })
            }
            else {
                let thisNetworkConnections = thisStepData.changes.networkConnections.new
                networkConnectionOtherAssetIDStep(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, thisNetworkConnections, callback1 => {

                })

            }

        })
    })

}

function decommissionChangeCheck(changePlanID, thisStepID, otherStepNum, thisStepData, callback) {
    let errorIDSet = new Set()
    let decommThisAsset = thisStepData.assetID
    console.log(decommThisAsset)

    changeplanutils.getStepDocID(changePlanID, otherStepNum, otherStepID => {
        changeplansRef.doc(changePlanID).collection('changes').doc(otherStepID).get().then(otherStepDoc => {
            let otherStepType = otherStepDoc.data().change
            if (otherStepType === "decommission") {

                let decommOtherAsset = otherStepDoc.data().assetID

                if (decommThisAsset === decommOtherAsset) {
                    console.log("up in this bitch rn")
                    errorIDSet.add("decommissionStepErrID")

                    //TODO: is it necessary to have symmetric conflicts here? So if you want to decommission asset X in step 4, and you check previous steps and found that asset X has been decommissioned in step 2, then is it necessary for step 2 to also show the conflict too?
                    addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, otherStepID, otherStepNum, errorIDSet, status => {
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
            if (thisConnOtherAssetID === otherAssetID && thisConnOtherPort === otherConnKey) {
                errorIDSet.add("networkConnectionConflictErrID")

            }
            //3 does my current thisPort match with another step's otherport? 
            else if (thisConnKey === otherConnOtherPort) {
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
function networkConnectionOtherAssetIDStep(changePlanID, thisStepID, otherStepID, otherStepNum, thisStepData, thisNetworkConnections, callback) {
    let errorIDSet = new Set();

    if (!thisNetworkConnections.size) {
        callback(false)
    }
    Object.keys(thisNetworkConnections).forEach(thisConnThisPort => {
        if (thisConnThisPort == thisStepData.assetID) {
            errorIDSet.add("networkConnectionOtherAssetIDErrID")
            errorIDSet.add("networkConnectionNonExistentOtherPortErrID")
        }
    })
    addConflictToDBSteps(changePlanID, thisStepID, thisStepData.step, otherStepID, otherStepNum, errorIDSet, status => {
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

    if (thisAssetID.toString() === otherAssetID.toString()) {
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
    console.log(thisModel)
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
            // console.log("Occupied rackU on this rack: "+ [...thisOccupied])
            // console.log("Occupied rackU on other rack: "+ [...otherOccupied])


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

function addConflictToDBSteps(changePlanID, stepID, stepNum, otherStepID, otherStepNum, errorIDSet, callback) {

    //Call this method at each validation function at the end, where appropriate
    //What if the stepID doc does not exist? Does .set() take care of this for you?
    //the answer: yes, set with merge will update fields in the document or create it if it doesn't exists
    let errorIDArray = [...errorIDSet]

    if (errorIDArray.length) {

        console.log("Error ID(s) that will be added to the conflict/stepID doc: " + [...errorIDArray])
        changeplansRef.doc(changePlanID).collection('conflicts').doc(stepID).set({
            steps: {
                [stepNum]: firebase.firestore.FieldValue.arrayUnion(...errorIDArray)
            }

        }, { merge: true }).then(function () {
            //this is for symmetric add of conflicts
            if (otherStepID) {
                changeplansRef.doc(changePlanID).collection('conflicts').doc(otherStepID).set({
                    steps: {
                        [otherStepNum]: firebase.firestore.FieldValue.arrayUnion(...errorIDArray)
                    }

                }, { merge: true }).then(function () {

                    console.log("Successfully added the conflict to the database.")
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
        console.log("No conflicts found.")
        callback(false)
    }
}

function getErrorMessages(changePlanID, stepNum, callback) {

    changeplanutils.getStepDocID(changePlanID, stepNum, stepID => {
        changeplansRef.doc(changePlanID).collection('conflicts').doc(stepID).get().then(function (conflictDoc) {
            let errMessage = ""
            const data = conflictDoc.data();
            console.log(data)

            for (const conflictType in data) {
                const conflicts = data[conflictType];
                for (const key in conflicts) {
                    let value = conflicts[key]
                    let message = errorStrings[value]
                    console.log(message)
                    errMessage = errMessage + "\n" + message

                }

            }
            callback(errMessage)


        }).catch(error => console.log(error))

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
    decommissionAssetChangePlanPackage



}