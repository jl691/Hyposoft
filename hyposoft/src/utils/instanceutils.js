import {instanceRef, racksRef, modelsRef, usersRef, firebase} from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as userutils from './userutils'

//TODO: admin vs. user privileges
const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('instances')

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
function forceAddInstancesToDb(toBeAdded) {
    var rackIDs = {}
    var modelIDs = {}
    function addAll() {
        for (var i = 0; i < toBeAdded.length; i++) {
            const instance = toBeAdded[i]
            console.log(modelIDs)
            instanceRef.add({
                modelId: modelIDs[instance.vendor+' '+instance.model_number],
                model: instance.vendor+' '+instance.model_number,
                hostname: instance.hostname,
                rack: instance.rack,
                rackU: instance.rack_position,
                owner: instance.owner,
                comment: instance.comment,
                rackID: rackIDs[instance.rack],
                //This is for rack usage reports
                modelNumber: instance.model_number,
                vendor: instance.vendor,
            }).then(function (docRef) {

                docRef.get().then(ds => {
                    racksRef.doc(ds.data().rackID).update({
                        instances: firebase.firestore.FieldValue.arrayUnion(ds.id)
                    })
                    index.saveObject({...ds.data(), objectID: ds.id})
                })
            })
        }
    }
    for (var i = 0; i < toBeAdded.length; i++) {
        const instance = toBeAdded[i]
        rackutils.getRackID(String(instance.rack)[0], parseInt(String(instance.rack).substring(1)), id => {
            rackIDs[instance.rack] = id
            if (Object.keys(rackIDs).length === toBeAdded.length && Object.keys(modelIDs).length === toBeAdded.length) {
                addAll()
            }
        })
        modelutils.getModelByModelname(instance.vendor+' '+instance.model_number, doc => {
            modelIDs[doc.data().vendor+' '+doc.data().modelNumber] = doc.id
            if (Object.keys(rackIDs).length === toBeAdded.length && Object.keys(modelIDs).length === toBeAdded.length) {
                addAll()
            }
        })
    }
}

function forceModifyInstancesInDb(toBeModified) {
    var rackIDs = {}
    var modelIDs = {}
    function modifyAll() {
        for (var i = 0; i < toBeModified.length; i++) {
            const instance = toBeModified[i]
            instanceRef.doc(instance.instanceIdInDb).get().then(ds => {
                const oldRackID = ds.data().rackID
                racksRef.doc(oldRackID).update({
                    instances: firebase.firestore.FieldValue.arrayRemove(oldRackID)
                })
            })

            instanceRef.doc(instance.instanceIdInDb).update({
                rack: instance.rack,
                rackU: instance.rack_position,
                owner: instance.owner,
                comment: instance.comment,
                rackID: rackIDs[instance.rack],
            }).then(() => {
                instanceRef.doc(instance.instanceIdInDb).get().then(ds => {
                    index.saveObject({...ds.data(), objectID: ds.id})
                })
            })
            racksRef.doc(rackIDs[instance.rack]).update({
                instances: firebase.firestore.FieldValue.arrayUnion(instance.instanceIdInDb)
            })
        }
    }
    for (var i = 0; i < toBeModified.length; i++) {
        const instance = toBeModified[i]
        rackutils.getRackID(String(instance.rack)[0], parseInt(String(instance.rack).substring(1)), id => {
            rackIDs[instance.rack] = id
            if (Object.keys(rackIDs).length === toBeModified.length && Object.keys(modelIDs).length === toBeModified.length) {
                modifyAll()
            }
        })
        modelutils.getModelByModelname(instance.vendor+' '+instance.model_number, doc => {
            modelIDs[doc.data().vendor+' '+doc.data().mode_number] = doc.id
            if (Object.keys(rackIDs).length === toBeModified.length && Object.keys(modelIDs).length === toBeModified.length) {
                modifyAll()
            }
        })
    }
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
                                            docRef.get().then(ds => {
                                                index.saveObject({...ds.data(), objectID: ds.id})
                                            })
                                            callback(null);
                                        }).catch(function (error) {
                                            // callback("Error");
                                            console.log(error)
                                        })
                                    }
                                })
                            }
                        }) //checkInstanceFits in rackutils will check against self if instance id is passed in
                    }
                }
            })
        }
    })


}


