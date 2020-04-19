import * as firebaseutils from "./firebaseutils";
import * as assetnetworkportutils from "./assetnetworkportutils";
import * as logutils from "./logutils"
import * as assetutils from "./assetutils"
import * as rackutils from "./rackutils"
import * as decommissionutils from "./decommissionutils"
import * as changeplanconflictutils from './changeplanconflictutils'
import * as datacenterutils from './datacenterutils'
import * as offlinestorageutils from './offlinestorageutils'
import * as modelutils from './modelutils'
import * as bladeutils from './bladeutils'
import {changeplansRef} from "./firebaseutils";
import {assetRef} from "./firebaseutils";
import {racksRef} from "./firebaseutils";
import {firebase} from "./firebaseutils";
import * as assetIDutils from "./assetidutils";
import {db} from "./firebaseutils";

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('assets')

function getChangePlans(itemCount, username, callback, start = null) {
    console.log(username)
    let query = start ? firebaseutils.changeplansRef.where("owner", "==", username).orderBy("executed").orderBy("name").startAfter(start).limit(25) : firebaseutils.changeplansRef.where("owner", "==", username).orderBy("executed").orderBy("name").limit(25);
    query.get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(null, null, null, true);
        } else {
            let newStart = querySnapshot.docs[querySnapshot.docs.length - 1];
            let count = 0;
            let changePlans = [];
            querySnapshot.docs.forEach(changePlan => {
                changePlans.push({id: changePlan.id, count: itemCount++, ...changePlan.data()});
                count++;
                if (count === querySnapshot.size) {
                    callback(itemCount, newStart, changePlans, false);
                }
            })
        }
    }).catch(function (error) {
        console.log(error)
        callback(null);
    })
}

function getChanges(changePlanID, username, callback, start = null) {
    let query = start ? firebaseutils.changeplansRef.doc(changePlanID).collection("changes").orderBy("step").startAfter(start) : firebaseutils.changeplansRef.doc(changePlanID).collection("changes").orderBy("step");
    firebaseutils.changeplansRef.doc(changePlanID).get().then(function (documentSnapshot) {
        if (documentSnapshot.exists && documentSnapshot.data().owner === username) {
            query.get().then(function (querySnapshot) {
                if (!querySnapshot.empty) {
                    let changes = [];
                    let count = 0;
                    querySnapshot.docs.forEach(change => {
                        let newStart = querySnapshot.docs[querySnapshot.docs.length - 1];
                        changes.push({id: change.data().step, ...change.data()})
                        count++;
                        if (count === querySnapshot.size) {
                            callback(newStart, changes, false)
                        }
                    })
                } else {
                    callback(null, null, true);
                }
            }).catch(function (error) {
                callback(null, null, null);
            })
        } else {
            callback(null, null, true);
        }
    }).catch(function () {
        callback(null, null, null);
    })
}

function getChangeDetails(changePlanID, stepID, username, callback) {
    //console.log("this is the stepId: " + stepID)
    firebaseutils.changeplansRef.doc(changePlanID).get().then(function (documentSnapshot) {
        if (documentSnapshot.exists && documentSnapshot.data().owner === username) {
            firebaseutils.changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepID)).get().then(function (querySnapshot) {
                if (!querySnapshot.empty) {
                    callback(querySnapshot.docs[0].data(), documentSnapshot.data().executed, documentSnapshot.data().timestamp);
                } else {
                    callback(null);
                }
            }).catch(function (error) {
                console.log(error)
                callback(null);
            })
        } else {
            callback(null);
        }
    })
}

function getStepDocID(changePlanID, stepNum, callback) {
    // console.log(changePlanID, stepNum)
    firebaseutils.changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepNum)).get().then(querySnapshot => {
        // console.log(querySnapshot.empty)
        if (!querySnapshot.empty) {
            // console.log(querySnapshot.docs[0].id)
            callback(querySnapshot.docs[0].id)
        } else {
            callback(null)
        }
    }).catch(error => console.log(error))
}

function addChangePlan(name, owner, callback) {
    firebaseutils.changeplansRef.add({
        name: name,
        owner: owner,
        executed: false
    }).then(function () {
        callback(true);
    }).catch(function () {
        callback(null);
    })
}

function deleteChangePlan(id, callback) {
    firebaseutils.changeplansRef.doc(id).collection("changes").get().then(function (querySnapshot) {
        if (!querySnapshot.empty) {
            querySnapshot.docs.forEach(doc => {
                firebaseutils.changeplansRef.doc(id).collection("changes").doc(doc.id).delete().catch(function () {
                    callback(null);
                })
            })
        }
        firebaseutils.changeplansRef.doc(id).collection("conflicts").get().then(function (querySnapshot) {
            if (!querySnapshot.empty) {
                querySnapshot.docs.forEach(doc => {
                    firebaseutils.changeplansRef.doc(id).collection("conflicts").doc(doc.id).delete().catch(function () {
                        callback(null);
                    })
                })
            }
            firebaseutils.changeplansRef.doc(id).delete().then(function () {
                callback(true);
            }).catch(function () {
                callback(null);
            })
        }).catch(function () {
            callback(null);
        });
    }).catch(function () {
        callback(null);
    });
}

function editChangePlan(id, newName, callback) {
    firebaseutils.changeplansRef.doc(id).update({
        name: newName
    }).then(function () {
        callback(true)
    }).catch(function () {
        callback(null)
    })
}

function addAssetChange(asset, assetID, changePlanID, callback, docID = null) {
    console.log(asset)

    let assetChangePlanObject = {
        assetID: assetID ? parseInt(assetID) : "",
        change: "add",
        changes: {},
    };
    Object.keys(asset).forEach(assetProperty => {
        let oldProperty = (assetProperty === "macAddresses" || assetProperty === "variances") ? {} : (assetProperty === "powerConnections" || assetProperty === "networkConnections" ? [] : "");
        assetChangePlanObject.changes = {
            ...assetChangePlanObject.changes,
            [assetProperty]: {
                old: oldProperty,
                new: asset[assetProperty]
            }
        }
    });
    if (docID) {
        changeplansRef.doc(changePlanID).collection("changes").doc(docID).get().then(function (docSnapInner) {
            if (docSnapInner.exists) {
                assetChangePlanObject.step = docSnapInner.data().step;
                changeplansRef.doc(changePlanID).collection("changes").doc(docID).set(assetChangePlanObject)
                    // .then(function (doc) {

                    //     callback(true);
                    // })
                    .then(function () {
                        changeplanconflictutils.clearAllStepConflicts(changePlanID, status1 => {
                            console.log("DONE WITH CLEAR ALL STEP CONFLICTS")
                            //changeplanconflictutils.checkAllLiveDBConflicts(docSnapInner.data().executed, changePlanID, status2 => {
                            // console.log("Made it back from db checks")
                            changeplanconflictutils.checkSequentialStepConflicts(docSnapInner.data().executed, changePlanID, status3 => {
                                console.log("DONE RECHECKING")
                                callback(true);

                            })
                            // })
                        })

                    }).catch(function () {
                    callback(null);
                })
            } else {
                callback(null);
            }
        }).catch(function (error) {
            console.log(error);
            callback(null);
        })
    } else {

        changeplansRef.doc(changePlanID).collection("changes").orderBy("step", "desc").limit(1).get().then(function (querySnapshot) {
            let changeNumber = querySnapshot.empty ? 1 : parseInt(querySnapshot.docs[0].data().step) + 1;
            assetChangePlanObject.step = changeNumber;
            changeplansRef.doc(changePlanID).collection("changes").add(assetChangePlanObject)
                // .then(function (doc) {
                //     //network ports need to be done at time of execution
                //     //so does power port and logging

                //     //added the doc.id for change plan conflict checking: need to know which step we are checking
                //     callback(true);
                // })
                .then(function () {
                    getChangePlanData(changePlanID, cpData => {
                        changeplanconflictutils.clearAllStepConflicts(changePlanID, status1 => {
                            //changeplanconflictutils.checkAllLiveDBConflicts(cpData.executed, changePlanID, status2 => {
                            // console.log("Made it back from db checks")
                            changeplanconflictutils.checkSequentialStepConflicts(cpData.executed, changePlanID, status3 => {
                                console.log("DONE RECHECKING")
                                callback(true);

                            })
                            //})
                        })
                    })

                }).catch(function (error) {
                console.log(error);
                callback(null);
            });
        }).catch(function (error) {
            console.log(error);
            callback(null);
        })
    }
}

