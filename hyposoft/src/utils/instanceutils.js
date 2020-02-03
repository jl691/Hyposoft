import {instanceRef, racksRef, modelsRef, usersRef, firebase} from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'

//TODO: admin vs. user privileges

function getInstance(callback) {
    instanceRef.limit(25).get().then(docSnaps => {
        const startAfter = docSnaps.docs[docSnaps.docs.length - 1];
        const instances = docSnaps.docs.map(doc => (
            {
                instance_id: doc.id,
                model: doc.data().model,
                hostname: doc.data().hostname,
                rack: doc.data().rack,
                rackU: doc.data().rackU,
                owner: doc.data().owner,
                comment: doc.data().comment
            }
        ))
        callback(startAfter, instances);
    }).catch(function (error) {
        callback(null, null)
    })
}


function getInstanceAt(start, callback) {
    console.log("the start after is " + start)
    instanceRef.startAfter(start).limit(25).get().then(docSnaps => {
        const newStart = docSnaps.docs[docSnaps.docs.length - 1];
        const instances = docSnaps.docs.map(doc => (
            {
                instance_id: doc.id,
                model: doc.data().model,
                hostname: doc.data().hostname,
                rack: doc.data().rack,
                rackU: doc.data().rackU,
                owner: doc.data().owner,
                comment: doc.data().comment
            }))
        callback(newStart, instances)
    }).catch(function (error) {
        callback(null, null);
    })
}

function addInstance(model, hostname, rack, racku, owner, comment, callback) {

    validateInstanceForm(model, hostname, rack, racku, owner, valid => {
        if (valid) {
            callback(valid)
        } else {
            modelutils.getModelByModelname(model, doc => {
                if (!doc) {
                    var errMessage = "Model does not exist"
                    callback(errMessage)
                } else {
                    if (model === "" || hostname === "" || rack === "" || racku == null) {
                        callback("Required fields cannot be empty")
                    } else {
                        checkHostnameExists(hostname, null, result => {
                            if (result) {
                                callback("Hostname already exists!")
                            } else {
                                instanceFitsOnRack(rack, racku, model, function (errorMessage, modelNum, modelVendor, rackID) {//see line 171
                                    console.log("Calling instancefitsonrack and returned")
                                    //Allen wants me to add a vendor and modelname field to my document
                                    if (errorMessage) {
                                        callback(errorMessage)
                                        console.log(errorMessage)
                                    }
                                    //The rack doesn't exist, or it doesn't fit on the rack at rackU
                                    else {
                                        instanceRef.add({
                                            modelId: doc.id,
                                            model: model,
                                            hostname: hostname,
                                            rack: rack,
                                            rackU: racku,
                                            owner: owner,
                                            comment: comment,
                                            rackID: rackID,
                                            //This is for rack usage reports
                                            modelNumber: modelNum,
                                            vendor: modelVendor,
                                        }).then(function (docRef) {
                                            racksRef.doc(String(rackID)).update({
                                                instances: firebase.firestore.FieldValue.arrayUnion(docRef.id)
                                            })
                                            callback(null);
                                        }).catch(function (error) {
                                            // callback("Error");
                                            console.log(error)
                                        })
                                    }
                                })
                            }
                        })
                    }
                }
            })
        }
    })


}


// This will check if the instance fits on rack (after checking rack exists): fits within in the height of rack, and does not conflict with other instances

function instanceFitsOnRack(instanceRack, rackU, model, callback) {

    let splitRackArray = instanceRack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    let rackID = null;

    rackutils.getRackID(rackRow, rackNum, id => {
        if (id) {

            rackID = id
            console.log(rackID)
        } else {
            console.log("Error: no rack for this letter and number")
        }
    })

    racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).get().then(function (querySnapshot) {
        if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number) {
            let rackHeight = querySnapshot.docs[0].data().height

            modelutils.getModelByModelname(model, doc => {
                //doc.data().height refers to model height
                if (rackHeight >= parseInt(rackU) + doc.data().height) {
                    //We know the instance will fit on the rack, but now does it conflict with anything?

                    console.log(rackU)
                    console.log(doc.data().height)
                    console.log(rackID)
                    rackutils.checkInstanceFits(rackU, doc.data().height, rackID, function (status) {

                        //can check length. If length > 0, then conflicting instances were returned
                        //means that there are conflicts.

                        if (status.length) {
                            console.log("Conflicts found on rack")
                            let height = doc.data().height
                            let rackedAt = rackU
                            let conflictNew = [];
                            let conflictCount = 0;
                            status.forEach(instanceID => {
                                getInstanceDetails(instanceID, result => {
                                    console.log(result.model + " " + result.hostname);
                                    conflictNew.push(result.model + " " + result.hostname + ", ");
                                    console.log(conflictNew)
                                    conflictCount++;
                                    if (conflictCount === status.length) {
                                        console.log(conflictNew)
                                        var errMessage = "instance of height " + height + " racked at " + rackedAt + "U conflicts with instance(s) " + conflictNew.join(', ').toString();
                                        callback(errMessage);
                                    }
                                });
                            })
                        } else {//status callback is null, no conflits
                            console.log("Instance fits in rack with no conflicts")
                            callback(null, doc.data().modelNumber, doc.data().vendor, rackID)

                        }
                    })
                } else {
                    console.log("Instance of this model at this rackU will not fit on the rack")
                    var errMessage = "Instance of this model at this RackU will not fit on this rack";
                    callback(errMessage);

                }
            })
        } else {
            console.log("Rack doesn't exist")
            var errMessage2 = "Rack does not exist"
            callback(errMessage2)
        }
    })
}

