import { assetRef, racksRef, modelsRef, usersRef, firebase, datacentersRef, changeplansRef } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as userutils from './userutils'
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

const hostnameConflict = async (changePlanID, stepID, hostname, assetID) => {
    let errorIDSet = new Set();
    assetRef.where("hostname", "==", hostname).get().then(async function (docSnaps) {
        if (!docSnaps.empty && assetID !== docSnaps.docs[0].id && hostname !== "") {

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
const powerConnectionConflict = async (changePlanID, stepID, powerConnections, datacenter, rack, rackU, model, assetID) => {
    let errorIDSet = new Set();

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

const networkConnectionConflict=



//when do I call this? everytime submit is clicked
//pass in the correct parameters
async function addAssetChangePlanPackage(changePlanID, stepID, model, hostname, datacenter, rack, rackU, owner, assetID, powerConnections) {

    

    await rackNonExistent(changePlanID, stepID, rack, datacenter)
    await datacenterNonExistent(changePlanID, stepID, datacenter)
    await rackUConflict(changePlanID, stepID, model, datacenter, rack, rackU)
    await hostnameConflict(changePlanID, stepID, hostname, assetID)
    await ownerConflict(changePlanID, stepID, owner)
    await powerConnectionConflict(changePlanID, stepID, powerConnections, datacenter, rack, rackU, model, assetID)


}

async function addConflictToDB(changePlanID, stepID, fieldName, errorIDSet) {

    //Call this method at each validation function at the end, where appropriate
    //What if the stepID doc does not exist? Does .set() take care of this for you?
    //the answer: yes, set with merge will update fields in the document or create it if it doesn't exists
    let errorIDArray = [...errorIDSet]

    if (errorIDArray.length) {
        console.log("Error ID(s) that will be added to the conflict/stepID doc: " + [...errorIDArray])
        changeplansRef.doc(changePlanID).collection('conflicts').doc(stepID).set({
            [fieldName]: errorIDArray

        }, { merge: true })

    }

}

export {
   
    addAssetChangePlanPackage,
    rackNonExistent,
    datacenterNonExistent,
    rackUConflict,
    hostnameConflict,
    ownerConflict,
    powerConnectionConflict

}