function editAssetChange(newAsset, assetID, changePlanID, callback, docID = null, offlineStorage = null) {
    let query = offlineStorage ? db.collectionGroup("offlineAssets").where("assetId", "==", assetID) : assetRef.doc(assetID);
    query.get().then(function (queryResult) {
        let documentSnapshot;
        if (offlineStorage) {
            if (queryResult.empty) {
                callback(null);
            } else {
                documentSnapshot = queryResult.docs[0];
            }
        } else {
            if(!queryResult.exists){
                callback(null);
            } else {
                documentSnapshot = queryResult;
            }
        }
        let assetChangePlanObject = {
            assetID: parseInt(assetID),
            location: offlineStorage ? "offline" : "rack",
            change: "edit",
            changes: {}
        };
        let oldAsset = documentSnapshot.data();
        Object.keys(newAsset).forEach(assetProperty => {
            if ((typeof oldAsset[assetProperty] === "object" && !isEqual(oldAsset[assetProperty], newAsset[assetProperty])) || (typeof oldAsset[assetProperty] !== "object" && oldAsset[assetProperty] !== newAsset[assetProperty])) {
                assetChangePlanObject.changes = {
                    ...assetChangePlanObject.changes,
                    [assetProperty]: {
                        old: oldAsset[assetProperty],
                        new: newAsset[assetProperty]
                    }
                }
            }
        });
        if (docID) {
            changeplansRef.doc(changePlanID).collection("changes").doc(docID).get().then(function (docSnapInner) {
                if (docSnapInner.exists) {
                    assetChangePlanObject.step = docSnapInner.data().step;
                    changeplansRef.doc(changePlanID).collection("changes").doc(docID).set(assetChangePlanObject)
                        // .then(function (doc) {
                        //     callback(true);
                        // })
                        .then(function () {
                            changeplanconflictutils.clearAllStepConflicts(changePlanID, status1 => {
                                //checking against liveDB not necessary, and only take more time
                                // changeplanconflictutils.checkAllLiveDBConflicts(docSnapInner.data().executed, changePlanID, status2 => {
                                //     console.log("Made it back from db checks")
                                changeplanconflictutils.checkSequentialStepConflicts(docSnapInner.data().executed, changePlanID, status3 => {
                                    console.log("DONE RECHECKING")
                                    callback(true);

                                })
                                //})
                            })
                        }).catch(function (error) {
                        console.log(error);
                        callback(null);
                    })
                } else {
                    callback(null);
                }
            }).catch(function (error) {
                console.log(error);
                callback(null);
            })
        } else {
            changeplansRef.doc(changePlanID).collection("changes").orderBy("step", "desc").limit(1).get().then(function (querySnapshot) {
                let changeNumber = querySnapshot.empty ? 1 : parseInt(querySnapshot.docs[0].data().step) + 1;
                assetChangePlanObject.step = changeNumber;
                changeplansRef.doc(changePlanID).collection("changes").add(assetChangePlanObject)
                    // .then(function (doc) {
                    //     //network ports need to be done at time of execution
                    //     //so does power port and logging
                    //     callback(true);

                    // })
                    .then(function () {

                        getChangePlanData(changePlanID, cpData => {
                            changeplanconflictutils.clearAllStepConflicts(changePlanID, status1 => {
                                //checking against liveDB not necessary, and only take more time
                                //changeplanconflictutils.checkAllLiveDBConflicts(cpData.executed, changePlanID, status2 => {
                                //     console.log("Made it back from db checks")
                                changeplanconflictutils.checkSequentialStepConflicts(cpData.executed, changePlanID, status3 => {
                                    console.log("DONE RECHECKING")
                                    callback(true);

                                })
                                //})
                            })
                        })
                    }).catch(function (error) {
                    console.log(error);
                    callback(null);
                });
            }).catch(function (error) {
                console.log(error);
                callback(null);
            });
        }

    });
}

function decommissionAssetChange(assetID, changePlanID, callback, stepID = null, offlineStorage = null) {
    let query = offlineStorage ? db.collectionGroup("offlineAssets").where("assetId", "==", assetID) : assetRef.doc(assetID)
    query.get().then(function (queryResult) {
        let documentSnapshot;
        if (offlineStorage) {
            if (queryResult.empty) {
                callback(null);
            } else {
                documentSnapshot = queryResult.docs[0];
            }
        } else {
            if(!queryResult.exists){
                callback(null);
            } else {
                documentSnapshot = queryResult;
            }
        }
        if (stepID) {
            changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepID)).get().then(function (querySnapshot) {
                console.log(querySnapshot.docs[0].data())
                if (!querySnapshot.empty) {
                    let docID = querySnapshot.docs[0].id;
                    changeplansRef.doc(changePlanID).collection("changes").doc(docID).update({
                        assetID: parseInt(assetID),
                        location: offlineStorage ? "offline" : "rack"
                    }).then(function () {
                        getChangePlanData(changePlanID, cpData => {
                            changeplanconflictutils.clearAllStepConflicts(changePlanID, status1 => {
                                changeplanconflictutils.checkSequentialStepConflicts(cpData.executed, changePlanID, status3 => {
                                    console.log("DONE RECHECKING decomm")
                                    callback(true)

                                })
                            })
                        })
                    }).catch(function (error) {
                        console.log(error)
                        callback(null);
                    })
                } else {
                    console.log("1");
                    callback(null);
                }
            }).catch(function (error) {
                console.log(error)
                callback(null);
            })
        } else {
            changeplansRef.doc(changePlanID).collection("changes").orderBy("step", "desc").limit(1).get().then(function (querySnapshot) {
                let changeNumber = querySnapshot.empty ? 1 : parseInt(querySnapshot.docs[0].data().step) + 1;
                changeplansRef.doc(changePlanID).collection("changes").add({
                    assetID: parseInt(assetID),
                    location: offlineStorage ? "offline" : "rack",
                    change: "decommission",
                    step: changeNumber
                }).then(function () {
                    getChangePlanData(changePlanID, cpData => {

                        changeplanconflictutils.clearAllStepConflicts(changePlanID, status1 => {
                            // changeplanconflictutils.checkAllLiveDBConflicts(cpData.executed, changePlanID, status2 => {
                            //   console.log("Made it back from db checks")
                            changeplanconflictutils.checkSequentialStepConflicts(cpData.executed, changePlanID, status3 => {
                                console.log("DONE RECHECKING decomm")
                                callback(true);
                            })
                        })
                    })
                }).catch(function (error) {
                    console.log(error)
                    callback(null);
                });
            });
        }

    }).catch(function (error) {
        console.log(error)
        callback(null);
    });
}

