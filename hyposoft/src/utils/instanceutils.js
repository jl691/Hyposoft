import { instanceRef } from './firebaseutils'

//Need to merge with allen for racksRef

//TODO: admin vs. user privileges

function getInstance(callback) {
    const instanceArray = [];
    instanceRef.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            instanceArray.push({

                doc_id: doc.id,
                model: doc.data().Model,
                hostname: doc.data().Hostname,
                rack: doc.data().Rack,
                rackU: doc.data().RackU,
                owner: doc.data().Owner,
                comment: doc.data().Comment,

            });
        });
        if (callback) {
            callback(instanceArray);
        }
    });
}

//TODO: go into racks document, need to add a rackID.
//So change the form, and change the backend.
//Data table ID needs to be changed too
function addInstance(id, model, hostname, rack, racku, owner, comment, callback) {
    instanceRef.add({
        ID: id,
        Model: model,
        Hostname: hostname,
        Rack: rack,
        RackU: racku,
        Owner: owner,
        Comment: comment

    }).then(function (docRef) {
        callback(docRef.id);
    }).catch(function (error) {
        callback(null);
    })
}

function deleteInstance(id, callback) {

   instanceRef.doc(id).get().then(function (doc) {
        if (doc.exists) {
            if (doc.data().instances && Object.keys(doc.data().instances).length > 0) {
                callback(null)
            } else {
                instanceRef.doc(id).delete().then(function () {
                    callback(id);
                }).catch(function (error) {
                    callback(null);
                })
            }
        } else {
            callback(null);
        }
    })


}
//Function for autocomplete: query the database and 

export { getInstance, addInstance, deleteInstance }