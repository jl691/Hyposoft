import * as firebaseutils from './firebaseutils'
import * as logutils from './logutils'

function decommissionAsset(id,callback) {
    firebaseutils.assetRef.doc(id).get().then(doc => {
        if (!doc.exists) {
            callback(false)
            return
        }
        const docData = doc.data()
        firebaseutils.assetRef.doc(id).delete().then(() => {
            logutils.addLog(id,logutils.ASSET(),logutils.DECOMMISSION(),docData)
            firebaseutils.decommissionRef.add({...docData,timestamp: Date.now()}).then(() => callback(true))
            .catch( error => {
              console.log("Error getting documents: ", error)
              callback(false)
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

export { decommissionAsset }