function moveAssetChange(assetID, changePlanID, datacenter, rack, rackU, offlineStorageName, callback, stepID = null, isBladeServer = null) {
    console.log("3")
    let query = !offlineStorageName ? db.collectionGroup("offlineAssets").where("assetId", "==", assetID) : assetRef.doc(assetID)
    query.get().then(function (queryResult) {
        console.log("4")
        let documentSnapshot;
        if (!offlineStorageName) {
            if (queryResult.empty) {
                callback(null);
            } else {
                documentSnapshot = queryResult.docs[0];
            }
        } else {
            if(!queryResult.exists){
                callback(null);
            } else {
                documentSnapshot = queryResult;
            }
        }
        changeplansRef.doc(changePlanID).collection("changes").orderBy("step", "desc").limit(1).get().then(function (querySnapshot) {
            console.log("5")
            let changeNumber = querySnapshot.empty ? 1 : parseInt(querySnapshot.docs[0].data().step) + 1;
            let assetChangePlanObject = {
                assetID: parseInt(assetID),
                location: !offlineStorageName ? "offline" : "rack",
                change: "move",
                step: stepID ? stepID :  changeNumber,
                model: documentSnapshot.data().model
            };
            if(!offlineStorageName){
                //move to rack
                //gotta validate: fits, datacenter exists
                getChassisFromHostname(rack, datacenter, (chassisRack, chassisRackU, chassisID) => {
                    let chassisObject = {
                        hostname: rack,
                        slot: rackU,
                        id: chassisID
                    };
                    console.log(isBladeServer, chassisObject, chassisRack, chassisRackU, chassisID, assetChangePlanObject)
                    if(chassisRack || !isBladeServer){
                        assetutils.assetFitsOnRack(isBladeServer ? chassisRack : rack, isBladeServer ? chassisRackU : parseInt(rackU), documentSnapshot.data().model, datacenter, fitResult => {
                            if(fitResult){
                                //doesn't fit
                                console.log("6", fitResult, rack, rackU) 
                                callback(null, fitResult);
                            } else {
                                //get datacenter info
                                console.log("7")
                                datacenterutils.getDataFromName(datacenter, (datacenterID, datacenterAbbrev) => {
                                    if(datacenterID){
                                        console.log("8")
                                        let splitRackArray = isBladeServer ? chassisRack.split(/(\d+)/).filter(Boolean) : rack.split(/(\d+)/).filter(Boolean)
                                        let rackRow = splitRackArray[0]
                                        let rackNum = parseInt(splitRackArray[1])
                                        rackutils.getRackID(rackRow, rackNum, datacenter, rackID => {
                                            if(rackID){
                                                console.log("9")
                                                assetChangePlanObject = {
                                                    ...assetChangePlanObject,
                                                    changes: {
                                                        datacenter: {
                                                            old: documentSnapshot.data().datacenter,
                                                            new: datacenter
                                                        },
                                                        datacenterAbbrev: {
                                                            old: "",
                                                            new: datacenterAbbrev
                                                        },
                                                        datacenterID: {
                                                            old: "",
                                                            new: datacenterID
                                                        },
                                                        rack: {
                                                            old: "",
                                                            new: rack
                                                        },
                                                        rackID: {
                                                            old: "",
                                                            new: rackID
                                                        },
                                                        rackNum: {
                                                            old: "",
                                                            new: rackNum
                                                        },
                                                        rackRow: {
                                                            old: "",
                                                            new: rackRow
                                                        },
                                                        rackU: {
                                                            old: "",
                                                            new: rackU
                                                        }
                                                    }
                                                };
                                                if(stepID){
                                                    changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepID)).get().then(function (changeDocQuery) {
                                                        if(changeDocQuery.empty){
                                                            callback(null);
                                                        } else {
                                                            changeplansRef.doc(changePlanID).collection("changes").doc(changeDocQuery.docs[0].id).set(assetChangePlanObject).then(function () {
                                                                callback(true);
                                                            }).catch(function () {
                                                                callback(null);
                                                            })
                                                        }
                                                    })
                                                } else {
                                                    changeplansRef.doc(changePlanID).collection("changes").add(assetChangePlanObject).then(function () {
                                                        callback(true);
                                                    }).catch(function () {
                                                        callback(null);
                                                    })
                                                }
                                            } else {
                                                callback(null);
                                            }
                                        })
                                    } else {
                                        callback(null);
                                    }
                                });
                            }
                        }, null, null, isBladeServer ? chassisObject : null);
                    } else {
                        console.log("666")
                        callback(null);
                    }
                });
            } else {
                //move to offline storage
                let changes = {};
                if(Object.keys(documentSnapshot.data().networkConnections).length){
                    changes = {
                        ...changes,
                        networkConnections: {
                            old: documentSnapshot.data().networkConnections,
                            new: {}
                        }
                    }
                }
                if(documentSnapshot.data().powerConnections && documentSnapshot.data().powerConnections.length){
                    changes = {
                        ...changes,
                        powerConnections: {
                            old: documentSnapshot.data().powerConnections,
                            new: []
                        }
                    }
                }
                changes = {
                    ...changes,
                    datacenter: {
                        old: documentSnapshot.data().datacenter,
                        new: offlineStorageName
                    },
                    datacenterAbbrev: {
                        old: documentSnapshot.data().datacenterAbbrev,
                        new: ""
                    },
                    datacenterID: {
                        old: documentSnapshot.data().datacenterID,
                        new: ""
                    },
                    rack: {
                        old: documentSnapshot.data().rack,
                        new: ""
                    },
                    rackID: {
                        old: documentSnapshot.data().rackID,
                        new: ""
                    },
                    rackNum: {
                        old: documentSnapshot.data().rackNum,
                        new: ""
                    },
                    rackRow: {
                        old: documentSnapshot.data().rackRow,
                        new: ""
                    },
                    rackU: {
                        old: documentSnapshot.data().rackU,
                        new: ""
                    }
                }
                assetChangePlanObject = {
                    ...assetChangePlanObject,
                    changes: changes
                };
                if(stepID){
                    changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepID)).get().then(function (changeDocQuery) {
                        if(changeDocQuery.empty){
                            callback(null);
                        } else {
                            changeplansRef.doc(changePlanID).collection("changes").doc(changeDocQuery.docs[0].id).set(assetChangePlanObject).then(function () {
                                callback(true);
                            }).catch(function () {
                                callback(null);
                            })
                        }
                    })
                } else {
                    changeplansRef.doc(changePlanID).collection("changes").add(assetChangePlanObject).then(function () {
                        callback(true);
                    }).catch(function () {
                        callback(null);
                    })
                }
            }
        })
    }).catch(function (error) {
        console.log(error)
        callback(null);
    });
}

function deleteChange(changePlanID, stepNum, callback) {
    changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepNum)).get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(null);
        } else {
            let deleteID = querySnapshot.docs[0].id;
            let executed = querySnapshot.docs[0].data().executed
            changeplansRef.doc(changePlanID).collection("changes").doc(querySnapshot.docs[0].id).delete().then(function () {
                cascadeUpStepNumbers(changePlanID, stepNum, result => {
                    if (result) {
                        changeplanconflictutils.clearAllConflicts(changePlanID, status1 => {
                            changeplanconflictutils.checkAllLiveDBConflicts(executed, changePlanID, status2 => {
                                //console.log("Made it back from db checks")
                                changeplanconflictutils.checkSequentialStepConflicts(executed, changePlanID, status3 => {
                                    console.log("DONE RECHECKING: after deleting step")
                                    callback(true)
                                })
                            })
                        })
                    } else {
                        callback(null);
                    }
                })
            })
                // .then(function () {
                //     changeplanconflictutils.clearAllConflicts(changePlanID, status => {
                //         changeplanconflictutils.checkAllLiveDBConflicts(querySnapshot.docs[0].data().executed, changePlanID, status2 => {
                //             //     console.log("Made it back from db checks")
                //             changeplanconflictutils.checkSequentialStepConflicts(querySnapshot.docs[0].data().executed, changePlanID, status3 => {
                //                 console.log("DONE RECHECKING: after deleting step")
                //                 callback(true)
                //             })
                //         })
                //     })

                // })
                .catch(function () {
                    callback(null);
                })
        }
    }).catch(function () {
        callback(null);
    })
}

function cascadeUpStepNumbers(changePlanID, stepDeleted, callback) {
    changeplansRef.doc(changePlanID).collection("changes").where("step", ">", parseInt(stepDeleted)).get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(true);
        } else {
            let count = 0;
            querySnapshot.docs.forEach(doc => {
                changeplansRef.doc(changePlanID).collection("changes").doc(doc.id).update({
                    step: doc.data().step - 1
                }).then(function () {
                    count++;
                    if (count === querySnapshot.size) {
                        callback(true);
                    }
                }).catch(function () {
                    callback(null);
                })
            })
        }
    }).catch(function () {
        callback(null);
    })
}

function isEqual(value, other) {
    // Get the value type
    var type = Object.prototype.toString.call(value);
    // If the two objects are not the same type, return false
    if (type !== Object.prototype.toString.call(other)) return false;
    // If items are not an object or array, return false
    if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;
    // Compare the length of the length of the two items
    var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
    var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
    if (valueLen !== otherLen) return false;
    // Compare two items
    var compare = function (item1, item2) {
        // Get the object type
        var itemType = Object.prototype.toString.call(item1);
        // If an object or array, compare recursively
        if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
            if (!isEqual(item1, item2)) return false;
        }
        // Otherwise, do a simple comparison
        else {
            // If the two items are not the same type, return false
            if (itemType !== Object.prototype.toString.call(item2)) return false;
            // Else if it's a function, convert to a string and compare
            // Otherwise, just compare
            if (itemType === '[object Function]') {
                if (item1.toString() !== item2.toString()) return false;
            } else {
                if (item1 !== item2) return false;
            }

        }
    };
    // Compare properties
    if (type === '[object Array]') {
        for (var i = 0; i < valueLen; i++) {
            if (compare(value[i], other[i]) === false) return false;
        }
    } else {
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                if (compare(value[key], other[key]) === false) return false;
            }
        }
    }
    // If nothing failed, return true
    return true;
}

