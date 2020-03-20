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


const rackNonExistent = async (changePlanID, stepID, rackName, datacenter) => {
    let splitRackArray = rackName.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])
    let errorIDSet = new Set();

    rackutils.getRackID(rackRow, rackNum, datacenter, async function (rackID) {

        if (!rackID) {
            errorIDSet.add("rackErrID")

            await addConflictToDB(changePlanID, stepID, "rack", errorIDSet);
            console.log("From the error strings resource file: " + errorStrings.rackErrID)

        }

    })

}

const datacenterNonExistent = async (changePlanID, stepID, datacenterName) => {
    let errorIDSet = new Set();
    datacenterutils.getDataFromName(datacenterName, async function (data) {
        if (!data) {
            errorIDSet.add("datacenterErrID")
            await addConflictToDB(changePlanID, stepID, "datacenter", errorIDSet)
            console.log("From the error strings resource file: " + errorStrings.datacenterErrID)
        }

    })

}

const hostnameConflict = async (changePlanID, stepID, hostname) => {
    let errorIDSet = new Set();
    assetRef.where("hostname", "==", hostname).get().then(async function (docSnaps) {
        if (!docSnaps.empty && hostname !== "") {

            errorIDSet.add("hostnameErrID")
            await addConflictToDB(changePlanID, stepID, "hostname", errorIDSet)
            console.log("From the error strings resource file: " + errorStrings.hostnameErrID)

        }

    })

}

const ownerConflict = async (changePlanID, stepID, owner) => {
    let errorIDSet = new Set();
    if (owner !== "") {
        let username = owner;
        usersRef.where('username', '==', username).get().then(async function (querySnapshot) {
            if (querySnapshot.empty) {
                errorIDSet.add("ownerErrID")
                await addConflictToDB(changePlanID, stepID, "owner", errorIDSet)
                console.log("From the error strings resource file: " + errorStrings.ownerErrID)


            }
        })
    }
}

//was the assetID you were planning to use taken?
const assetIDConflict = async (changePlanID, stepID, assetID) => {
    let errorIDSet = new Set()
    if (assetID !== "") {
        assetRef.doc(assetID).get().then(async function (assetDoc) {
            if (assetDoc.exists) {
                errorIDSet.add("assetIDErrID")
                await addConflictToDB(changePlanID, stepID, "assetID", errorIDSet)
                console.log("From the error strings resource file: " + errorStrings.assetIDErrID)
            }
        })
    }
}

const modelConflict = async (changePlanID, stepID, model) => {
    let errorIDSet = new Set()
    modelsRef.doc(model).get().then(async function (modelDoc) {
        if (!modelDoc.exists) {
            errorIDSet.add("modelErrID")
            await addConflictToDB(changePlanID, stepID, "model", errorIDSet)
            console.log("From the error strings resource file: " + errorStrings.modelErrID)
        }
    })
}

//for add. When editing the change plan, how to check for self-conflicting?
//Also need to test this rigorously
const rackUConflict = async (changePlanID, stepID, model, datacenter, rackName, rackU) => {
    let splitRackArray = rackName.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    let errorIDSet = new Set();

    //need to get the rackID
    rackutils.getRackID(rackRow, rackNum, datacenter, async function (rackID) {

        racksRef.doc(rackID).get().then(async function (querySnapshot) {
            //checking if the rack exists
            if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number) {
                let rackHeight = querySnapshot.docs[0].data().height
                modelutils.getModelByModelname(model, async function (doc) {
                    //doc.data().height refers to model height
                    //need to get get model height
                    rackutils.checkAssetFits(rackU, doc.data().height, rackID, async function (status) {
                        if (status && !(rackHeight > parseInt(rackU) + doc.data().height)) {
                            //asset conflicts with other assets and does not fit on the rack
                            errorIDSet.add("rackUConflictErrID")
                            errorIDSet.add("rackUFitErrID")

                        }
                        else if (status && (rackHeight > parseInt(rackU) + doc.data().height)) {
                            //asset conflicts with other assets, but does fit on the rack
                            errorIDSet.add("rackUConflictErrID")

                        }
                        else if (rackHeight > parseInt(rackU) + doc.data().height) {
                            //asset does not fit within the rack at the rackU
                            errorIDSet.add("rackUFitErrID")

                        }
                    })

                    await addConflictToDB(changePlanID, stepID, "rackU", errorIDSet)
                    console.log("From the error strings resource file: " + errorStrings.rackUFitErrID)

                })
            }
        })
    })

}