function deleteInstance(instanceid, callback) {

    instanceRef.doc(instanceid).get().then(function (doc) {

        //This is so I can go into racks collection and delete instances associated with the rack
        if (doc.exists) {
            let instanceRack = doc.data().rack
            let splitRackArray = instanceRack.split(/(\d+)/).filter(Boolean)
            let rackRow = splitRackArray[0]
            let rackNum = parseInt(splitRackArray[1])

            let rackID = null;

            rackutils.getRackID(rackRow, rackNum, id => {
                if (id) {

                    rackID = id
                    console.log(rackID)
                } else {
                    console.log("no rack for this letter and number")
                }
            })


            instanceRef.doc(instanceid).delete().then(function () {
                console.log("Deleting. This is the rackID: " + rackID)
                console.log("removing from database instace ID: " + instanceid)
                racksRef.doc(String(rackID)).update({

                    instances: firebase.firestore.FieldValue.arrayRemove(instanceid)
                })

                callback(instanceid);
            }).catch(function (error) {
                callback(null);
            })
        } else {
            console.log("Trying to delete instance that somehow isn't there??")
            callback(null);
        }
    })
}

function updateInstance(instanceid, model, hostname, rack, rackU, owner, comment, callback) {

    validateInstanceForm(model, hostname, rack, rackU, owner, valid => {
        if (valid) {
            callback(valid)
        } else {
            modelutils.getModelByModelname(model, doc => {
                if (!doc) {
                    var errMessage = "Model does not exist"
                    callback(errMessage)
                } else {

                    if (model === "" || hostname === "" || rack === "" || rackU == null) {
                        callback("Required fields cannot be empty")
                    } else {
                        checkHostnameExists(hostname, instanceid, result => {
                            if (result) {
                                callback("Hostname already exists.")
                            } else {
                                instanceFitsOnRack(rack, rackU, model, stat => {

                                    console.log(stat)
                                    //returned an error message
                                    if (stat) {

                                        var errMessage = stat
                                        //need to pass up errormessage if model updated and instance no longer fits
                                        callback(errMessage)
                                    }
                                    //returns null if no issues/conflicts.
                                    else {
                                        let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
                                        let rackRow = splitRackArray[0]
                                        let rackNum = parseInt(splitRackArray[1])
                                        //get new rack document
                                        rackutils.getRackID(rackRow, rackNum, result => {
                                            if (result) {
                                                //get old rack document
                                                instanceRef.doc(instanceid).get().then(docSnap => {
                                                    let oldRack = docSnap.data().rack;
                                                    let oldSplitRackArray = oldRack.split(/(\d+)/).filter(Boolean)
                                                    let oldRackRow = oldSplitRackArray[0]
                                                    let oldRackNum = parseInt(oldSplitRackArray[1])
                                                    var modelStuff = []
                                                    modelutils.getVendorAndNumberFromModel(model, name => modelStuff = name)
                                                    var rackId = ''
                                                    rackutils.getRackID(rack.slice(0,1),rack.slice(1,rack.length), name => rackId = name)
                                                    var modelId = ''
                                                    modelutils.getModelIdFromModelName(model, name => modelId = name)
                                                    rackutils.getRackID(oldRackRow, oldRackNum, oldResult => {
                                                        if (oldResult) {
                                                            //get new rack document
                                                            //get instance id
                                                            replaceInstanceRack(oldResult, result, instanceid, result => {
                                                                instanceRef.doc(String(instanceid)).update({
                                                                    model: model,
                                                                    modelId: modelId,
                                                                    vendor: modelStuff[0],
                                                                    modelNumber: modelStuff[1],
                                                                    hostname: hostname,
                                                                    rack: rack,
                                                                    rackU: rackU,
                                                                    rackID: rackId,
                                                                    owner: owner,
                                                                    comment: comment
                                                                    //these are the fields in the document to update

                                                                }).then(function () {
                                                                    console.log("Updated model successfully")
                                                                    callback(null);
                                                                }).catch(function (error) {
                                                                    console.log(error)
                                                                    callback(error);
                                                                })
                                                            })
                                                        }
                                                    })
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                }
            })
        }
    })
}


function getInstancesFromModel(model, callback) {
    instanceRef.where('model', '==', model).get().then(docSnaps => {
        const instances = docSnaps.docs.map(doc => (
            {id: doc.id, ...doc.data()}
        ))
        callback(instances)
    })
        .catch(error => {
            console.log("Error getting documents: ", error)
            callback(null)
        })
}

function sortByKeyword(keyword, callback) {
    // maybe add limit by later similar to modelutils.getModels()
    instanceRef.orderBy(keyword.toLowerCase()).get().then(
        docSnaps => {
            const instances = docSnaps.docs.map(doc => (
                {id: doc.id}
            ))
            console.log(instances)
            callback(instances)
        })
        .catch(error => {
            console.log("Error getting documents: ", error)
            callback(null)
        })
}

function getSuggestedModels(userInput, callback) {
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var modelArray = []
    modelsRef.orderBy('modelName').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const data = doc.data().modelName
            if (shouldAddToSuggestedItems(modelArray,data,userInput)) {
                modelArray.push(data)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            console.log("Error getting documents: ", error)
            callback(null)
        })
}

function getSuggestedOwners(userInput, callback) {
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var modelArray = []
    usersRef.orderBy('username').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const data = doc.data().username
            if (shouldAddToSuggestedItems(modelArray,data,userInput)) {
                modelArray.push(data)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            console.log("Error getting documents: ", error)
            callback(null)
        })
}

function getSuggestedRacks(userInput, callback) {
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var modelArray = []
    racksRef.orderBy('letter').orderBy('number').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
          const data = doc.data().letter + doc.data().number.toString()
            if (shouldAddToSuggestedItems(modelArray,data,userInput)) {
                modelArray.push(data)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            console.log("Error getting documents: ", error)
            callback(null)
        })
}

function shouldAddToSuggestedItems(array,data,userInput) {
    const name = data.toLowerCase()
    const lowerUserInput = userInput.toLowerCase()
    return !array.includes(data) && (!userInput
            || (name >= lowerUserInput
                && name < lowerUserInput.slice(0, lowerUserInput.length - 1)
                    + String.fromCharCode(lowerUserInput.slice(lowerUserInput.length - 1, lowerUserInput.length).charCodeAt(0) + 1)))
}

function getInstanceDetails(instanceID, callback) {

    instanceRef.doc(instanceID).get().then((doc) => {
            let inst = {
                instanceID: instanceID.trim(),
                model: doc.data().model.trim(),
                hostname: doc.data().hostname.trim(),
                rack: doc.data().rack.trim(),
                rackU: doc.data().rackU,
                owner: doc.data().owner.trim(),
                comment: doc.data().comment.trim(),
                modelNum: doc.data().modelNumber.trim(),
                vendor: doc.data().vendor.trim()


            }
            callback(inst)
        }
    );

}

//as long as it's not in the render, not accessible by the user ??
function validateInstanceForm(model, hostname, rack, racku, owner, callback) {
    //check required fields aren't empty
    //check model exists
    //legal hostname: done in AddInstanceForm and EditInstanceForm
    //racku : fits within height of the rack (what if they fill out the racku before rack?)
    //owner: must be someone in the system??

    // } TODO: see if Joyce breaks this

    //if owner is not null, need to check username in system
    if (owner !== "") {
        let username = owner;
        usersRef.where('username', '==', username).get().then(querySnapshot => {
            if (!querySnapshot.empty) {
                callback(null)
            } else {
                callback("This user does not exist")
            }
        })
    } else {
        callback(null)
    }

}

function replaceInstanceRack(oldRack, newRack, id, callback) {
    racksRef.doc(String(oldRack)).update({
        instances: firebase.firestore.FieldValue.arrayRemove(id)
    }).then(() => {
        racksRef.doc(String(newRack)).update({
            instances: firebase.firestore.FieldValue.arrayUnion(id)
        }).then(() => {
            callback(true);
        }).catch(function (error) {
            callback(false);
        })
    }).catch(function (error) {
        callback(false);
    })
}

function checkHostnameExists(hostname, id, callback) {
    instanceRef.where("hostname", "==", hostname).get().then(function (docSnaps) {
        callback(!docSnaps.empty && id != docSnaps.docs[0].id)
    })
}

export {
    getInstance,
    addInstance,
    deleteInstance,
    instanceFitsOnRack,
    updateInstance,
    sortByKeyword,
    getSuggestedModels,
    getInstanceDetails,
    getInstancesFromModel,
    getSuggestedOwners,
    getSuggestedRacks,
    getInstanceAt,
    validateInstanceForm
}