function generateWorkOrder(changePlanID, callback) {
    console.log(changePlanID)
    changeplansRef.doc(changePlanID).collection("changes").orderBy("step").get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback([])
        } else {
            //let steps = new Map();
            let steps = [];
            let count = 0;
            querySnapshot.docs.forEach(doc => {
                let change = doc.data().change;
                if (change === "decommission") {
                    let query = doc.data().location === "rack" ? assetRef.doc(doc.data().assetID.toString()) : db.collectionGroup("offlineAssets").where("assetId", "==", doc.data().assetID.toString());
                    query.get().then(function (queryResult) {
                        let documentSnapshot = doc.data().location === "rack" ? queryResult : queryResult.docs[0];
                        let decommissionText = ["Decommission asset #" + doc.data().assetID + " from datacenter " + documentSnapshot.data().datacenter + " at rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U."];
                        deleteNetworkPowerText(documentSnapshot, deleteText => {
                            decommissionText = decommissionText.concat(deleteText);
                            steps[doc.data().step - 1] = decommissionText;
                            count++;
                            if (count === querySnapshot.size) {
                                callback(steps);
                            }
                        });
                    }).catch(function () {
                        callback(null)
                    });
                } else if (change === "add") {
                    let assetID = doc.data().assetID ? doc.data().assetID : "TBD";

                    let addText = ["Add asset #" + assetID + " to datacenter " + doc.data().changes.datacenter["new"] + " on rack " + doc.data().changes.rack["new"] + " at height " + doc.data().changes.rackU["new"] + " U."];
                    let networkPromise = new Promise(function (resolve, reject) {
                        if (doc.data().changes.networkConnections && Object.keys(doc.data().changes.networkConnections["new"]).length) {
                            addText.push("Add the following network connections: ");
                            let countInner = 0;
                            Object.keys(doc.data().changes.networkConnections["new"]).forEach(networkPort => {
                                addText.push("port " + networkPort + " connected to asset #" + doc.data().changes.networkConnections["new"][networkPort].otherAssetID + " on port " + doc.data().changes.networkConnections["new"][networkPort].otherPort);
                                countInner++;
                                if (countInner === Object.keys(doc.data().changes.networkConnections["new"]).length) {
                                    resolve();
                                }
                            });
                        } else {
                            resolve();
                        }
                    });
                    let powerPromise = new Promise(function (resolve, reject) {
                        if (doc.data().changes.powerConnections && Object.keys(doc.data().changes.powerConnections["new"]).length) {
                            addText.push("Add the following power connections:");
                            let countInner = 0;
                            Object.keys(doc.data().changes.powerConnections["new"]).forEach(powerPort => {
                                addText.push("port " + powerPort + " connected to the PDU " + doc.data().changes.powerConnections["new"][powerPort].pduSide.toLowerCase() + " side on port " + doc.data().changes.powerConnections["new"][powerPort].port);
                                countInner++;
                                if (countInner === doc.data().changes.powerConnections["new"].length) {
                                    resolve();
                                }
                            });
                        } else {
                            resolve();
                        }
                    });
                    let promiseArray = [networkPromise, powerPromise];
                    Promise.all(promiseArray).then(function () {
                        steps[doc.data().step - 1] = addText;
                        console.log(steps);
                        count++;
                        console.log("1", count, querySnapshot.size)
                        if (count === querySnapshot.size) {
                            console.log(steps);
                            callback(steps);
                        }
                    });
                } else if (change === "edit") {
                    generateEditWorkOrderMessage(doc, result => {
                        steps[doc.data().step - 1] = result;
                        console.log(steps);
                        count++;
                        console.log("2", count, querySnapshot.size)
                        if (count === querySnapshot.size) {
                            console.log(steps);
                            callback(steps);
                        }
                    })
                } else {
                    //move
                    let query = doc.data().location === "rack" ? assetRef.doc(doc.data().assetID.toString()) : db.collectionGroup("offlineAssets").where("assetId", "==", doc.data().assetID.toString());
                    query.get().then(function (queryResult) {
                        let documentSnapshot = doc.data().location === "rack" ? queryResult : queryResult.docs[0];
                        let moveString = "Move asset #" + doc.data().assetID + " from ";
                        if(doc.data().location === "rack"){
                            moveString += "datacenter " + doc.data().changes.datacenter["old"] + " rack " + doc.data().changes.rack["old"] + " height " + doc.data().changes.rackU["old"] + " to offline storage site " + doc.data().changes.datacenter["new"];
                        } else {
                            moveString += "offline storage site " + doc.data().changes.datacenter["old"] + " to datacenter " + doc.data().changes.datacenter["new"] + " rack " + doc.data().changes.rack["new"] + " height " + doc.data().changes.rackU["new"];
                        }
                        let moveText = [moveString];
                        deleteNetworkPowerText(documentSnapshot, deleteText => {
                            moveText = moveText.concat(deleteText);
                            steps[doc.data().step - 1] = moveText;
                            count++;
                            if (count === querySnapshot.size) {
                                callback(steps);
                            }
                        });
                    }).catch(function () {
                        callback(null)
                    });
                }
            })
        }
    }).catch(function (error) {
        console.log(error);
        callback(null);
    })
}