//Lmao need to test this rigorously
const powerConnectionConflict = async (changePlanID, stepID, powerConnections, datacenter, rack, rackU, model) => {

    let errorIDSet = new Set()
    for (let i = 0; i < powerConnections.length; i++) {
        let pduSide = powerConnections[i].pduSide;
        let port = powerConnections[i].port;

        await powerConnectionOccupied(datacenter, rack, rackU, pduSide, port, errorIDSet)
        await powerConnectionIncompleteForm(pduSide, port, errorIDSet)
        await powerConnectionInvalidNum(port, errorIDSet)
        await powerConnectionNumConnections(powerConnections, model, errorIDSet)
    }
    console.log("These are the error IDs for this change plan set for power connections: " + [...errorIDSet.entries()])

    await addConflictToDB(changePlanID, stepID, "powerConnections", errorIDSet)

}
//instead of an array, use a set!! and then make it into an array before you add to the database
const powerConnectionOccupied = async (datacenter, rack, rackU, pduSide, port, errorIDSet) => {
    console.log("In powerConnectionOccupied function")
    assetpowerportutils.checkConflicts(datacenter, rack, rackU, pduSide, port, async function (status) {
        if (status) {
            errorIDSet.add("powerConnectionConflictErrID")
        }

    })
}

const powerConnectionIncompleteForm = async (pduSide, port, errorIDSet) => {
    if (pduSide.trim() === "" && port.trim() === "") {
        console.log("All fields for power connections in asset change plan have been filled out appropriately.")
    }
    else if (pduSide.trim() !== "" && port.trim() !== "") {
        console.log("No power connections were made for this asset in the change plan. ")
    }
    else {
        errorIDSet.add("powerConnectionsIncompleteFormErrID")
    }
}

const powerConnectionInvalidNum = async (port, errorIDSet) => {
    (port >= 1 && port <= 24) ?
        console.log("Valid port numbers. In changeplanconflictutils")
        : errorIDSet.add("powerConnectionsInvalidPortErrID")
}

//TODO: double check this logic. What if no power connections were made? numPowerPOrts is 0? how can you conclude model 0 in the else?
const powerConnectionNumConnections = async (powerConnections, model, errorIDSet) => {
    modelsRef.where("modelName", "==", model).get().then(function (querySnapshot) {
        let numPowerPorts = querySnapshot.docs[0].data().powerPorts ? querySnapshot.docs[0].data().powerPorts : 0;
        console.log("Num powerPorts for this model: " + numPowerPorts)

        if (powerConnections.length !== numPowerPorts) {
            if (numPowerPorts > 0) {
                errorIDSet.add("powerConnectionsIncorrectNumConnectionsErrID")
            }
            else {
                errorIDSet.add("powerConnectionModel0ErrID")
            }
        }
    })
}

