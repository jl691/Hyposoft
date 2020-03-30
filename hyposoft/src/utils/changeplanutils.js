import * as firebaseutils from "./firebaseutils";
import * as assetnetworkportutils from "./assetnetworkportutils";
import * as logutils from "./logutils"
import * as assetutils from "./assetutils"
import * as rackutils from "./rackutils"
import * as decommissionutils from "./decommissionutils"
import * as changeplanconflictutils from './changeplanconflictutils'
import { changeplansRef } from "./firebaseutils";
import { assetRef } from "./firebaseutils";
import { racksRef } from "./firebaseutils";
import { firebase } from "./firebaseutils";
import * as assetIDutils from "./assetidutils";

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('assets')

function getChangePlans(itemCount, username, callback, start = null) {
    console.log(username)
    let query = start ? firebaseutils.changeplansRef.where("owner", "==", username).orderBy("name").startAfter(start).limit(25) : firebaseutils.changeplansRef.where("owner", "==", username).orderBy("name").limit(25);
    query.get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(null, null, null, true);
        } else {
            let newStart = querySnapshot.docs[querySnapshot.docs.length - 1];
            let count = 0;
            let changePlans = [];
            querySnapshot.docs.forEach(changePlan => {
                changePlans.push({ id: changePlan.id, count: itemCount++, ...changePlan.data() });
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
                        changes.push({ id: change.data().step, ...change.data() })
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
        }
        else {
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

    let assetChangePlanObject = {
        assetID: assetID ? parseInt(assetID) : "",
        change: "add",
        changes: {},
    };
    Object.keys(asset).forEach(assetProperty => {
        let oldProperty = (assetProperty === "networkConnections" || assetProperty === "macAddresses") ? {} : (assetProperty === "powerConnections" ? [] : "");
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
                changeplansRef.doc(changePlanID).collection("changes").doc(docID).set(assetChangePlanObject).then(function (doc) {

                    callback(true);
                }).then(function () {
                    changeplanconflictutils.clearAllConflicts(changePlanID, status1 => {
                        changeplanconflictutils.checkAllLiveDBConflicts(docSnapInner.data().executed, changePlanID, status2 => {
                            // console.log("Made it back from db checks")
                            changeplanconflictutils.checkSequentialStepConflicts(docSnapInner.data().executed, changePlanID, status3 => {
                                console.log("DONE RECHECKING")

                            })
                        })
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
            changeplansRef.doc(changePlanID).collection("changes").add(assetChangePlanObject).then(function (doc) {
                //network ports need to be done at time of execution
                //so does power port and logging

                //added the doc.id for change plan conflict checking: need to know which step we are checking
                callback(true);
            }).then(function () {
                changeplanconflictutils.clearAllConflicts(changePlanID, status1 => {
                    changeplanconflictutils.checkAllLiveDBConflicts(querySnapshot.docs[0].data().executed, changePlanID, status2 => {
                        // console.log("Made it back from db checks")
                        changeplanconflictutils.checkSequentialStepConflicts(querySnapshot.docs[0].data().executed, changePlanID, status3 => {
                            console.log("DONE RECHECKING")

                        })
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

function editAssetChange(newAsset, assetID, changePlanID, callback, docID = null) {
    console.log(docID)
    assetRef.doc(assetID).get().then(function (documentSnapshot) {
        if (documentSnapshot.exists) {
            let assetChangePlanObject = {
                assetID: parseInt(assetID),
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
                        changeplansRef.doc(changePlanID).collection("changes").doc(docID).set(assetChangePlanObject).then(function (doc) {
                            callback(true);
                        }).then(function () {
                            changeplanconflictutils.clearAllConflicts(changePlanID, status1 => {
                                //checking against liveDB not necessary, and only take more time
                                changeplanconflictutils.checkAllLiveDBConflicts(docSnapInner.data().executed, changePlanID, status2 => {
                                    //     console.log("Made it back from db checks")
                                    changeplanconflictutils.checkSequentialStepConflicts(docSnapInner.data().executed, changePlanID, status3 => {
                                        console.log("DONE RECHECKING")

                                    })
                                })
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
                    changeplansRef.doc(changePlanID).collection("changes").add(assetChangePlanObject).then(function (doc) {
                        //network ports need to be done at time of execution
                        //so does power port and logging
                        callback(true);

                    }).then(function () {
                        changeplanconflictutils.clearAllConflicts(changePlanID, status1 => {
                            //checking against liveDB not necessary, and only take more time
                            changeplanconflictutils.checkAllLiveDBConflicts(querySnapshot.docs[0].data().executed, changePlanID, status2 => {
                                //     console.log("Made it back from db checks")
                                changeplanconflictutils.checkSequentialStepConflicts(querySnapshot.docs[0].data().executed, changePlanID, status3 => {
                                    console.log("DONE RECHECKING")

                                })
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
        } else {
            console.log("dcosnap doesnt exist");
            callback(null);
        }
    });
}

function decommissionAssetChange(assetID, changePlanID, callback, stepID = null) {
    assetRef.doc(assetID).get().then(function (documentSnapshot) {
        if (documentSnapshot.exists) {
            if (stepID) {
                changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepID)).get().then(function (querySnapshot) {
                    console.log(querySnapshot.docs[0].data())
                    if (!querySnapshot.empty) {
                        let docID = querySnapshot.docs[0].id;
                        changeplansRef.doc(changePlanID).collection("changes").doc(docID).update({
                            assetID: parseInt(assetID)
                        })
                            // .then(function () {
                            //     callback(true);
                            // })
                            .then(function () {
                                changeplanconflictutils.clearAllConflicts(changePlanID, status1 => {

                                    changeplanconflictutils.checkAllLiveDBConflicts(querySnapshot.docs[0].data().executed, changePlanID, status2 => {
                                        //   console.log("Made it back from db checks")
                                        changeplanconflictutils.checkSequentialStepConflicts(querySnapshot.docs[0].data().executed, changePlanID, status3 => {
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
                        change: "decommission",
                        step: changeNumber
                    })
                        .then(function () {
                            callback(true);
                        })
                        .then(function () {
                            getChangePlanData(changePlanID, cpData =>{

                            changeplanconflictutils.clearAllConflicts(changePlanID, status1 => {
                                changeplanconflictutils.checkAllLiveDBConflicts(cpData.executed, changePlanID, status2 => {
                                    //   console.log("Made it back from db checks")
                                    changeplanconflictutils.checkSequentialStepConflicts(cpData.executed, changePlanID, status3 => {
                                        console.log("DONE RECHECKING decomm")
                                        //callback(true)

                                    })
                                })
                            })
                            })


                        }).catch(function (error) {
                            console.log(error)
                            callback(null);
                        });
                });
            }
        } else {
            console.log("2")
            callback(null);
        }
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
                        //callback(true)
                        changeplanconflictutils.clearAllConflicts(changePlanID, status => {
                            changeplanconflictutils.checkAllLiveDBConflicts(executed, changePlanID, status2 => {
                                console.log("Made it back from db checks")
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
                    console.log("decommission", count)
                    assetRef.doc(doc.data().assetID.toString()).get().then(function (documentSnapshot) {
                        let decommissionText = ["Decommission asset #" + doc.data().assetID + " from datacenter " + documentSnapshot.data().datacenter + " at rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U."];
                        let networkPromise = new Promise(function (resolve, reject) {
                            if (documentSnapshot.data().networkConnections && Object.keys(documentSnapshot.data().networkConnections).length) {
                                decommissionText.push("Remove the following network connections:");
                                let countInner = 0;
                                Object.keys(documentSnapshot.data().networkConnections).forEach(networkPort => {
                                    decommissionText.push("port " + networkPort + " connected to asset #" + documentSnapshot.data().networkConnections[networkPort].otherAssetID + " on port " + documentSnapshot.data().networkConnections[networkPort].otherPort);
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
                                decommissionText.push("Remove the following power connections: ");
                                let countInner = 0;
                                Object.keys(documentSnapshot.data().powerConnections).forEach(powerPort => {
                                    decommissionText.push("port " + powerPort + " connected to the PDU " + documentSnapshot.data().powerConnections[powerPort].pduSide.toLowerCase() + " side on port " + documentSnapshot.data().powerConnections[powerPort].port);
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
                            steps[doc.data().step-1] = decommissionText;
                            console.log(steps);
                            count++;
                            console.log("3", count, querySnapshot.size)
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
                        steps[doc.data().step-1] = addText;
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
                        steps[doc.data().step-1] = result;
                        console.log(steps);
                        count++;
                        console.log("2", count, querySnapshot.size)
                        if (count === querySnapshot.size) {
                            console.log(steps);
                            callback(steps);
                        }
                    })
                }
            })
        }
    }).catch(function (error) {
        console.log(error);
        callback(null);
    })
}

function generateEditWorkOrderMessage(doc, callback) {
    assetRef.doc(doc.data().assetID.toString()).get().then(function (documentSnapshot) {
        let changes = [];
        if (documentSnapshot.exists) {
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
        } else {
            callback(null);
        }
    }).catch(function () {
        callback(null);
    })
}

function executeChangePlan(changePlanID, callback) {
    changeplansRef.doc(changePlanID.toString()).collection("changes").get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(true);
        } else {
            logutils.addLog(changePlanID, logutils.CHANGEPLAN(), logutils.EXECUTE());
            let count = 0;
            querySnapshot.docs.forEach(change => {
                console.log(change)
                if (change.data().change === "add") {
                    console.log("add")
                    if (change.data().changes.assetId && change.data().changes.assetId["new"]) {
                        console.log("not generating")
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
                        //generate
                        console.log("generating")
                        assetIDutils.generateAssetID().then(newID => {
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
                        });
                    }
                } else if (change.data().change === "edit") {
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
                    //decomission
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
                    })
                }
            })
        }
    }).catch(function (error) {
        console.log(error)
        callback(null);
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

                                    console.log("Document successfully updated in racks");
                                    logutils.addLog(id, logutils.ASSET(), logutils.CREATE())
                                    callback(true);
                                })
                            } else {
                                racksRef.doc(String(doc.data().changes.rackID["new"])).update({
                                    assets: firebase.firestore.FieldValue.arrayUnion(id)
                                }).then(function () {
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
                    logutils.getObjectData(String(doc.data().assetID), logutils.ASSET(), assetData => {
                        if (doc.data().changes.networkConnections) {
                            assetnetworkportutils.symmetricNetworkConnectionsAdd(assetnetworkportutils.networkConnectionsToArray(doc.data().changes.networkConnections["new"]), doc.data().assetID);
                        }
                        assetRef.doc(doc.data().assetID.toString()).get().then(function (documentSnapshot) {
                            console.log("checkpoint 1")
                            if (documentSnapshot.exists) {
                                let oldRackID = documentSnapshot.data().rackID;
                                let newRackID = doc.data().changes.rackID ? doc.data().changes.rackID["new"] : documentSnapshot.data().rackID;
                                let oldPowerPorts = documentSnapshot.data().powerConnections;
                                let newPowerPorts = doc.data().changes.powerConnections ? doc.data().changes.powerConnections["new"] : documentSnapshot.data().powerConnections;
                                assetutils.replaceAssetRack(oldRackID, newRackID, oldPowerPorts, newPowerPorts, doc.data().assetID, null, replaceResult => {
                                    if (replaceResult) {
                                        assetRef.doc(String(doc.data().assetID)).update(assetObject).then(function () {
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
                                                objectID: doc.data().assetID,
                                                suffixes: suffixes_list.join(' ')
                                            })
                                            console.log("Updated model successfully")
                                            logutils.addLog(String(doc.data().assetID), logutils.ASSET(), logutils.MODIFY(), assetData)
                                            callback(true);
                                        }).catch(function (error) {
                                            callback(error);
                                        });
                                    } else {
                                        callback(null);
                                    }
                                });
                            }
                        }).catch(function () {
                            callback(null);
                        });
                    });
                } else {
                    callback(null);
                }
            })
        }
    })
}

function getMergedAssetAndChange(changePlanID, step, callback) {
    changeplansRef.doc(changePlanID.toString()).collection("changes").where("step", "==", parseInt(step)).get().then(function (querySnapshot) {
        if (!querySnapshot.empty) {
            let changeData = querySnapshot.docs[0].data().changes;
            let assetID = querySnapshot.docs[0].data().assetID;
            assetRef.doc(assetID.toString()).get().then(function (documentSnapshot) {
                if (documentSnapshot.exists) {
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
                } else {
                    callback(null);
                }
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
        }
        else { callback(null) }
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

function checkChangeAlreadyExists(changePlanID, assetID, change, callback){
    console.log(changePlanID, assetID, change)
    changeplansRef.doc(changePlanID.toString()).collection("changes").where("assetID", "==", parseInt(assetID)).where("change", "==", change).get().then(function (querySnapshot) {
        if(querySnapshot.empty){
            callback(false);
        } else {
            callback(true);
        }
    }).catch(function (error) {
        console.log(error)
        callback(false);
    })
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
    checkChangeAlreadyExists
}