function deleteNetworkPowerText(documentSnapshot, callback){
    let text = [];
    let networkPromise = new Promise(function (resolve, reject) {
        if (documentSnapshot.data().networkConnections && Object.keys(documentSnapshot.data().networkConnections).length) {
            text.push("Remove the following network connections:");
            let countInner = 0;
            Object.keys(documentSnapshot.data().networkConnections).forEach(networkPort => {
                text.push("port " + networkPort + " connected to asset #" + documentSnapshot.data().networkConnections[networkPort].otherAssetID + " on port " + documentSnapshot.data().networkConnections[networkPort].otherPort);
                countInner++;
                if (countInner === Object.keys(documentSnapshot.data().networkConnections).length) {
                    //decommissionText += ".";
                    resolve();
                } else {
                    //decommissionText += ", ";
                }
            });
        } else {
            resolve();
        }
    });
    let powerPromise = new Promise(function (resolve, reject) {
        if (documentSnapshot.data().powerConnections && Object.keys(documentSnapshot.data().powerConnections).length) {
            text.push("Remove the following power connections: ");
            let countInner = 0;
            Object.keys(documentSnapshot.data().powerConnections).forEach(powerPort => {
                text.push("port " + powerPort + " connected to the PDU " + documentSnapshot.data().powerConnections[powerPort].pduSide.toLowerCase() + " side on port " + documentSnapshot.data().powerConnections[powerPort].port);
                countInner++;
                if (countInner === documentSnapshot.data().powerConnections.length) {
                    //decommissionText += ".";
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
    let promiseArray = [networkPromise, powerPromise];
    Promise.all(promiseArray).then(function () {
        callback(text);
    });
}

function generateEditWorkOrderMessage(doc, callback) {
    let query = doc.data().location === "rack" ? assetRef.doc(doc.data().assetID.toString()) : db.collectionGroup("offlineAssets").where("assetId", "==", doc.data().assetID.toString());
    query.get().then(function (queryResult) {
        let documentSnapshot;
        if(doc.data().location === "rack" && !queryResult.exists){
            callback(null);
        } else if(queryResult.empty){
            callback(null);
        } else {
            documentSnapshot = doc.data().location === "rack" ? queryResult : queryResult.docs[0];
        }
        let changes = [];
        let datacenterPromise = new Promise(function (resolve, reject) {
            if (doc.data().changes.datacenter) {
                //datacenter changed
                console.log((doc.data().changes.rackU ? doc.data().changes.rackU["new"] : documentSnapshot.data().rackU))
                changes.push("Move asset #" + doc.data().assetID + " from datacenter " + doc.data().changes.datacenter["old"] + " on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U to datacenter " + doc.data().changes.datacenter["new"] + " on rack " + (doc.data().changes.rack ? doc.data().changes.rack["new"] : documentSnapshot.data().rack) + " at height " + (doc.data().changes.rackU ? doc.data().changes.rackU["new"] : documentSnapshot.data().rackU));
                console.log("resolve 1")
                resolve();
            } else {
                console.log("resolve 1")
                resolve();
            }
        });
        let rackPromise = new Promise(function (resolve, reject) {
            if (doc.data().changes.rack) {
                changes.push("Move asset #" + doc.data().assetID + " in datacenter " + documentSnapshot.data().datacenter + " from rack " + doc.data().changes.rack["old"] + " at height " + documentSnapshot.data().rackU + " to rack " + doc.data().changes.rack["new"] + " at height " + (doc.data().changes.rackU ? doc.data().changes.rackU["new"] : documentSnapshot.data().rackU));
                resolve();
            } else {
                resolve();
            }
        });
        let heightPromise = new Promise(function (resolve, reject) {
            if (doc.data().changes.rackU) {
                changes.push("Move asset #" + doc.data().assetID + " in datacenter " + documentSnapshot.data().datacenter + " on rack " + documentSnapshot.data().rack + " from height " + doc.data().changes.rackU["old"] + " U to height " + doc.data().changes.rackU["new"] + " U");
                console.log("resolve 2")
                resolve();
            } else {
                console.log("resolve 2")
                resolve();
            }
        });
        let networkConnectionsPromise = new Promise(function (resolve, reject) {
            if (doc.data().changes.networkConnections) {
                new Promise(function (resolve1, reject1) {
                    let count = 0;
                    if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                        console.log("resolve 3")
                        resolve1();
                    }
                    ;
                    Object.keys(doc.data().changes.networkConnections["old"]).forEach(networkPort => {
                        if (!doc.data().changes.networkConnections["new"][networkPort]) {
                            console.log("Case 1")
                            assetRef.doc(doc.data().changes.networkConnections["old"][networkPort].otherPort).get().then(function (otherDocumentSnapshot) {
                                if (otherDocumentSnapshot.exists) {
                                    changes.push("In datacenter " + documentSnapshot.data().datacenter + ", disconnect the network connection between asset #" + doc.data().assetID + " at network port " + networkPort + " on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U and asset #" + doc.data.changes.networkConnections["old"][networkPort].otherAssetID + " at network port " + doc.data.changes.networkConnections["old"][networkPort].otherPort + " on rack " + otherDocumentSnapshot.data().rack + " at height " + otherDocumentSnapshot.data().rackU + " U");
                                    count++;
                                    if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                                        console.log("resolve 3")
                                        resolve1();
                                    }
                                    ;
                                } else {
                                    reject1(null);
                                }
                            }).catch(function () {
                                reject1(null);
                            })
                        } else if (doc.data().changes.networkConnections["new"][networkPort] && (doc.data().changes.networkConnections["old"][networkPort].otherAssetID !== doc.data().changes.networkConnections["new"][networkPort].otherAssetID || doc.data().changes.networkConnections["old"][networkPort].otherPort !== doc.data().changes.networkConnections["new"][networkPort].otherPort)) {
                            console.log("Case 2")
                            if (doc.data().changes.networkConnections["old"][networkPort].otherAssetID !== doc.data().changes.networkConnections["new"][networkPort].otherAssetID) {
                                assetRef.doc(doc.data().changes.networkConnections["new"][networkPort].otherAssetID).get().then(function (otherDocumentSnapshot) {
                                    if (otherDocumentSnapshot.exists) {
                                        changes.push("In datacenter " + documentSnapshot.data().datacenter + ", disconnect the network connection on asset #" + doc.data().changes.networkConnections["old"][networkPort].otherAssetID + " on port " + doc.data().changes.networkConnections["old"][networkPort].otherPort + " and connect it to asset #" + doc.data().networkConnections["new"][networkPort].otherAssetID + " in datacenter " + otherDocumentSnapshot.data().datacenter + " on rack" + otherDocumentSnapshot.data().rack + " at height " + otherDocumentSnapshot.data().rackU + " U, port " + doc.data().networkConnections["new"][networkPort].otherPort);
                                        count++;
                                        if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                                            console.log("resolve 3")
                                            resolve1();
                                        }
                                        ;
                                    } else {
                                        reject1(null);
                                    }
                                }).catch(function () {
                                    reject1(null);
                                })
                            } else {
                                //port only
                                changes.push("In datacenter " + documentSnapshot.data().datacenter + ", disconnect the network connection on asset #" + doc.data().changes.networkConnections["old"][networkPort].otherAssetID + " on port " + doc.data().changes.networkConnections["old"][networkPort].otherPort + " and connect it to port " + doc.data().changes.networkConnections["new"][networkPort].otherPort + " of the same asset");
                                count++;
                                if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                                    console.log("resolve 3")
                                    resolve1();
                                }
                                ;
                            }
                        } else {
                            console.log("Case 3")
                            if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                                console.log("resolve 3")
                                resolve1();
                            }
                            ;
                        }
                    });
                }).then(function () {
                    let count2 = 0;
                    if (count2 === Object.keys(doc.data().changes.networkConnections["new"]).length) {
                        console.log("resolve 4")
                        resolve();
                    }
                    Object.keys(doc.data().changes.networkConnections["new"]).forEach(networkPort => {
                        if (!doc.data().changes.networkConnections["old"][networkPort]) {
                            assetRef.doc(doc.data().changes.networkConnections["new"][networkPort].otherAssetID).get().then(function (otherDocumentSnapshot) {
                                if (otherDocumentSnapshot.exists) {
                                    changes.push("In datacenter " + documentSnapshot.data().datacenter + ", connect port " + networkPort + " on asset #" + doc.data().assetID + " located in rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U to port " + doc.data().changes.networkConnections["new"][networkPort].otherPort + " of asset #" + doc.data().changes.networkConnections["new"][networkPort].otherAssetID + " located in rack " + otherDocumentSnapshot.data().rack + " at height " + otherDocumentSnapshot.data().rackU + " U");
                                    count2++;
                                    if (count2 === Object.keys(doc.data().changes.networkConnections["new"]).length) {
                                        console.log("resolve 4")
                                        resolve();
                                    }
                                } else {
                                    reject(null);
                                }
                            }).catch(function () {
                                reject(null);
                            });
                        } else {
                            count2++;
                            if (count2 === Object.keys(doc.data().changes.networkConnections["new"]).length) {
                                console.log("resolve 4")
                                resolve();
                            }
                        }
                    });
                });
            } else {
                resolve();
            }
        });
        let powerConnectionsPromise = new Promise(function (resolve, reject) {
            if (doc.data().changes.powerConnections) {
                new Promise(function (resolve1, reject1) {
                    let count3 = 0;
                    if (count3 === Object.keys(doc.data().changes.powerConnections["old"]).length) {
                        console.log("resolve 5")
                        resolve1();
                    }
                    Object.keys(doc.data().changes.powerConnections["old"]).forEach(powerPort => {
                        console.log(powerPort);
                        if (!doc.data().changes.powerConnections["new"][powerPort]) {
                            console.log("Case 1")
                            changes.push("In datacenter " + documentSnapshot.data().datacenter + " on asset #" + doc.data().assetID + ", located on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U, disconnect power port " + powerPort + " from the PDU " + doc.data().changes.powerConnections["old"][powerPort].pduSide.toLowerCase() + " side at PDU port " + doc.data().changes.powerConnections["old"][powerPort].port);
                            count3++;
                            if (count3 === Object.keys(doc.data().changes.powerConnections["old"]).length) {
                                console.log("resolve 5")
                                resolve1();
                            }
                        } else if (doc.data().changes.powerConnections["new"][powerPort] && (doc.data().changes.powerConnections["new"][powerPort].pduSide !== doc.data().changes.powerConnections["old"][powerPort].pduSide || doc.data().changes.powerConnections["new"][powerPort].port !== doc.data().changes.powerConnections["old"][powerPort].port)) {
                            console.log("Case 2")
                            changes.push("In datacenter " + documentSnapshot.data().datacenter + " on asset #" + doc.data().assetID + ", located on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U, disconnect power port " + powerPort + " from the PDU " + doc.data().changes.powerConnections["old"][powerPort].pduSide.toLowerCase() + " side at PDU port " + doc.data().changes.powerConnections["old"][powerPort].port + ", and reconnect it to the PDU " + doc.data().changes.powerConnections["new"][powerPort].pduSide.toLowerCase() + " side at PDU port " + doc.data().changes.powerConnections["new"][powerPort].port);
                            count3++;
                            if (count3 === Object.keys(doc.data().changes.powerConnections["old"]).length) {
                                console.log("resolve 5")
                                resolve1();
                            }
                        } else {
                            console.log("Case 3")
                            count3++;
                            if (count3 === Object.keys(doc.data().changes.powerConnections["old"]).length) {
                                console.log("resolve 5")
                                resolve1();
                            }
                        }
                    });
                }).then(function () {
                    let count4 = 0;
                    if (count4 === Object.keys(doc.data().changes.powerConnections["new"]).length) {
                        console.log("resolve 6")
                        resolve();
                    }
                    Object.keys(doc.data().changes.powerConnections["new"]).forEach(powerPort => {
                        if (!doc.data().changes.powerConnections["old"][powerPort]) {
                            changes.push("In datacenter " + documentSnapshot.data().datacenter + " on asset #" + doc.data().assetID + ", located on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U, connect power port " + powerPort + " to the PDU " + doc.data().changes.powerConnections["new"][powerPort].pduSide.toLowerCase() + " side at PDU port " + doc.data().changes.powerConnections["new"][powerPort].port);
                            count4++;
                            if (count4 === Object.keys(doc.data().changes.powerConnections["new"]).length) {
                                console.log("resolve 6")
                                resolve();
                            }
                        } else {
                            count4++;
                            if (count4 === Object.keys(doc.data().changes.powerConnections["new"]).length) {
                                console.log("resolve 6")
                                resolve();
                            }
                        }
                    });
                })
            } else {
                console.log("resolve 6")
                resolve();
            }
        });
        let promiseArray = [datacenterPromise, rackPromise, heightPromise, networkConnectionsPromise, powerConnectionsPromise];
        Promise.all(promiseArray).then(function () {
            console.log("resolved all", changes)
            callback(changes);
        })

    }).catch(function () {
        callback(null);
    })
}

function executeChangePlan(changePlanID, callback) {

    changeplanconflictutils.clearAllConflicts(changePlanID, status1 => {
        changeplanconflictutils.checkAllLiveDBConflicts(false, changePlanID, status2 => {
            changeplanconflictutils.checkSequentialStepConflicts(false, changePlanID, status3 => {


                //changeplanconflictutils.changePlanHasConflicts(changePlanID, conflicts => {
                // let conflictsArray = [...conflicts]

                // if (conflictsArray.length) {
                //     //there are conflicts
                //     callback(null, true)
                // }
                //else {
                changeplansRef.doc(changePlanID.toString()).collection("changes").get().then(function (querySnapshot) {
                    if (querySnapshot.empty) {
                        callback(true);
                    } else {
                        logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.EXECUTE());
                        let count = 0;
                        querySnapshot.docs.forEach(change => {
                            console.log(change.data())
                            if (change.data().change === "add") {
                                modelutils.getModelByModelname(change.data().changes.model["new"], modelResult => {
                                    console.log("add")
                                    if (change.data().changes.assetId && change.data().changes.assetId["new"]) {
                                        console.log("not generating")
                                        if(modelResult.data().mount === "normal"){
                                            executeAddAsset(change.data().changes.assetId["new"], change, changePlanID, resultAdd => {
                                                if (resultAdd) {
                                                    count++;
                                                    if (count === querySnapshot.size) {
                                                        changeplansRef.doc(changePlanID.toString()).update({
                                                            executed: true,
                                                            timestamp: Date.now()
                                                        }).then(function () {
                                                            logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.COMPLETE());
                                                            callback(true);
                                                        }).catch(function () {
                                                            callback(null);
                                                        });
                                                    }
                                                } else {
                                                    callback(null);
                                                }
                                            });
                                        } else {
                                            let bladeFunction = modelResult.data().mount === "chassis" ? bladeutils.addChassis : bladeutils.addServer;
                                            bladeFunction(change.data().changes.assetId["new"], change.data().changes.model["new"], change.data().changes.hostname["new"],
                                                change.data().changes.chassisHostname ? change.data().changes.chassisHostname["new"] : change.data().changes.rack["new"],
                                                change.data().changes.chassisSlot ? change.data().changes.chassisSlot["new"] : change.data().changes.rackU["new"],
                                                change.data().changes.owner["new"], change.data().changes.comment["new"], change.data().changes.datacenter["new"],
                                                change.data().changes.macAddresses["new"], change.data().changes.networkConnections["new"], change.data().changes.powerConnections["new"],
                                                change.data().changes.variances["new"]["displayColor"], change.data().changes.variances["new"]["memory"],
                                                change.data().changes.variances["new"]["storage"], change.data().changes.variances["new"]["cpu"], addCallback => {
                                                    if(addCallback){
                                                        callback(null);
                                                    } else {
                                                        count++;
                                                        if (count === querySnapshot.size) {
                                                            changeplansRef.doc(changePlanID.toString()).update({
                                                                executed: true,
                                                                timestamp: Date.now()
                                                            }).then(function () {
                                                                logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.COMPLETE());
                                                                callback(true);
                                                            }).catch(function () {
                                                                callback(null);
                                                            });
                                                        }
                                                    }
                                                })
                                        }
                                    } else {
                                        //generate
                                        console.log("generating")
                                        assetIDutils.generateAssetID().then(newID => {
                                            if(modelResult.data().mount === "normal"){
                                                executeAddAsset(newID, change, changePlanID, resultAdd => {
                                                    if (resultAdd) {
                                                        count++;
                                                        if (count === querySnapshot.size) {
                                                            changeplansRef.doc(changePlanID.toString()).update({
                                                                executed: true,
                                                                timestamp: Date.now()
                                                            }).then(function () {
                                                                logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.COMPLETE());
                                                                callback(true);
                                                            }).catch(function () {
                                                                callback(null);
                                                            });
                                                        }
                                                    } else {
                                                        callback(null);
                                                    }
                                                })
                                            } else {
                                                console.log("1", change.data().changes.networkConnections["new"]);
                                                let bladeFunction = modelResult.data().mount === "chassis" ? bladeutils.addChassis : bladeutils.addServer;
                                                bladeFunction(newID, change.data().changes.model["new"], change.data().changes.hostname["new"],
                                                    change.data().changes.chassisHostname ? change.data().changes.chassisHostname["new"] : change.data().changes.rack["new"],
                                                    change.data().changes.chassisSlot ? change.data().changes.chassisSlot["new"] : change.data().changes.rackU["new"],
                                                    change.data().changes.owner["new"], change.data().changes.comment["new"], change.data().changes.datacenter["new"],
                                                    change.data().changes.macAddresses["new"], change.data().changes.networkConnections["new"], change.data().changes.powerConnections["new"],
                                                    change.data().changes.variances["new"]["displayColor"], change.data().changes.variances["new"]["memory"],
                                                    change.data().changes.variances["new"]["storage"], change.data().changes.variances["new"]["cpu"], addCallback => {
                                                        if(addCallback){
                                                            callback(null);
                                                            console.log(addCallback, modelResult.data(), modelResult.data().mount)
                                                        } else {
                                                            console.log("2");
                                                            changeplansRef.doc(changePlanID).collection("changes").doc(change.id).update({
                                                                assetID: newID
                                                            }).then(function () {
                                                                count++;
                                                                if (count === querySnapshot.size) {
                                                                    changeplansRef.doc(changePlanID.toString()).update({
                                                                        executed: true,
                                                                        timestamp: Date.now()
                                                                    }).then(function () {
                                                                        logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.COMPLETE());
                                                                        callback(true);
                                                                    }).catch(function () {
                                                                        callback(null);
                                                                    });
                                                                }
                                                            }).catch(function () {
                                                                callback(null);
                                                            })
                                                        }
                                                    })
                                            }
                                        });
                                    }
                                })
                            } else if (change.data().change === "edit") {
                                console.log(change.data())
                                assetutils.getAssetDetails(String(change.data().assetID), assetResult => {
                                    if(assetResult){
                                        console.log("1")
                                        modelutils.getModelByModelname(assetResult.model, modelResult => {
                                            if(modelResult){
                                                console.log("2")
                                                if(modelResult.data().mount === "normal"){
                                                    console.log("edit")
                                                    executeEditAsset(change, resultEdit => {
                                                        if (resultEdit) {
                                                            count++;
                                                            if (count === querySnapshot.size) {
                                                                changeplansRef.doc(changePlanID.toString()).update({
                                                                    executed: true,
                                                                    timestamp: Date.now()
                                                                }).then(function () {
                                                                    logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.COMPLETE());
                                                                    callback(true);
                                                                }).catch(function () {
                                                                    callback(null);
                                                                });
                                                            }
                                                        } else {
                                                            callback(null);
                                                        }
                                                    })
                                                } else {
                                                    getMergedAssetAndChange(changePlanID, change.data().step, mergedAsset => {
                                                        if(mergedAsset){
                                                            let updateFunction = modelResult.data().mount === "chassis" ? bladeutils.updateChassis : bladeutils.updateServer;
                                                            updateFunction(mergedAsset.assetId, mergedAsset.model, mergedAsset.hostname,
                                                                mergedAsset.chassisHostname ? mergedAsset.chassisHostname : mergedAsset.rack,
                                                                mergedAsset.chassisSlot ? mergedAsset.chassisSlot : mergedAsset.rackU,
                                                                mergedAsset.owner, mergedAsset.comment, mergedAsset.datacenter, mergedAsset.macAddresses, mergedAsset.networkConnections,
                                                                "", mergedAsset.powerConnections, mergedAsset.variances["displayColor"], mergedAsset.variances["memory"],
                                                                mergedAsset.variances["storage"], mergedAsset.variances["cpu"], addCallback => {
                                                                    if(addCallback){
                                                                        callback(null);
                                                                    } else {
                                                                        count++;
                                                                        if (count === querySnapshot.size) {
                                                                            changeplansRef.doc(changePlanID.toString()).update({
                                                                                executed: true,
                                                                                timestamp: Date.now()
                                                                            }).then(function () {
                                                                                logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.COMPLETE());
                                                                                callback(true);
                                                                            }).catch(function () {
                                                                                callback(null);
                                                                            });
                                                                        }
                                                                    }
                                                                })
                                                        } else {
                                                            callback(null);
                                                        }
                                                    })
                                                }
                                            } else {
                                                callback(null);
                                            }
                                        })
                                    } else {
                                        console.log("3")
                                        callback(null);
                                    }
                                }, change.data().location === "offline" ? true : null);
                            } else if (change.data().change === "move") {
                                assetutils.getAssetDetails(String(change.data().assetID), assetResult => {
                                    if(assetResult){
                                        modelutils.getModelByModelname(assetResult.model, modelResult => {
                                            if(modelResult){
                                                let moveFunction;
                                                if(change.data().location === "rack"){
                                                    //move to offline
                                                    moveFunction = modelResult.data().mount === "chassis" ? bladeutils.deleteChassis : (modelResult.data().mount === "blade" ? bladeutils.deleteServer : assetutils.deleteAsset);
                                                    console.log(change.data(), change.data().changes.datacenter["new"])
                                                    offlinestorageutils.moveAssetToOfflineStorage(change.data().assetID.toString(), change.data().changes.datacenter["new"], moveResult => {
                                                        if(moveResult){
                                                            count++;
                                                            if (count === querySnapshot.size) {
                                                                changeplansRef.doc(changePlanID.toString()).update({
                                                                    executed: true,
                                                                    timestamp: Date.now()
                                                                }).then(function () {
                                                                    logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.COMPLETE());
                                                                    callback(true);
                                                                }).catch(function () {
                                                                    callback(null);
                                                                });
                                                            }
                                                        } else {
                                                            callback(null);
                                                        }
                                                    }, moveFunction);
                                                } else {
                                                    //move from offline
                                                    moveFunction = modelResult.data().mount === "chassis" ? bladeutils.addChassis : (modelResult.data().mount === "blade" ? bladeutils.addServer : assetutils.addAsset);
                                                    offlinestorageutils.moveAssetFromOfflineStorage(change.data().assetID.toString(), change.data().changes.datacenter["new"], change.data().changes.rack["new"], change.data().changes.rackU["new"], moveResult => {
                                                        console.log(moveResult)
                                                        if(!moveResult){
                                                            count++;
                                                            if (count === querySnapshot.size) {
                                                                changeplansRef.doc(changePlanID.toString()).update({
                                                                    executed: true,
                                                                    timestamp: Date.now()
                                                                }).then(function () {
                                                                    logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.COMPLETE());
                                                                    callback(true);
                                                                }).catch(function () {
                                                                    callback(null);
                                                                });
                                                            }
                                                        } else {
                                                            callback(null);
                                                        }
                                                    }, moveFunction)
                                                }
                                            } else {
                                                callback(null);
                                            }
                                        })
                                    } else {
                                        callback(null);
                                    }
                                }, change.data().location === "offline" ? true : null);
                            } else {
                                //decomission
                                assetutils.getAssetDetails(String(change.data().assetID), assetResult => {
                                    if(assetResult){
                                        modelutils.getModelByModelname(assetResult.model, modelResult => {
                                            if(modelResult){
                                                let moveFunction = modelResult.data().mount === "chassis" ? bladeutils.deleteChassis : (modelResult.data().mount === "blade" ? bladeutils.deleteServer : assetutils.deleteAsset);
                                                console.log("decomm")
                                                decommissionutils.decommissionAsset(change.data().assetID.toString(), resultDecom => {
                                                    if (resultDecom) {
                                                        count++;
                                                        if (count === querySnapshot.size) {
                                                            changeplansRef.doc(changePlanID.toString()).update({
                                                                executed: true,
                                                                timestamp: Date.now()
                                                            }).then(function () {
                                                                logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.COMPLETE());
                                                                callback(true);
                                                            }).catch(function () {
                                                                callback(null);
                                                            });
                                                        }
                                                    } else {
                                                        callback(null);
                                                    }
                                                }, moveFunction, null, change.data().location === "rack" ? null : true)
                                            } else {
                                                callback(null);
                                            }
                                        })
                                    } else {
                                        callback(null);
                                    }
                                }, change.data().location === "offline" ? true : null);
                            }
                        })
                    }
                }).catch(function (error) {
                    console.log(error)
                    callback(null);
                })


                // }
                // })
            })
        })
    })

}

