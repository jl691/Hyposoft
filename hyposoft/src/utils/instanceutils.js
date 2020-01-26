import { instanceRef, racksRef } from './firebaseutils'


//TODO: admin vs. user privileges


function getInstance(callback) {
    const instanceArray = [];
    //We want to display the rack ID
    //This means, depending on the rack we get from doc.data().rack of instanceRef, we then need to 




    instanceRef.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            let splitRackArray = doc.data().rack.split(/(\d+)/).filter(Boolean)
            let rackRow = splitRackArray[0]
            let rackNum = parseInt(splitRackArray[1])

            // Here is the query to get the rack ID that the instance is related to
            // let getRackQuery = racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).get().then(snapshot => {
            //     if (snapshot.empty) {
            //         console.log('ERROR INSTANCE IS ON NONEXISTANT RACK.');
            //         return;
            //     }
            //     snapshot.forEach(doc => {
            //         console.log(doc.id, '=>', doc.data());
            //     });

            // })
            //     .catch(err => {
            //         console.log('Error getting documents', err);
            //     });
            //=======================================

    //          console.log(getRackQuery)

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

//TODO: go into racks document, need to add a rackID.
//So change the form, and change the backend.
//Data table ID needs to be changed too
function addInstance(instanceid, rackid, model, hostname, rack, racku, owner, comment, callback) {
    checkRackExists(rack, status => {

        if (!status) {
            instanceRef.add({
                // This needs to refer to the rack ID
                instance_id: instanceid,
                rack_id: rackid,
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


        }
        else {
            callback(null)
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

//Need to get rack information as well
function checkRackExists(rack, callback) {
    let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])
    //https://stackoverflow.com/questions/46554793/are-cloud-firestore-queries-still-case-sensitive

    racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).get().then(function (querySnapshot) {
        if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number)
        //&& Object.keys(querySnapshot.docs[0].data().letter).length > 0 && Object.keys(querySnapshot.docs[0].data().number).length > 0) 
        {
            callback(null);
        }
        else {
            callback(true);
        }
    })

}

function checkInstanceFitsOnRack(rackU, callback) {
    //need to go into models collection to get the height of model
}



//Function for autocomplete: query the database and 

export { getInstance, addInstance, deleteInstance, checkRackExists }