// This will check if the instance fits on rack (after checking rack exists): fits within in the height of rack, and does not conflict with other instances
// The echo param was added by Anshu and will be passed back via callback to the import functions as-is
// The param does NOT affect this function at all
function instanceFitsOnRack(instanceRack,  rackU, model, callback, instance_id=null, echo=null) {

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
                                console.log("Passing in instance id: " + instance_id)
                                getInstanceDetails(instanceID, result => {
                                    console.log(result.model + " " + result.hostname);
                                    conflictNew.push(result.model + " " + result.hostname + ", ");
                                    console.log(conflictNew)
                                    conflictCount++;
                                    if (conflictCount === status.length) {
                                        console.log(conflictNew)
                                        var errMessage = "instance of height " + height + " racked at " + rackedAt + "U conflicts with instance(s) " + conflictNew.join(', ').toString();
                                        if (!echo) {
                                            callback(errMessage);
                                        }
                                        else {
                                           callback({error: errMessage, echo: echo})
                                        }
                                    }
                                });
                            })
                        } else {//status callback is null, no conflits
                            console.log("Instance fits in rack with no conflicts")
                            if (!echo) {
                                callback(null, doc.data().modelNumber, doc.data().vendor, rackID)
                            }
                            else {
                                callback({error: null, echo: echo})
                            }

                        }
                    }, instance_id) //if you pass in a null to checkInstanceFits
                }
                else {
                    console.log("Instance of this model at this rackU will not fit on the rack")
                    var errMessage = "Instance of this model at this RackU will not fit on this rack";
                    if (!echo) {
                        callback(errMessage);
                    } else {
                        callback({error: errMessage, echo: echo})
                    }

                }
            })
        } else {
            console.log("Rack doesn't exist")
            var errMessage2 = "Rack does not exist"
            if (!echo) {
                callback(errMessage2)
            } else {
                callback({error: errMessage2, echo: echo})
            }
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
                console.log("removing from database instance ID: " + instanceid)
                racksRef.doc(String(rackID)).update({

                    instances: firebase.firestore.FieldValue.arrayRemove(instanceid)
                })
                index.deleteObject(instanceid)
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
                                    console.log("returneddddd")
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
                                                                    instanceRef.doc(String(instanceid)).get().then(docRef => {
                                                                        index.saveObject({...docRef.data(), objectID: docRef.id})
                                                                    })
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
                                }, instanceid)
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
        callback(!docSnaps.empty && id !== docSnaps.docs[0].id)
    })
}

function getInstanceByHostname(hostname, callback, echo=null) {
    instanceRef.where("hostname", "==", hostname).get().then(function (docSnaps) {
        if(!docSnaps.empty) {
            callback({...docSnaps.docs[0].data(), found: true, echo: echo, id: docSnaps.docs[0].id})
        } else {
            callback({found: false, echo: echo, id: null})
        }
    })
}

//doublecheck that it works with infinite scroll, and will autorefresh if button is clicked
//Do this after UI/UX overhaul
function combinedRackAndRackUSort(hostname, callback) {


}

function getInstancesForExport (callback) {
    instanceRef.orderBy('hostname').get().then(qs => {
        var rows = [
            ["hostname", "rack", "rack_position", "vendor", "model_number", "owner", "comment"]
        ]

        for (var i = 0; i < qs.size; i++) {
            rows = [...rows, [
                modelutils.escapeStringForCSV(qs.docs[i].data().hostname),
                modelutils.escapeStringForCSV(qs.docs[i].data().rack),
                ''+qs.docs[i].data().rackU,
                modelutils.escapeStringForCSV(qs.docs[i].data().vendor),
                modelutils.escapeStringForCSV(qs.docs[i].data().modelNumber),
                modelutils.escapeStringForCSV(qs.docs[i].data().owner),
                modelutils.escapeStringForCSV(qs.docs[i].data().comment)
            ]]
            if (rows.length === qs.size+1) {
                callback(rows)
            }
        }
    })
}

