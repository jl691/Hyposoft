import { instanceRef, racksRef } from './firebaseutils'


//TODO: admin vs. user privileges


function getInstance(callback) {
    const instanceArray = [];
    instanceRef.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {

            instanceArray.push({

                instance_id: doc.id,
                //need to reference rack id
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
    },
    // IMPORTANT ===========================================
    //Uhh...this is super buggy. Need to look at add requirements again to modify add form fields and table
    // racksRef.get().then( function (querySnapshot){
    //     querySnapshot.forEach(function (document) {

    //         instanceArray.push({

    //             //need to reference rack id
    //             rack_id:document.id
  

    //         });
    //     });


    //     if (callback) {
    //         callback(instanceArray);
    //     }

    // })
    );
}

//TODO: go into racks document, need to add a rackID.
//So change the form, and change the backend.
//Data table ID needs to be changed too
function addInstance(instanceid, rackid, model, hostname, rack, racku, owner, comment, callback) {
    instanceRef.add({
        // This needs to refer to the rack ID
        InstanceID:instanceid,
        RackID: rackid,
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
//Function for autocomplete: query the database and 

export { getInstance, addInstance, deleteInstance }