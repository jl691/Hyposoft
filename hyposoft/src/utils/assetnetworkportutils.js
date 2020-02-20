import { assetRef, modelsRef } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as userutils from './userutils'
import * as assetIDutils from './assetidutils'

//TODO: ethernetPorts --> networkPorts 
//hardcode a set of networkPorts

//If the network connections field in the assets collections is to be a map, then it needs to be a custom collection, according to firestore documentation: https://firebase.google.com/docs/firestore/manage-data/add-data



//these fields come from the form being filled out
function validateNetworkConnections(thisModelName, networkPortConnections, callback) {

    //The port needs to exist (so on this and other asset). Autcomplete picklist should help with this, but still need to throw correct error

    let numConnectionsMade = networkPortConnections.length
    let mostPossibleConnections = 0;
    for (let i = 0; i < numConnectionsMade; i++) {
        let otherAssetID = networkPortConnections[i].otherAssetID;
        let otherPort = networkPortConnections[i].otherPort;
        let thisPort = networkPortConnections[i].thisPort
        console.log(otherAssetID);
        console.log(otherPort);
        console.log(thisPort)

        //Left entirely empty is OK
        if (otherAssetID == null && otherPort.trim() === "" && thisPort.trim() === "") {
            callback(null)

        }
        //All of the fields have been filled in
        else if (otherAssetID != null && otherPort.trim() !== "" && thisPort.trim() !== "") {

            modelsRef.where("modelName", "==", thisModelName).get().then(function (querySnapshot) {
                //Number of ports on the model that you are trying to add an asset of
                console.log(querySnapshot.docs[0].data().modelName)
                let numThisModelPorts = 3//querySnapshot.docs[0].data().networkPorts.length;

                //Getting the number of network ports from the asset trying to connect to
                console.log(otherAssetID)
                assetRef.doc(otherAssetID).get().then(function (otherAssetModelDoc) {
                    if (!otherAssetModelDoc.exists) {
                        callback("To connect to another asset, please enter a valid asset ID")
                    }
                    else {
                        let otherModel = otherAssetModelDoc.data().model
                        console.log(otherModel)

                        modelsRef.where("modelName", "==", otherModel).get().then(function (querySnapshot) {

                            let numOtherModelPorts = 2//querySnapshot.data().networkPorts.length
                            console.log(numThisModelPorts)
                            console.log(numOtherModelPorts)
                            //Math.min with a null, null is treated as 0
                            mostPossibleConnections = Math.min(numThisModelPorts, numOtherModelPorts)
                            //https://javascript.info/comparison

                            if (numConnectionsMade > mostPossibleConnections) {
                                if (mostPossibleConnections) {
                                    console.log("case one")
                                    callback("Making too many network connections. The most connections you can make between existing hardware is " + mostPossibleConnections)

                                }
                                else {
                                    console.log("case two")
                                    callback("Cannot make network connections. There are no ethernet ports on one or both assets.")

                                }
                            } else {
                                console.log("case three")
                                //Made an appropriate number of connections between the specified hardware
                                //Now need to check that the ports exist
                                checkThisModelPortsExist(thisModelName, networkPortConnections, nonThisExist => {
                                    if (nonThisExist) {//means there's an error message
                                        callback(nonThisExist)
                                    }
                                    else {

                                        //does not go into this check correctly
                                        console.log("In this check")
                                        checkOtherAssetPortsExist(networkPortConnections, otherNonexist => {
                                            if (otherNonexist) {

                                                callback(otherNonexist)
                                            }
                                            else {
                                                // checkNetworkPortConflicts(networkPortConnections, status => {
                                                //     if (status) {
                                                //         reject("can't connect host1 port e1 to switch1 port 22 that port is already connected to host5 port e1")
                                                //     }
                                                //     else {

                                                callback(null)
                                                console.log("Congrats, you made it here. Here is a heart container for your efforts <3")

                                                //  }
                                                // })

                                            }
                                        })
                                    }

                                })

                            }
                        })


                    }


                }).catch(error => { console.log(error) })
            })
        }
        else {
            //has been partially filled out
            callback("To make a network connection, must fill out all fields.")
        }

    }


}

