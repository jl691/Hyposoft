import * as firebaseutils from './firebaseutils'
import * as logutils from './logutils'
import * as userutils from './userutils'
import * as assetnetworkportutils from '../utils/assetnetworkportutils'
import * as assetutils from "../utils/assetutils"

function decommissionAsset(id,callback) {
    firebaseutils.assetRef.doc(id).get().then(doc => {
        if (!doc.exists) {
            callback(false)
            return
        }
        const docData = doc.data()
        assetnetworkportutils.getNetworkPortConnections(id, graph => {
          firebaseutils.usersRef.doc(userutils.getLoggedInUser()).get().then(doc => {
            if (!doc.exists) {
                callback(false)
                return
            }
            assetutils.deleteAsset(id, result => {
                if (result) {
                  logutils.addLog(id,logutils.ASSET(),logutils.DECOMMISSION(),docData)
                  firebaseutils.decommissionRef.add({...docData,timestamp: Date.now(),name: doc.data().username,graph: graph}).then(() => callback(true))
                  .catch( error => {
                      console.log("Error getting documents: ", error)
                      callback(false)
                  })
                } else {
                  callback(false)
                }
              }, true)
            })
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
}

function getAssets(startAfter, callback, search = '') {
    var query = startAfter ? firebaseutils.decommissionRef.orderBy('timestamp','desc').startAfter(startAfter)
                           : firebaseutils.decommissionRef.orderBy('timestamp','desc')
    query.get().then(docSnaps => {
        var newStartAfter = docSnaps.docs[docSnaps.docs.length-1]

        // const assets = docSnaps.docs.map(doc => (
        //     {...doc.data(), date: getDate(doc.data().timestamp)}
        // ))
        // callback(assets,newStartAfter)
        var assets = []
        const searchName = search.trim().toLowerCase()
        docSnaps.docs.forEach(doc => {
            var strings = []
            strings.push(getDate(doc.data().timestamp).toLowerCase())
            strings.push(doc.data().assetId.toLowerCase())
            strings.push(doc.data().model.toLowerCase())
            strings.push(doc.data().hostname.toLowerCase())
            strings.push(doc.data().name.toLowerCase())
            strings.push(doc.data().owner.toLowerCase())
            strings.push(doc.data().datacenterAbbrev.toLowerCase())
            var comp;
            for (comp in strings) {
                if (!search || strings[comp].includes(searchName)) {
                    assets = [...assets,{...doc.data(), date: getDate(doc.data().timestamp)}]
                    newStartAfter = doc
                    break
                }
            }
        })
        callback(assets,newStartAfter)
    })
    .catch( error => {
        console.log("Error getting documents: ", error)
        callback([],null)
    })
}

function sortAssets(startAfter, callback, field, direction) {
    var query = field ? (direction ? (startAfter ? firebaseutils.decommissionRef.orderBy(field).startAfter(startAfter)
                                                 : firebaseutils.decommissionRef.orderBy(field))
                                   : (startAfter ? firebaseutils.decommissionRef.orderBy(field,'desc').startAfter(startAfter)
                                                 : firebaseutils.decommissionRef.orderBy(field,'desc')))
                      : (startAfter ? firebaseutils.decommissionRef.orderBy('timestamp','desc').startAfter(startAfter)
                                    : firebaseutils.decommissionRef.orderBy('timestamp','desc'))
    query.get().then(docSnaps => {
        if (docSnaps.empty) {
            callback([], null)
            return
        }
        var newStartAfter = docSnaps.docs[docSnaps.docs.length-1]

        const assets = docSnaps.docs.map(doc => (
            {...doc.data(), date: getDate(doc.data().timestamp)}
        ))
        callback(assets,newStartAfter)
    })
    .catch( error => {
        console.log("Error getting documents: ", error)
        callback([],null)
    })
}

function getDate(timestamp) {
    var dateArray = new Date(timestamp).toString().split(' ',5)
    return dateArray.join(' ')
}

function getAssetDetails(id, callback) {
    firebaseutils.decommissionRef.where('assetId','==',id).get().then(docSnaps => callback({...docSnaps.docs[0].data(),date: getDate(docSnaps.docs[0].data().timestamp)}))
    .catch( error => {
        console.log("Error getting documents: ", error)
        callback(null)
    })
}

// rackAsc should be a boolean corresponding to true if rack is ascending
// rackUAsc should be a boolean corresponding to true if rackU is ascending
function sortAssetsByRackAndRackU(rackAsc, rackUAsc, callback) {
    var query = firebaseutils.decommissionRef
    if (!rackAsc && !rackUAsc) {
        query = firebaseutils.decommissionRef.orderBy("rackRow", "desc").orderBy("rackNum", "desc").orderBy("rackU", "desc")
    } else if (rackAsc && !rackUAsc) {
        query = firebaseutils.decommissionRef.orderBy("rackRow").orderBy("rackNum").orderBy("rackU", "desc")
    } else if (!rackAsc && rackUAsc) {
        query = firebaseutils.decommissionRef.orderBy("rackRow", "desc").orderBy("rackNum", "desc").orderBy("rackU")
    } else {
        query = firebaseutils.decommissionRef.orderBy("rackRow").orderBy("rackNum").orderBy("rackU")
    }
    query.get().then(querySnapshot => {
        const assets = querySnapshot.docs.map(doc => (
            {...doc.data(), date: getDate(doc.data().timestamp)}
        ))
        callback(assets)
    }).catch(error => {
        console.log("Error getting documents: ", error)
        callback(null)
    })
}

export { decommissionAsset, getAssets, sortAssets, getAssetDetails, sortAssetsByRackAndRackU, getDate }