function executeAddAsset(id, doc, changePlanID, callback) {
    console.log(id);
    let assetObject = {
        assetId: id
    };
    let count = 0;
    console.log(doc.data().changes)
    Object.keys(doc.data().changes).forEach(change => {
        assetObject = {
            ...assetObject,
            [change]: doc.data().changes[change]["new"]
        };
        count++;
        if (count === Object.keys(doc.data().changes).length) {

            assetRef.doc(id).set(assetObject).then(function (docRef) {
                changeplansRef.doc(changePlanID.toString()).collection("changes").where("step", "==", parseInt(doc.data().step)).get().then(function (querySnapshot) {
                    if (!querySnapshot.empty) {
                        changeplansRef.doc(changePlanID.toString()).collection("changes").doc(querySnapshot.docs[0].id).update({
                            assetID: id
                        }).then(function () {
                            if (doc.data().changes.networkConnections) {
                                assetnetworkportutils.symmetricNetworkConnectionsAdd(assetnetworkportutils.networkConnectionsToArray(doc.data().changes.networkConnections["new"]), id);
                            }
                            if (doc.data().changes.powerConnections && doc.data().changes.powerConnections["new"].length != 0) {
                                racksRef.doc(String(doc.data().changes.rackID["new"])).update({
                                    assets: firebase.firestore.FieldValue.arrayUnion(id),
                                    powerPorts: firebase.firestore.FieldValue.arrayUnion(...doc.data().changes.powerConnections["new"].map(obj => ({
                                        ...obj,
                                        assetID: id
                                    })))
                                }).then(function () {
                                    let suffixes_list = []
                                    let _model = assetObject.model

                                    while (_model.length > 1) {
                                        _model = _model.substr(1)
                                        suffixes_list.push(_model)
                                    }

                                    let _hostname = assetObject.hostname

                                    if (_hostname) {
                                        while (_hostname.length > 1) {
                                            _hostname = _hostname.substr(1)
                                            suffixes_list.push(_hostname)
                                        }
                                    }

                                    let _datacenter = assetObject.datacenter

                                    while (_datacenter.length > 1) {
                                        _datacenter = _datacenter.substr(1)
                                        suffixes_list.push(_datacenter)
                                    }

                                    let _datacenterAbbrev = assetObject.datacenterAbbrev

                                    while (_datacenterAbbrev.length > 1) {
                                        _datacenterAbbrev = _datacenterAbbrev.substr(1)
                                        suffixes_list.push(_datacenterAbbrev)
                                    }
                                    let _owner = assetObject.owner

                                    if (_owner) {
                                        while (_owner.length > 1) {
                                            _owner = _owner.substr(1)
                                            suffixes_list.push(_owner)
                                        }
                                    }

                                    index.saveObject({
                                        ...assetObject,
                                        objectID: id,
                                        suffixes: suffixes_list.join(' ')
                                    })
                                    console.log(assetObject, suffixes_list.join(' '))

                                    console.log("Document successfully updated in racks");
                                    logutils.addLog(id, logutils.ASSET(), logutils.CREATE())
                                    callback(true);
                                })
                            } else {
                                racksRef.doc(String(doc.data().changes.rackID["new"])).update({
                                    assets: firebase.firestore.FieldValue.arrayUnion(id)
                                }).then(function () {
                                    let suffixes_list = []
                                    let _model = assetObject.model

                                    while (_model.length > 1) {
                                        _model = _model.substr(1)
                                        suffixes_list.push(_model)
                                    }

                                    let _hostname = assetObject.hostname

                                    while (_hostname.length > 1) {
                                        _hostname = _hostname.substr(1)
                                        suffixes_list.push(_hostname)
                                    }

                                    let _datacenter = assetObject.datacenter

                                    while (_datacenter.length > 1) {
                                        _datacenter = _datacenter.substr(1)
                                        suffixes_list.push(_datacenter)
                                    }

                                    let _datacenterAbbrev = assetObject.datacenterAbbrev

                                    while (_datacenterAbbrev.length > 1) {
                                        _datacenterAbbrev = _datacenterAbbrev.substr(1)
                                        suffixes_list.push(_datacenterAbbrev)
                                    }
                                    let _owner = assetObject.owner

                                    while (_owner.length > 1) {
                                        _owner = _owner.substr(1)
                                        suffixes_list.push(_owner)
                                    }

                                    index.saveObject({
                                        ...assetObject,
                                        objectID: id,
                                        suffixes: suffixes_list.join(' ')
                                    })
                                    console.log(assetObject, suffixes_list.join(' '))
                                    console.log("Document successfully updated in racks");
                                    logutils.addLog(id, logutils.ASSET(), logutils.CREATE())
                                    callback(true);
                                })
                            }
                        }).catch(function () {
                            callback(null);
                        })
                    } else {
                        callback(null);
                    }
                }).catch(function () {
                    callback(null);
                });
            }).catch(function (error) {
                // callback("Error");
                console.log(error)
            })


        }
    })
}

