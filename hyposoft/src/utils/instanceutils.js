import { instanceRef }  from './firebaseutils'

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

export { getInstance, addInstance}