const networkConnectionConflict = async (changePlanID, stepID, networkConnections, oldNetworkConnections, model) => {
    let errorIDSet = new Set()
    let numConnectionsMade = networkConnections.length

    for (let i = 0; i < networkConnections.length; i++) {
        let thisPort = networkConnections[i].thisPort
        let otherAssetID = networkConnections[i].otherAssetID
        let otherPort = networkConnections[i].otherPort

        let otherAssetIDExists = await networkConnectionOtherAssetID(otherAssetID, errorIDSet)
        console.log(otherAssetIDExists)

        if (!otherAssetIDExists) {
            //this means automatically that other ports don't exist
            errorIDSet.add("networkConnectionNonExistentOtherPortErrID")
            //Don't do some checks, because it will error out because of the query. 
            //what remaining checks can you still do though?
            await networkConnectionIncompleteForm(thisPort, otherAssetID, otherPort, errorIDSet)
            await networkConnectionThisPortExist(thisPort, model, errorIDSet)
            await networkConnectionUniqueThisPort(networkConnections, errorIDSet)
            await networkConnectionUniqueOtherPort(networkConnections, errorIDSet)
            await networkConnectionNumConnections(numConnectionsMade, model, errorIDSet)
            console.log([...Object.entries(errorIDSet)])

            await addConflictToDB(changePlanID, stepID, "networkConnections", errorIDSet)

        }
        else {
            await networkConnectionIncompleteForm(thisPort, otherAssetID, otherPort, errorIDSet)
            await networkConnectionThisPortExist(thisPort, model, errorIDSet)
            await networkConnectionOtherAssetPortExist(otherAssetID, otherPort, errorIDSet)
            await networkConnectionConflictsHelper(oldNetworkConnections, thisPort, otherAssetID, otherPort, errorIDSet)
            await networkConnectionUniqueThisPort(networkConnections, errorIDSet)
            await networkConnectionUniqueOtherPort(networkConnections, errorIDSet)
            await networkConnectionNumConnections(numConnectionsMade, model, errorIDSet)
            console.log([...Object.entries(errorIDSet)])

            await addConflictToDB(changePlanID, stepID, "networkConnections", errorIDSet)

        }

    }
}

const networkConnectionIncompleteForm = async (thisPort, otherAssetID, otherPort, errorIDSet) => {
    if (thisPort.trim() === "" && otherAssetID.trim() === "" && otherPort.trim() === "") {
        console.log("All fields for network connections in asset change plan have been filled out appropriately.")
    }
    else if (thisPort.trim() !== "" && otherAssetID.trim() !== "" && otherPort.trim() !== "") {
        console.log("No power connections were made for this asset in the change plan. ")
    }
    else {
        errorIDSet.add("networkConnectionsIncompleteFormErrID")
    }

}

const networkConnectionThisPortExist = async (thisPort, thisModel, errorIDSet) => {
    assetnetworkportutils.checkThisModelPortsExist(thisModel, thisPort, status => {
        if (status) {
            errorIDSet.add("networkConnectionNonExistentThisPortErrID")
        }
    })
}

const networkConnectionOtherAssetPortExist = async (otherAssetID, otherPort, errorIDSet) => {
    assetnetworkportutils.checkOtherAssetPortsExist(otherAssetID, otherPort, status => {
        if (status) {
            errorIDSet.add("networkConnectionNonExistentOtherPortErrID")
        }
    })
}

//Need to double check why oldetworkConnections is here. Is it just for updating and to check self conflicting?
//Is it bad if it's null? No, can be null. It appears that it is for self-conflicting, but double check w Allen
const networkConnectionConflictsHelper = async (oldNetworkConnections, thisPort, otherAssetID, otherPort, errorIDSet) => {
    assetnetworkportutils.checkNetworkPortConflicts(oldNetworkConnections, thisPort, otherAssetID, otherPort, status => {
        if (status) {
            console.log("networkConnectionConflictErrID being added to errorIDSet")
            errorIDSet.add("networkConnectionConflictErrID")
        }
    })

}

const networkConnectionOtherAssetID = async (otherAssetID, errorIDSet) => {
    assetRef.doc(otherAssetID).get().then(function (otherAssetModelDoc) {
        if (!otherAssetModelDoc.exists) {
            console.log("networkConnectionOtherAssetIDErrID being added to errorIDSet")
            errorIDSet.add("networkConnectionOtherAssetIDErrID")
            return false;

        }
        else {
            return true;
        }
    })

}

