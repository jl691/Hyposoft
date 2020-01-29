import { instanceRef, racksRef, modelsRef, db, firebase } from './firebaseutils'
import * as rackutils from './rackutils'

//TODO: admin vs. user privileges


function getInstance(callback) {
    const instanceArray = [];

    instanceRef.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            //TODO: make sure instance is linked with the correct model. So in the model column on the InstanceTable, should show either modelID or the model name
            instanceArray.push({

                instance_id: doc.id,
                model: doc.data().model,
                hostname: doc.data().hostname,
                rack: doc.data().rack,
                rackU: doc.data().rackU,
                owner: doc.data().owner,
                comment: doc.data().comment

            });
        });


        if (callback) {
            callback(instanceArray);
        }
    }

    );
}

//check: when you delete an isntance, need to delete the ID from rackRef as well
function addInstance(model, hostname, rack, racku, owner, comment, callback) {
    //whenever there's a function, it's like a new 'thread', which is why print statements may be out of order
    instanceFitsOnRack(rack, racku, model, function (errorMessage, modelNum, modelVendor, rackID) {

        if (errorMessage) {
            callback(errorMessage)
            console.log(errorMessage)

        }
        else {

            instanceRef.add({

                model: model,
                hostname: hostname,
                rack: rack,
                rackU: racku,
                owner: owner,
                comment: comment,

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
        }
        else {
            console.log("Error: no rack for this letter and number")
        }
    })

    racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).get().then(function (querySnapshot) {
        if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number) {
            let rackHeight = querySnapshot.docs[0].data().height

            var docRef = modelsRef.doc(String(model))
            docRef.get().then(doc => {

                //doc.data().height refers to model height
                if (rackHeight >= parseInt(rackU) + doc.data().height) {
                    //We know the instance will fit on the rack, but now does it conflict with anything?

                    rackutils.checkInstanceFits(parseInt(rackU), parseInt(doc.data().height), rackID, function (status) {

                        //can check length. If length > 0, then conflicting instances were returned
                        //means that there are conflicts. 
                        console.log(status)

                        if (status.length) {
                            console.log("Conflicts found on rack")
                            var height = doc.data().height
                            var rackedAt = rackU
                            var conflicts = ""
                            var arrayLength = status.length;
                            for (var i = 0; i < arrayLength; i++) {
                                console.log(status[i]);
                                conflicts = conflicts + ", " + status[i]

                            }

                            var errMessage = "Error adding instance: instance of height " + height + " racked at " + rackedAt + "U conflicts with instance(s) " + conflicts;
                            callback(errMessage);
                        }
                        else {//status callback is empty array, no conflits
                            console.log("Instance fits in rack with no conflicts");
                            callback(null, doc.data().modelNumber, doc.data().vendor, rackID);

                        }

                    })
                }
                else {
                    console.log("Instance of this model at this rackU will not fit on the rack")
                    var errMessage = "Instance of this model at this RackU will not fit on this rack";
                    callback(errMessage);

                }

            })
                .catch(error => {
                    console.log("Error getting documents: ", error)
                    callback("Error")
                })
        }
        else {
            console.log("Rack doesn't exist")
            var errMessage = "Error adding instance: rack does not exist"
            callback(errMessage)
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
                }
                else {
                    console.log("Error: no rack for this letter and number")
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

function updateInstance(instanceid, model, hostname, rack, racku, owner, comment, callback) {
    console.log(instanceRef.doc(String(instanceid)))

    instanceRef.doc(String(instanceid)).update({

        model: model,
        hostname: hostname,
        rack: rack,
        rackU: racku,
        owner: owner,
        comment: comment



    }).then(function (docRef) {
        callback(docRef.id);
    }).catch(function (error) {
        callback(null);
    })
    console.log("in updateInstance backend method")

}

function sortByKeyword(keyword, callback) {
    // maybe add limit by later similar to modelutils.getModels()
    instanceRef.orderBy(keyword).get().then(
        docSnaps => {
            const instances = docSnaps.docs.map(doc => (
                { id: doc.id }
            ))
            callback(instances)
        })
        .catch(error => {
            console.log("Error getting documents: ", error)
            callback(null)
        })
}

function getSuggestedModels(userInput, callback) {
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var query = userInput
        ? instanceRef.where("model", ">=", userInput).where("model", "<", userInput.slice(0, userInput.length - 1)
            + String.fromCharCode(userInput.slice(userInput.length - 1, userInput.length).charCodeAt(0) + 1))
        : instanceRef.orderBy('model')

    var modelArray = []
    query.get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            if (!modelArray.includes(doc.data().model)) {
                modelArray.push(doc.data().model)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            console.log("Error getting documents: ", error)
            callback(null)
        })
}

//Function for autocomplete: query the database

export { getInstance, addInstance, deleteInstance, instanceFitsOnRack, updateInstance, sortByKeyword, getSuggestedModels }