function executeEditAsset(doc, callback) {
    let assetObject = {};
    let count = 0;
    Object.keys(doc.data().changes).forEach(change => {
        assetObject = {
            ...assetObject,
            [change]: doc.data().changes[change]["new"]
        };
        count++;
        if (count === Object.keys(doc.data().changes).length) {
            console.log("checkpoint w")
            assetnetworkportutils.symmetricNetworkConnectionsDelete(doc.data().assetID.toString(), deleteResult => {
                if (deleteResult) {
                    logutils.getObjectData(String(doc.data().assetID), doc.data().location === "offline" ? logutils.OFFLINE() : logutils.ASSET(), assetData => {
                        if (doc.data().changes.networkConnections) {
                            assetnetworkportutils.symmetricNetworkConnectionsAdd(assetnetworkportutils.networkConnectionsToArray(doc.data().changes.networkConnections["new"]), doc.data().assetID, doc.data().location === "offline" ? true : null);
                        }
                        let query = doc.data().location === "offline" ? db.collectionGroup("offlineAssets").where("assetId", "==", doc.data().assetID.toString()) : assetRef.doc(doc.data().assetID.toString());
                        query.get().then(function (queryResult) {
                            let documentSnapshot;
                            if(doc.data().location === "offline" && queryResult.empty){
                                callback(null);
                            } else if(doc.data().location === "rack" && !queryResult.exists){
                                callback(null);
                            }
                            documentSnapshot = doc.data().location === "offline" ? queryResult.docs[0] : queryResult;
                            console.log("checkpoint 1")
                            let oldRackID = documentSnapshot.data().rackID;
                            let newRackID = doc.data().changes.rackID ? doc.data().changes.rackID["new"] : documentSnapshot.data().rackID;
                            let oldPowerPorts = documentSnapshot.data().powerConnections;
                            let newPowerPorts = doc.data().changes.powerConnections ? doc.data().changes.powerConnections["new"] : documentSnapshot.data().powerConnections;
                            console.log("checkpoint 3")
                            assetutils.replaceAssetRack(oldRackID, newRackID, oldPowerPorts, newPowerPorts, doc.data().assetID, null, replaceResult => {
                                if (replaceResult) {
                                    console.log("checkpoint 4")
                                    let updateQuery = doc.data().location === "offline" ? firebaseutils.offlinestorageRef.doc(documentSnapshot.ref.parent.parent.id).collection("offlineAssets").doc(String(doc.data().assetID)) : assetRef.doc(String(doc.data().assetID));
                                    updateQuery.update(assetObject).then(function () {
                                        console.log("checkpoint 6")
                                        let suffixes_list = []
                                        let _model = documentSnapshot.data().model
                                        console.log("checkpoint 11", _model, assetObject)
                                        while (_model.length > 1) {
                                            _model = _model.substr(1)
                                            console.log(_model)
                                            suffixes_list.push(_model)
                                        }
                                        console.log("checkpoint 12")

                                        let _hostname = documentSnapshot.data().hostname

                                        while (_hostname.length > 1) {
                                            _hostname = _hostname.substr(1)
                                            suffixes_list.push(_hostname)
                                        }
                                        console.log("checkpoint 7")

                                        if(doc.data().location === "rack") {
                                            let _datacenter = documentSnapshot.data().datacenter

                                            while (_datacenter.length > 1) {
                                                _datacenter = _datacenter.substr(1)
                                                suffixes_list.push(_datacenter)
                                            }

                                            let _datacenterAbbrev = documentSnapshot.data().datacenterAbbrev

                                            while (_datacenterAbbrev.length > 1) {
                                                _datacenterAbbrev = _datacenterAbbrev.substr(1)
                                                suffixes_list.push(_datacenterAbbrev)
                                            }
                                        }
                                        console.log("checkpoint 8")
                                        let _owner = documentSnapshot.data().owner

                                        while (_owner.length > 1) {
                                            _owner = _owner.substr(1)
                                            suffixes_list.push(_owner)
                                        }
                                        console.log("checkpoint 9")

                                        let mergedAssetData = documentSnapshot.data();
                                        let mergeCount = 0;
                                        Object.keys(doc.data().changes).forEach(change => {
                                            mergedAssetData[change] = doc.data().changes[change]["new"];
                                            mergeCount++;
                                            if (count === Object.keys(doc.data().changes).length) {
                                                index.saveObject({
                                                    ...mergedAssetData,
                                                    objectID: doc.data().assetID,
                                                    suffixes: suffixes_list.join(' ')
                                                })
                                                console.log("Updated model successfully")
                                                console.log(assetData)
                                                logutils.addLog(String(doc.data().assetID), doc.data().location === "rack" ? logutils.ASSET() : logutils.OFFLINE(), logutils.MODIFY(), assetData)
                                                callback(true);
                                            }
                                        });
                                    }).catch(function (error) {
                                        callback(error);
                                    });
                                } else {
                                    console.log("checkpoint 5")
                                    callback(null);
                                }
                            }, doc.data().location === "offline" ? true : null);
                        }).catch(function () {
                            callback(null);
                        });
                    });
                } else {
                    callback(null);
                }
            }, doc.data().location === "offline" ? true : null)
        }
    })
}

