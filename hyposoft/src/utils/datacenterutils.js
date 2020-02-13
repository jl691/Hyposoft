import * as firebaseutils from "./firebaseutils";
import * as rackutils from "./rackutils";
import {datacentersRef} from "./firebaseutils";

function getDatacenters(callback, start = null) {
    let datacenterCount = 1;
    console.log("yeeeeeeet")
    let datacenters = [];
    if (start) {
        firebaseutils.datacentersRef.orderBy("name").orderBy("abbreviation").limit(25).startAfter(start).get().then(docSnaps => {
            if (docSnaps.empty) {
                console.log("4")
                callback(null, null, true);
            } else {
                const newStart = docSnaps.docs[docSnaps.docs.length - 1];
                docSnaps.forEach(doc => {
                    console.log(doc.data())
                    datacenters.push({
                        count: datacenterCount,
                        id: doc.id,
                        name: doc.data().name,
                        abbreviation: doc.data().abbreviation,
                        rackCount: doc.data().racks.length
                    });
                    datacenterCount++;
                });
                console.log("3")
                callback(newStart, datacenters, false);
            }
        }).catch(function (error) {
            console.log("5")
            callback(null, null, true);
        });
    } else {
        firebaseutils.datacentersRef.orderBy("name").orderBy("abbreviation").limit(25).get().then(docSnaps => {
            console.log("yeet")
            if (docSnaps.empty) {
                console.log("2")
                callback(null, null, true);
            } else {
                const newStart = docSnaps.docs[docSnaps.docs.length - 1];
                console.log(docSnaps.docs)
                docSnaps.forEach(doc => {
                    console.log(doc.data())
                    datacenters.push({
                        count: datacenterCount,
                        id: doc.id,
                        name: doc.data().name,
                        abbreviation: doc.data().abbreviation,
                        rackCount: doc.data().racks.length
                    });
                    datacenterCount++;
                    if (datacenterCount === docSnaps.docs.length + 1) {
                        console.log("1")
                        callback(newStart, datacenters, false);
                    }
                });
            }
        }).catch(function (error) {
            console.log("6 ", error)
            callback(null, null, true);
        })
    }
}

function checkNameUnique(name, callback, self = null) {
    if (self && name === self) {
        callback(true);
    } else {
        firebaseutils.datacentersRef.where("name", "==", name).get().then(querySnapshot => {
            if (querySnapshot.empty) {
                callback(true);
            } else {
                callback(false);
            }
        })
    }
}

function checkAbbreviationUnique(abbrev, callback, self = null) {
    if (self && abbrev === self) {
        callback(true);
    } else {
        firebaseutils.datacentersRef.where("abbreviation", "==", abbrev).get().then(querySnapshot => {
            if (querySnapshot.empty) {
                callback(true);
            } else {
                callback(false);
            }
        })
    }
}

function addDatacenter(name, abbrev, callback) {
    checkNameUnique(name, nameResult => {
        if (nameResult) {
            checkAbbreviationUnique(abbrev, abbrevResult => {
                if (abbrevResult) {
                    firebaseutils.datacentersRef.add({
                        name: name,
                        abbreviation: abbrev,
                        racks: []
                    }).then(function () {
                        callback(true);
                    }).catch(function (error) {
                        callback(null);
                    })
                } else {
                    callback(null);
                }
            })
        } else {
            callback(null);
        }
    })
}

function deleteDatacenter(name, callback) {
    firebaseutils.datacentersRef.where("name", "==", name).get().then(querySnapshot => {
        if (querySnapshot.empty) {
            callback(null);
        } else {
            if (querySnapshot.docs[0].data().racks.length) {
                callback(null);
            } else {
                firebaseutils.datacentersRef.doc(querySnapshot.docs[0].id).delete().then(function () {
                    callback(true);
                }).catch(function (error) {
                    callback(null);
                })
            }
        }
    })
}

function updateDatacenter(oldName, oldAbbrev, newName, newAbbrev, callback) {
    if (oldName === newName && oldAbbrev === newAbbrev) {
        callback(true);
    }
    console.log("11")
    firebaseutils.datacentersRef.where("name", "==", oldName).get().then(querySnapshot => {
        if (querySnapshot.empty) {
            console.log("22")
            callback(null);
        } else {
            checkNameUnique(newName, result => {
                if (result) {
                    checkAbbreviationUnique(newAbbrev, abbrevResult => {
                        if (abbrevResult) {
                            datacentersRef.doc(querySnapshot.docs[0].id).set({
                                name: newName,
                                abbreviation: newAbbrev
                            }, {merge: true}).then(function () {
                                console.log("77")
                                callback(true);
                            }).catch(function (error) {
                                console.log("88")
                                callback(null);
                            })

                        } else {
                            console.log("99")
                            callback(null);
                        }
                    }, oldAbbrev);
                } else {
                    console.log("100")
                    callback(null);
                }
            }, oldName);
        }
    })
}

export {getDatacenters, addDatacenter, deleteDatacenter, updateDatacenter}