const networkConnectionUniqueThisPort = async (networkConnections, errorIDSet) => {
    let seenThisPorts = new Set();
    let numNetworkConns = networkConnections.length
    let forLoopDone = false;

    for (let i = 0; i < numNetworkConns; i++) {
        let thisPort = networkConnections[i].thisPort;
        seenThisPorts.add(thisPort)
        if (i === numNetworkConns - 1) {
            console.log("Done with the for loop")
            forLoopDone = true;
        }
    }

    if (seenThisPorts.size() < numNetworkConns && forLoopDone) {
        console.log("Non-unique this port found within the form")
        errorIDSet.add("networkConnectionNonUniqueThisPortErrID")
    }

}

const networkConnectionUniqueOtherPort = async (networkConnections, errorIDSet) => {
    let seenOtherPorts = new Map();
    let numNetworkConns = networkConnections.length

    for (let i = 0; i < numNetworkConns; i++) {
        let otherAssetID = networkConnections[i].otherAssetID
        let otherPort = networkConnections[i].otherPort;

        if (seenOtherPorts.has(otherAssetID) && seenOtherPorts.get(otherAssetID).includes(otherPort)) {
            errorIDSet.add("networkConnectionNonUniqueOtherPortErrID")

        }
        else {
            seenOtherPorts.set(otherAssetID, otherPort)
        }
    }



}

const networkConnectionNumConnections = async (numConnectionsMade, thisModelName, errorIDSet) => {
    modelsRef.where("modelName", "==", thisModelName).get().then(function (querySnapshot) {
        //Number of ports on the model that you are trying to add an asset of
        console.log(querySnapshot.docs[0].data().modelName)
        let numThisModelPorts = querySnapshot.docs[0].data().networkPortsCount;

        if (numConnectionsMade > numThisModelPorts) {

            if (numThisModelPorts) {
                errorIDSet.add("networkConnectionIncorrectNumConnectionsErrID")

            }
            else {
                errorIDSet.add("networkConnectionModel0ErrID")
            }
        }
    })

}

//when do I call this? everytime submit is clicked
//pass in the correct parameters
async function addAssetChangePlanPackage(changePlanID, stepID, model, hostname, datacenter, rack, rackU, owner, assetID, powerConnections, networkConnections) {

    let oldNetworkConnections = null;
    assetID = assetID.toString()

    await rackNonExistent(changePlanID, stepID, rack, datacenter)
    await datacenterNonExistent(changePlanID, stepID, datacenter)
    await hostnameConflict(changePlanID, stepID, hostname)
    await ownerConflict(changePlanID, stepID, owner)
    await assetIDConflict(changePlanID, stepID, assetID)
    await modelConflict(changePlanID, stepID, model)

    //need to to test that all possible errors are caught at once
    // await rackUConflict(changePlanID, stepID, model, datacenter, rack, rackU)
    // await networkConnectionConflict(networkConnections, oldNetworkConnections, model)
    // await powerConnectionConflict(changePlanID, stepID, powerConnections, datacenter, rack, rackU, model, assetID)

}

async function addConflictToDB(changePlanID, stepID, fieldName, errorIDSet) {

    //Call this method at each validation function at the end, where appropriate
    //What if the stepID doc does not exist? Does .set() take care of this for you?
    //the answer: yes, set with merge will update fields in the document or create it if it doesn't exists
    let errorIDArray = [...errorIDSet]

    if (errorIDArray.length) {
        //console.log("Error ID(s) that will be added to the conflict/stepID doc: " + [...errorIDArray])
        changeplansRef.doc(changePlanID).collection('conflicts').doc(stepID).set({
            [fieldName]: errorIDArray

        }, { merge: true }).then(
            console.log("Successfully added the conflict to the database.")
        )

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

}