//Everything else below are helper functions called in the above validate function

function checkNetworkPortConflicts(networkPortConnections, callback) {
    //No doubly connected ports on this (see networkPortConns) and other asset. Must check every singe=le asst
    //The error message ^ must be specific: “can’t connect host1 port e1 to switch1 port 22; that port is already connected to host5 port e1”).



    //accessing the asset NC map..on all the assets, including current one you are trying to add



    callback(null)


}
//Assuming models will have a field called networkPorts and will be an array
function checkThisModelPortsExist(thisModelName, networkConnections, callback) {
    let nonexistentPort = false;
    let errPort = "";
    let errModel = "";

    modelsRef.where("modelName", "==", thisModelName).get().then(function (querySnapshot) {
        for (let i = 0; i < networkConnections.length; i++) {
            //does the model contain this port name?
            console.log(networkConnections)

            let hardCodedNetworkPorts = ["1", "2", "e3"]
            if (!hardCodedNetworkPorts.includes(networkConnections[i].thisPort)) {
                //if (!querySnapshot.docs[0].data().networkPorts.includes(networkConnections[i].thisPort)) {
                nonexistentPort = true;
                errPort=networkConnections[i].thisPort
                errModel = thisModelName;

            }

        }

        if (!nonexistentPort) {
            callback(null)
        }
        else {

        //TODO: multiple ports could not exist if user adds multiple wrong connections. Need to change erro msg
            callback("Trying to connect a nonexistent port " + errPort + " on this model: " + errModel)
        }

    }).catch("This model you are trying to add does not exist: " + thisModelName)


}

function checkOtherAssetPortsExist(networkConnections, callback) {

    let nonexistentPort = false;
    let errPort = "";
    let errInstance = "";
    let errModel = "";

    for (let i = 0; i < networkConnections.length; i++) {
        assetRef.doc(networkConnections[i].otherAssetID).get().then(function (querySnapshot) {
            let otherModel = querySnapshot.data().model;
            console.log(otherModel)
            modelsRef.where("modelName", "==", otherModel).get().then(function (querySnapshot) {

                console.log(networkConnections[i].otherPort)
                let hardCodedNetworkPorts = ["a", "b", "c"]
                if (!hardCodedNetworkPorts.includes(networkConnections[i].otherPort)) {
                    //if (!querySnapshot.data().networkPorts.includes(networkConnections[i].otherPort)) {
                    nonexistentPort = true;
                    errPort = networkConnections[i].thisPort;
                    errInstance = networkConnections[i].otherAssetID;
                    errModel = otherModel;
                    console.log("connecting to a nonexistent port on the other model")
                }
            })

        }).catch("This other asset you are trying to connect to does not exist")
    }
    if (!nonexistentPort) {
        callback(null)
    }
    else {

        //TODO: multiple ports could not exist if user adds multiple wrong connections. Need to change erro msg
        callback("Trying to connect a nonexistent port " + errPort + " on this instance: " + errInstance + " which is of model " + errModel)
    }

}



function symmetricNetworkConnections(networkConnections) {
    //Make sure connections are symmetric. Meaning the other asset should have their network port connectiosn updated too
    //This is what's responsible for making the map from the networkConnections Array to finally pass into the database
    //Call validation function here, then depending on results, go into this for loop

}
function networkConnectionsToMap(networkConnectionsArray) {

    var JSONConnections = {}
    var JSONValues = {}
    for (let i = 0; i < networkConnectionsArray.length; i++) {

        let key = networkConnectionsArray[i].thisPort;
        let value1 = networkConnectionsArray[i].otherAssetID;
        let value2 = networkConnectionsArray[i].otherPort;
        JSONValues["otherAssetID"] = value1
        JSONValues["otherPort"] = value2
        JSONConnections[key] = JSONValues;

    }

    return JSONConnections;
}


export {
    validateNetworkConnections,
    checkNetworkPortConflicts,
    checkOtherAssetPortsExist,
    checkThisModelPortsExist,
    symmetricNetworkConnections,
    networkConnectionsToMap,


}