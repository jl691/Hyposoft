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

function addInstance(instanceid,  model, hostname, rack, racku, owner, comment, callback) {
    checkRackExists(rack, status => {

        if (!status) {
            instanceRef.add({
                instance_id: instanceid,
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

function checkRackExists(rack, callback) {
    let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])
    //https://stackoverflow.com/questions/46554793/are-cloud-firestore-queries-still-case-sensitive

    racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).get().then(function (querySnapshot) {
        if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number)
        //&& Object.keys(querySnapshot.docs[0].data().letter).length > 0 && Object.keys(querySnapshot.docs[0].data().number).length > 0)
        {
            console.log(querySnapshot.docs[0].data().height)
            callback(null);

        }
        else {
            callback(true);
        }
    })

}

// This will check if the instance fits on rack: fits within in the height of rack, and does not conflict with other instances

function instanceFitsOnRack(instanceRack, rackU, model, callback) {
    //need to go into models collection to get the height of model
    //need to go into racks to get total height of rack. Then, need to do
    // rackheight <= rackU + modelHeight
    let splitRackArray = instanceRack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])


    //https://stackoverflow.com/questions/46554793/are-cloud-firestore-queries-still-case-sensitive

    racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).get().then(function (querySnapshot) {
        if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number)
        {
            let rackHeight = querySnapshot.docs[0].data().height

            //console.log(modelsRef.where(modelsRef.id, "==", model))
            var docRef = modelsRef.doc(String(model))
            docRef.get().then(doc => {
                console.log(parseInt(rackU) + doc.data().height)
                if(rackHeight >= parseInt(rackU) + doc.data().height){
                    console.log("Bitch i made it")
                    callback(true)
                }
                else{
                    console.log("Instance of this model at this rackU will not fit on the rack")
                    callback(false)

                }

            })
            .catch( error => {
              console.log("Error getting documents: ", error)
              callback(null)
            })


        }
        else {
            console.log("Rack didn't exist, should be caught in checkRackExists function")
            callback(false);
        }
    })

}

function updateInstance(instanceid, model, hostname, rack, racku, owner, comment, callback){
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

function sortByKeyword(keyword,callback) {
    // maybe add limit by later similar to modelutils.getModels()
    instanceRef.orderBy(keyword).get().then(
      docSnaps => {
        const instances = docSnaps.docs.map( doc => (
          {id: doc.id}
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
                ? instanceRef.where("model",">=",userInput).where("model","<",userInput.slice(0,userInput.length-1)
                  + String.fromCharCode(userInput.slice(userInput.length-1,userInput.length).charCodeAt(0)+1))
                : instanceRef.orderBy('model')

    var modelArray = []
    query.get().then(querySnapshot => {
      querySnapshot.forEach( doc => {
        if (!modelArray.includes(doc.data().model)) {
          modelArray.push(doc.data().model)
        }
      })
      callback(modelArray)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

//Function for autocomplete: query the database

export { getInstance, addInstance, deleteInstance, checkRackExists, instanceFitsOnRack, updateInstance, sortByKeyword, getSuggestedModels }
