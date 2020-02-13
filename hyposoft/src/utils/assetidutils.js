import { assetRef,  firebase } from './firebaseutils'
// import * as rackutils from './rackutils'
// import * as modelutils from './modelutils'
// import * as userutils from './userutils'

function generateAssetID() {
    //Asset IDs are 6 digits long. CONFIRM THIS

    return new Promise((resolve, reject) => {
        var triesLeft = 5;
        var result = '';
        var characters = '0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i <= 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
    
        }

        //Checking if the generated ID is unique: call function here
        isUniqueAssetID(result, status => {
            if(status){
                console.log('Newly generated asset ID: ' + result);
                resolve(result)
                //return result;
            }
            else{
                console.log("This asset ID is not unique. Trying again.")
                triesLeft--;
                if(triesLeft >= 0){

                    generateAssetID()
                }
                else{
                    reject("Error trying to generate unique assetID: timeout")
                }
              
    
            }
        })
    })
}

function isUniqueAssetID(id, callback) {

    assetRef.doc(id).get().then(function(doc) {
        if (doc.exists) {
            callback(null)
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document exists. Is unique");
            callback(true)
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
        
    });

}

//Called in the AssetIDForm popup component
function overrideAssetID(inputID) {
    return new Promise((resolve, reject) => {
        //needs to be within range
        //needs to be unique
        if(parseInt(inputID) <=999999 && parseInt(inputID) >= 100000){
            isUniqueAssetID(inputID, result => {
                if(result){
                    resolve(null)
                }
                else{
                    reject("Not a valid asset ID. Must be unique.")
                }
            })
        }
        else{
            reject("Not a valid asset ID. Must be within range.")

        }

    })
}

export {
    generateAssetID,
    isUniqueAssetID,
    overrideAssetID,

}