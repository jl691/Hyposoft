import { instanceRef }  from './firebaseutils'

//TODO: admin vs. user privileges

function getInstance(callback) {
    const instanceArray = [];
    instanceRef.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            instanceArray.push({

                id: doc.id,
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


// function addSingleRack(row, number, height, callback) {
//     //assume from validated
//     racksRef.add({
//         letter: row,
//         number: number,
//         height: height,
//         instances: []
//     }).then(function (docRef) {
//         callback(docRef.id);
//     }).catch(function (error) {
//         callback(null);
//     })
// }

function addInstance(model, hostname, rack, racku, owner, comment, callback) {
    instanceRef.add({
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