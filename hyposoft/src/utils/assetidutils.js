import { assetRef,  firebase } from './firebaseutils'
// import * as rackutils from './rackutils'
// import * as modelutils from './modelutils'
// import * as userutils from './userutils'

function generateAssetID() {
    //Asset ideas are 6 digits longs

    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i <= 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));

    }
    //Checking if the generated ID is unique: call function here
    isUniqueAssetID(result, status => {
        if(status){
            console.log('Newly generated asset ID: ' + result)
            return result;
        }
        else{
            //Is this a thing in javascript lol
            console.log("This newly generated asset ID was not unique. Trying again.")
            generateAssetID()

        }
    })
    console.log("End of generateAssetID()")

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

export {
    generateAssetID,
    isUniqueAssetID,

}