import { instanceRef, racksRef, modelsRef } from './firebaseutils'
import * as firebase from 'firebase/app'


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
                comment: doc.data().comment,

            });
        });


        if (callback) {
            callback(instanceArray);
        }
    }

    );
}

function addInstance(instanceid, model, hostname, rack, racku, owner, comment, callback) {
    instanceFitsOnRack(rack, racku, model, function (errorMessage) {
        //Allen wants me to add a vendor and modelname field to my document
        if (errorMessage) {
            callback(errorMessage)
            console.log(errorMessage)

        }
        //The rack doesn't exist, or it doesn't fit on the rack at rackU
        else {

            instanceRef.add({
                instance_id: instanceid,
                model: model,
                hostname: hostname,
                rack: rack,
                rackU: racku,
                owner: owner,
                comment: comment

            }).then(function (docRef) {
                callback(null);
            }).catch(function (error) {
               // callback("Error");
                console.log(error)

            })
        }

    }
    )

}


// This will check if the instance fits on rack: fits within in the height of rack, and does not conflict with other instances 

function instanceFitsOnRack(instanceRack, rackU, model, callback) {
    //need to go into models collection to get the height of model
    //need to go into racks to get total height of rack. Then, need to do
    // rackheight <= rackU + modelHeight 
    let splitRackArray = instanceRack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    //this already checks if the rack exists

    //https://stackoverflow.com/questions/46554793/are-cloud-firestore-queries-still-case-sensitive

    racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).get().then(function (querySnapshot) {
        if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number) {
            let rackHeight = querySnapshot.docs[0].data().height

            //console.log(modelsRef.where(modelsRef.id, "==", model))
            var docRef = modelsRef.doc(String(model))
            docRef.get().then(doc => {
                console.log(parseInt(rackU) + doc.data().height)
                if (rackHeight >= parseInt(rackU) + doc.data().height) {
                    console.log("Instance fits on rack")
                    callback(null)
                }
                else {
                    console.log("Instance of this model at this rackU will not fit on the rack")
                    var errMessage = "Instance of this model at this RackU will not fit on this rack"
                    callback(errMessage)

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
        if (doc.exists) {
            if (doc.data().instances && Object.keys(doc.data().instances).length > 0) {
                callback(null)
            } else {
                instanceRef.doc(instanceid).delete().then(function () {
                    callback(instanceid);
                }).catch(function (error) {
                    callback(null);
                })
            }
        } else {
            callback(null);
        }
    })


}

//check rackExistence already in instanceFitsOnRack, essentially the same query
// function checkRackExists(rack, callback) {
//     let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
//     let rackRow = splitRackArray[0]
//     let rackNum = parseInt(splitRackArray[1])
//     //https://stackoverflow.com/questions/46554793/are-cloud-firestore-queries-still-case-sensitive

//     racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).get().then(function (querySnapshot) {
//         if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number)
//         //&& Object.keys(querySnapshot.docs[0].data().letter).length > 0 && Object.keys(querySnapshot.docs[0].data().number).length > 0) 
//         {
//             console.log(querySnapshot.docs[0].data().height)
//             callback(null);

//         }
//         else {
//             callback(true);
//         }
//     })

// }


function updateInstance(instanceid, model, hostname, rack, racku, owner, comment, callback) {

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


//Function for autocomplete: query the database 

export { getInstance, addInstance, deleteInstance, instanceFitsOnRack, updateInstance }