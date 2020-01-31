import { instanceRef, racksRef, modelsRef, db, firebase } from './firebaseutils'
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

function addInstance(instanceid, model, hostname, rack, racku, owner, comment, callback) {
    modelutils.getModelByModelname(model, doc => {
        if (!doc) {
            callback('Model does not exist')
        } else {
            instanceFitsOnRack(rack, racku, model, function (errorMessage, modelVendor, modelNum, rackID) {
                //Allen wants me to add a vendor and modelname field to my document
                if (errorMessage) {
                    callback(errorMessage)
                    console.log(errorMessage)

                }
                //The rack doesn't exist, or it doesn't fit on the rack at rackU
                else {
                    instanceRef.add({
                        modelId: doc.id,
                        instance_id: instanceid,
                        model: model,
                        hostname: hostname,
                        rack: rack,
                        rackU: racku,
                        owner: owner,
                        comment: comment,
                        rackID: rackID,
                        //This is for rack usage reports
                        vendor: modelVendor,
                        modelNumber: modelNum


                    }).then(function (docRef) {
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
                        else{//status callback is null, no conflits
                            console.log("Instance fits in rack with no conflicts")
                            callback(null, doc.data().modelNumber, doc.data().vendor, rackID)

                        }
                    })
                }
                else {
                    console.log("Instance of this model at this rackU will not fit on the rack")
                    var errMessage = "Instance of this model at this RackU will not fit on this rack";
                    callback(errMessage);

                }
            })
        }
        else {
            console.log("Rack doesn't exist")
            var errMessage2 = "Error adding instance: rack does not exist"
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

function updateInstance(instanceid, model, hostname, rack, rackU, owner, comment, callback) {

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
            instanceRef.doc(String(instanceid)).update({
                model,
                hostname,
                rack,
                rackU,
                owner,
                comment
                //these are the fields in the document to update

            }).then(function () {
                console.log("Updated model successfully")
                callback(null);
            }).catch(function (error) {
                console.log(error)
                callback(error);
            })
        }
    })
}


function getInstancesFromModel(model,callback) {
  instanceRef.where('model','==',model).get().then( docSnaps => {
    const instances = docSnaps.docs.map( doc => (
      {id: doc.id, ...doc.data()}
    ))
    callback(instances)
  })
  .catch( error => {
    console.log("Error getting documents: ", error)
    callback(null)
  })
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
  var modelArray = []
  modelsRef.orderBy('modelName').get().then(querySnapshot => {
    querySnapshot.forEach( doc => {
      const modelName = doc.data().modelName.toLowerCase()
      const lowerUserInput = userInput.toLowerCase()
      if (!userInput
          || (!modelArray.includes(doc.data().modelName)
              && modelName.localeCompare(lowerUserInput) >= 0
              && modelName.localeCompare(lowerUserInput.slice(0,lowerUserInput.length-1)
                  + String.fromCharCode(lowerUserInput.slice(lowerUserInput.length-1,lowerUserInput.length).charCodeAt(0)+1)) < 0)) {
          modelArray.push(doc.data().modelName)
        }
    })
    callback(modelArray)
  })
  .catch( error => {
    console.log("Error getting documents: ", error)
    callback(null)
  })
}

function getInstanceDetails(instanceID, callback) {

    let instanceHardCoded='nUIqYpZqe0GIg1wBEdjh'

    instanceRef.doc(instanceHardCoded).get().then((doc) => {
        let inst = {
            instanceID: instanceHardCoded, //instanceID
            model: doc.data().model.trim(),
            hostname: doc.data().hostname.trim(),
            rack: doc.data().rack.trim(),
            rackU: doc.data().rackU,
            owner: doc.data().owner.trim(),
            comment: doc.data().comment.trim()


        }
        callback(inst)
    }

    );

}

export { getInstance, addInstance, deleteInstance, instanceFitsOnRack, updateInstance, sortByKeyword, getSuggestedModels, getInstanceDetails, getInstancesFromModel, getInstanceAt }
