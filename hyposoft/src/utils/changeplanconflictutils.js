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
    let errorID = null;

    rackutils.getRackID(rackRow, rackNum, datacenter, async function (rackID) {

        if (!rackID) {
            errorID = "rackErrID"

            await addConflictToDB(changePlanID, stepID, "rack", errorID);
            console.log("From the error strings resource file: " + errorStrings.rackErrID)

        }

    })

}

const datacenterNonExistent = async (changePlanID, stepID, datacenterName) => {
    let errorID = null;
    datacenterutils.getDataFromName(datacenterName, async function (data) {
        if (!data) {
            errorID = "datacenterErrID"
            await addConflictToDB(changePlanID, stepID, "datacenter", errorID)
            console.log("From the error strings resource file: " + errorStrings.datacenterErrID)
        }

    })

}

//for add. When editing the pchange plan, how to check for self-conflicting?
const rackUConflict = async (changePlanID, stepID, model, datacenter, rackName, rackU) => {
    let splitRackArray = rackName.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    let errorID = null;

    //need to get the rackID
    rackutils.getRackID(rackRow, rackNum, datacenter, async function (rackID) {

        racksRef.doc(rackID).get().then(async function (querySnapshot) {
            //checking if the rack exists
            if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number) {
                let rackHeight = querySnapshot.docs[0].data().height
                modelutils.getModelByModelname(model, async function (doc) {
                    //doc.data().height refers to model height
                    if (rackHeight > parseInt(rackU) + doc.data().height) {
                        //need to get get model height
                        rackutils.checkAssetFits(rackU, doc.data().height, rackID, async function (status) {
                            if (status) {
                                errorID = "rackUConflictErrID"
                                await addConflictToDB(changePlanID, stepID, "rackU", errorID)
                                console.log("From the error strings resource file: " + errorStrings.rackUConflictErrID)

                            }
                        })
                    }
                    else {
                        //the asset at the rackU will not fit within the rack
                        errorID = "rackUFitErrID"
                        await addConflictToDB(changePlanID, stepID, "rackU", errorID)
                        console.log("From the error strings resource file: " + errorStrings.rackUFitErrID)
                    }
                })
            }
        })
    })

}

//checks if there is already an asset in the live data with the same hostname you are trying to add
//when adding an asset, pass in null for asset ID. Otherwise, for editing, pass the correct ID in
const hostnameConflict = async (changePlanID, stepID, hostname, assetID) =>{
    let errorID=null;
    assetRef.where("hostname", "==", hostname).get().then( async function(docSnaps) {
        if (!docSnaps.empty && assetID !== docSnaps.docs[0].id && hostname !== "") {

            errorID = "hostnameErrID"
            await addConflictToDB(changePlanID, stepID, "hostname", errorID)
            console.log("From the error strings resource file: " + errorStrings.hostnameErrID)
           
        }
       
    })

}

const ownerConflict = async (changePlanID, stepID, owner) =>{
    let errorID = null;
    if (owner !== "") {
        let username = owner;
        usersRef.where('username', '==', username).get().then( async function(querySnapshot){
            if (querySnapshot.empty) {
                errorID = "ownerErrID"
                await addConflictToDB(changePlanID, stepID, "owner", errorID)
                console.log("From the error strings resource file: " + errorStrings.ownerErrID)
                

            }
        })
    }
}

//Already used with

//onst powerPortConflicts = async (changePlanID, stepID, powerPorts)


//when do I call this? everytime submit is clicked
//pass in the correct parameters
async function addAssetChangePlanPackage(changePlanID) {
    // await rackNonExistent(changePlanID, "step1docID", "Z1", "WC1")
    await datacenterNonExistent(changePlanID, "step1docID", "testFakeName")

}


async function addConflictToDB(changePlanID, stepID, fieldName, errID) {

    //Call this method at each validation function at the end, where appropriate

    //TODO:whenever a change plan is made, need to add the conflicts subcollection
    console.log("Step document id: " + stepID)
    console.log('FieldName to put into database: ' + fieldName)

    //what if the stepID doc does not exist?
    changeplansRef.doc(changePlanID).collection('conflicts').doc(stepID).set({
        //fieldName: errID
        [fieldName]: errID

    }, { merge: true })

}



export {
    rackNonExistent,
    addAssetChangePlanPackage,


}