function validateImportedInstances (data, callback) {
    modelutils.getAllModels(listOfModels => {
        userutils.getAllUsers(listOfUsers => {
            console.log(listOfModels)
            console.log(listOfUsers)
            var errors = []
            var toBeAdded = []
            var toBeModified = []
            var toBeIgnored = []

            var instancesSeen = {}
            var instancesProcessed = 0

            function checkAndCallback() {
                instancesProcessed++
                if (instancesProcessed === data.length) {
                    callback({errors, toBeAdded, toBeModified, toBeIgnored})
                }
            }

            for (var i = 0; i < data.length; i++) {
                const datum = data[i]
                var canProceedWithDbValidation = true
                var vendorAndModelFound = true
                if (!datum.vendor || String(datum.vendor).trim() === '') {
                    errors = [...errors, [i+1, 'Vendor not found']]
                    canProceedWithDbValidation = false
                    vendorAndModelFound = false
                }
                if (!datum.model_number || String(datum.model_number).trim() === '') {
                    errors = [...errors, [i+1, 'Model number not found']]
                    canProceedWithDbValidation = false
                    vendorAndModelFound = false
                }
                if (!datum.hostname || String(datum.hostname).trim() === '') {
                    errors = [...errors, [i+1, 'Hostname not found']]
                    canProceedWithDbValidation = false
                } else {
                    if(!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/.test(datum.hostname)){
                        //not a valid hostname
                        errors = [...errors, [i+1, 'Invalid hostname (does not follow RFC-1034 specs)']]
                        canProceedWithDbValidation = false
                    }

                    if (!(datum.hostname in instancesSeen)) {
                        instancesSeen[datum.hostname] = i
                    } else {
                        canProceedWithDbValidation = false
                        errors = [...errors, [i+1, 'Duplicate row (an instance with this hostname already exists on row '+(instancesSeen[datum.hostname]+1)+')']]
                    }
                }
                if (!datum.rack_position || String(datum.rack_position).trim() === '') {
                    errors = [...errors, [i+1, 'Rack position not found']]
                    canProceedWithDbValidation = false
                } else if (isNaN(String(datum.rack_position).trim()) || !Number.isInteger(parseFloat(String(datum.rack_position).trim())) || parseInt(String(datum.rack_position).trim()) <= 0) {
                    errors = [...errors, [i+1, 'Rack position is not a positive integer']]
                    canProceedWithDbValidation = false
                }
                if (!datum.rack || String(datum.rack).trim() === '') {
                    errors = [...errors, [i+1, 'Rack field missing']]
                    canProceedWithDbValidation = false
                } else if(!/[A-Z]\d+/.test(datum.rack)){
                    //not a valid rack
                    errors = [...errors, [i+1, 'Invalid rack']]
                    canProceedWithDbValidation = false
                }
                if (!datum.owner || String(datum.owner).trim() === '') {
                    // errors = [...errors, [i+1, 'Owner field missing']]
                    // canProceedWithDbValidation = false
                } else if (!listOfUsers.includes(datum.owner)) {
                    errors = [...errors, [i+1, 'Owner does not exist']]
                    canProceedWithDbValidation = false
                }

                if (!(vendorAndModelFound && String(datum.vendor).trim() in listOfModels && listOfModels[String(datum.vendor).trim()].includes(String(datum.model_number).trim()))) {
                    errors = [...errors, [i+1, 'Model does not exist']]
                    canProceedWithDbValidation = false
                }

                if (canProceedWithDbValidation) {
                    data[i].hostname = String(datum.hostname).trim()
                    data[i].vendor = String(datum.vendor).trim()
                    data[i].rack= String(datum.rack).trim()
                    data[i].model_number = String(datum.model_number).trim()
                    data[i].owner = (datum.owner ? String(datum.owner) : "")
                    data[i].comment = (datum.comment ? String(datum.comment) : "")

                    getInstanceByHostname(datum.hostname.trim(), instance => {
                        const datum = data[instance.echo]
                        const datumOwner = (!datum.owner ? "" : datum.owner.trim())
                        const datumComment = (!datum.comment ? "" : datum.comment.trim())

                        const instanceOwner = (!instance.owner ? "" : instance.owner.trim())
                        const instanceComment = (!instance.comment ? "" : instance.comment.trim())

                        if (instance.found) {
                            if (instance.vendor.trim() !== datum.vendor.trim() || instance.modelNumber.trim() !== datum.model_number.trim()) {
                                errors = [...errors, [instance.echo+1, 'Another instance (of a different model) that has the same hostname exists']]
                                checkAndCallback()
                            } else if (datum.rack_position === instance.rackU && datum.rack.trim() === instance.rack.trim()
                                && datumOwner === instanceOwner && datumComment === instanceComment) {
                                // IGNORE CASE
                                toBeIgnored = [...toBeIgnored, datum]
                                checkAndCallback()
                            } else {
                                // MODIFY CASE
                                instanceFitsOnRack(datum.rack,  datum.rack_position, datum.vendor+' '+datum.model_number, ({error, echo}) => {
                                    const datum = data[instance.echo]
                                    if (error) {
                                        errors = [...errors, [instance.echo+1, 'This instance could not be placed at the requested location']]
                                        checkAndCallback()
                                    } else {
                                        toBeModified = [...toBeModified, {...datum, row: instance.echo+1, instanceIdInDb: instance.id}]
                                        checkAndCallback()
                                    }
                                }, instance.id, instance.echo)
                            }
                        } else {
                            // ADDITION CASE
                            instanceFitsOnRack(datum.rack,  datum.rack_position, datum.vendor+' '+datum.model_number, ({error, echo}) => {
                                const datum = data[instance.echo]
                                if (error) {
                                    errors = [...errors, [instance.echo+1, 'This instance could not be placed at the requested location']]
                                    checkAndCallback()
                                } else {
                                    toBeAdded = [...toBeAdded, datum]
                                    checkAndCallback()
                                }
                            }, null, instance.echo)
                        }
                    }, i)
                } else {
                    checkAndCallback()
                }
            }
        })
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
    validateInstanceForm,
    combinedRackAndRackUSort,
    getInstancesForExport,
    validateImportedInstances,
    forceAddInstancesToDb,
    forceModifyInstancesInDb
}