function getMergedAssetAndChange(changePlanID, step, callback) {
    changeplansRef.doc(changePlanID.toString()).collection("changes").where("step", "==", parseInt(step)).get().then(function (querySnapshot) {
        if (!querySnapshot.empty) {
            let changeData = querySnapshot.docs[0].data().changes;
            let assetID = querySnapshot.docs[0].data().assetID;
            let query = querySnapshot.docs[0].data().location === "rack" ? assetRef.doc(assetID.toString()) : db.collectionGroup("offlineAssets").where("assetId", "==", assetID.toString());
            query.get().then(function (queryResult) {
                if(querySnapshot.docs[0].data().location === "rack" && !queryResult.exists){
                    callback(null);
                } else if(querySnapshot.docs[0].data().location === "offline" && queryResult.empty){
                    callback(null);
                }
                let documentSnapshot = querySnapshot.docs[0].data().location === "rack" ? queryResult : queryResult.docs[0];
                let assetData = documentSnapshot.data();
                assetData.changeDocID = querySnapshot.docs[0].id;
                let count = 0;
                Object.keys(changeData).forEach(change => {
                    assetData[change] = changeData[change]["new"];
                    count++;
                    if (count === Object.keys(changeData).length) {
                        callback(assetData);
                    }
                });
            })
        } else {
            callback(null);
        }
    });
}

function getChangePlanData(changePlanID, callback) {
    changeplansRef.doc(changePlanID).get().then(changeplanDoc => {
        if (changeplanDoc.exists) {
            callback(changeplanDoc.data())
        } else {
            callback(null)
        }
    })
}

function getAssetFromAddAsset(changePlanID, step, callback) {
    changeplansRef.doc(changePlanID.toString()).collection("changes").where("step", "==", parseInt(step)).get().then(function (querySnapshot) {
        if (!querySnapshot.empty) {
            let changeData = querySnapshot.docs[0].data().changes;
            let asset = {
                changeDocID: querySnapshot.docs[0].id
            };
            let count = 0;
            Object.keys(changeData).forEach(change => {
                asset[change] = changeData[change]["new"];
                count++;
                if (count === Object.keys(changeData).length) {
                    callback(asset);
                }
            });
        } else {
            callback(null);
        }
    })
}

function checkChangeAlreadyExists(changePlanID, assetID, change, callback) {
    console.log(changePlanID, assetID, change)
    changeplansRef.doc(changePlanID.toString()).collection("changes").where("assetID", "==", parseInt(assetID)).where("change", "==", change).get().then(function (querySnapshot) {

        if (querySnapshot.empty) {
            callback(false);
        } else {
            callback(true);
        }
    }).catch(function (error) {
        console.log(error)
        callback(false);
    })
}

function getChassisFromHostname(hostname, datacenter, callback){
    if(!hostname){
        callback(true);
    } else {
        let split = hostname.split(' ');
        let findChassis = split.length > 1 ? firebaseutils.assetRef.where('assetId','==',split.slice(-1)[0]) : firebaseutils.assetRef.where('hostname','==', hostname);
        findChassis.where('datacenter','==', datacenter).get().then(function (querySnapshot) {
            if(querySnapshot.empty){
                callback(null);
            } else {
                callback(querySnapshot.docs[0].data().rack, querySnapshot.docs[0].data().rackU, querySnapshot.docs[0].id)
            }
        }).catch(function () {
            callback(null);
        })
    }
}

export {
    getChangePlans,
    getChanges,
    getChangeDetails,
    getStepDocID,
    addChangePlan,
    deleteChangePlan,
    editChangePlan,
    addAssetChange,
    editAssetChange,
    generateWorkOrder,
    deleteChange,
    decommissionAssetChange,
    executeChangePlan,
    getMergedAssetAndChange,
    getAssetFromAddAsset,
    getChangePlanData,
    checkChangeAlreadyExists,
    moveAssetChange
}
