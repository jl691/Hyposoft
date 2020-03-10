import * as firebaseutils from './firebaseutils'
import * as logutils from './logutils'
import * as userutils from './userutils'

function decommissionAsset(id,callback) {
    firebaseutils.assetRef.doc(id).get().then(doc => {
        if (!doc.exists) {
            callback(false)
            return
        }
        const docData = doc.data()
        firebaseutils.usersRef.doc(userutils.getLoggedInUser()).get().then(doc => {
          if (!doc.exists) {
              callback(false)
              return
          }
          firebaseutils.assetRef.doc(id).delete().then(() => {
              logutils.addLog(id,logutils.ASSET(),logutils.DECOMMISSION(),docData)
              firebaseutils.decommissionRef.add({...docData,timestamp: Date.now(),name: doc.data().username}).then(() => callback(true))
              .catch( error => {
                  console.log("Error getting documents: ", error)
                  callback(false)
              })
              })
          })
          .catch( error => {
            console.log("Error getting documents: ", error)
            callback(false)
          })
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(false)
    })
}

function getAssets(startAfter, callback, search = '') {
    var query = startAfter ? firebaseutils.decommissionRef.orderBy('timestamp','desc').startAfter(startAfter)
                           : firebaseutils.decommissionRef.orderBy('timestamp','desc')
    query.get().then(docSnaps => {
        var newStartAfter = docSnaps.docs[docSnaps.docs.length-1]

        const assets = docSnaps.docs.map(doc => (
            {...doc.data(), date: getDate(doc.data().timestamp)}
        ))
        callback(assets,newStartAfter)
    })
    .catch( error => {
        console.log("Error getting documents: ", error)
        callback(null,null)
    })
}

function getDate(timestamp) {
    var dateArray = new Date(timestamp).toString().split(' ',5)
    return dateArray.join(' ')
}

export { decommissionAsset, getAssets }
