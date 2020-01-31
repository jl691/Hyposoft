import * as firebaseutils from './firebaseutils'
import * as rackutils from './rackutils'

function packageModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment) {
    const model = {
        vendor: vendor.trim(),
        modelNumber: modelNumber.trim(),
        height: height,
        displayColor: displayColor.trim(),
        ethernetPorts: ethernetPorts,
        powerPorts: powerPorts,
        cpu: cpu.trim(),
        memory: memory,
        storage: storage.trim(),
        comment: comment.trim(),
        modelName: vendor.trim() + ' ' + modelNumber.trim()
    }
    return model
}

function combineVendorAndModelNumber(vendor, modelNumber) {
    return vendor.concat(' ', modelNumber)
}

function createModel(id, vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment, callback) {
    // Ignore the first param
    firebaseutils.modelsRef.add(packageModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment)).then(() => {
        callback()
    })
}

function isNewHeightOk(modelId, newHeight, callback) {
    if (!modelId) {
        callback(true)
        return
    }
    firebaseutils.instanceRef.where('modelId', '==', modelId).get().then(qs => {
        var modelsChecked = 0
        var issuesFound = false
        if (qs.size === 0) {
            callback(true)
        }
        qs.forEach(doc => {
            rackutils.checkInstanceFits(doc.data().racku, newHeight, doc.data().rackID , status => {
                modelsChecked++
                if (status) {
                    callback(false)
                    issuesFound = true
                } else {
                    if (modelsChecked === qs.size && !issuesFound) {
                        callback(true)
                    }
                }
            })
        })
    })
}

function modifyModel(id, vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment, callback) {
    firebaseutils.modelsRef.doc(id).update(packageModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment)).then(() => {
        callback()
    })

    // Now update all instances of this model just in case the modelNumber or vendor changed
    firebaseutils.instanceRef.where('modelId', '==', id).get().then(qs => {
        qs.forEach(doc => {
            doc.ref.update({
                vendor: vendor,
                modelNumber: modelNumber,
                model: vendor+' '+modelNumber
            })
        })
    })
}

function deleteModel(vendor, modelNumber) {
    firebaseutils.modelsRef.where('vendor', '==', vendor)
    .where('modelNumber', '==', modelNumber)
    .get().then(qs => {
        if (!qs.empty) {
            qs.docs[0].ref.delete()
        }
    })
}

function getModel(vendor, modelNumber, callback) {
    firebaseutils.modelsRef.where('vendor', '==', vendor)
    .where('modelNumber', '==', modelNumber)
    .get().then(qs => {
        if (!qs.empty) {
            callback({...qs.docs[0].data(), id: qs.docs[0].id})
        } else {
            callback(null)
        }
    })
}

function getModelByModelname(modelName, callback) {
    firebaseutils.modelsRef.where('modelName', '==', modelName)
    .get().then(qs => {
        if (!qs.empty) {
            callback(qs.docs[0])
        } else {
            callback(null)
        }
    })
}

function getModels(startAfter, callback) {
    firebaseutils.modelsRef.orderBy('vendor').orderBy('modelNumber').limit(25).startAfter(startAfter).get()
    .then( docSnaps => {
      // added this in from anshu
      var newStartAfter = null
      if (docSnaps.docs.length === 25) {
        newStartAfter = docSnaps.docs[docSnaps.docs.length-1]
      }

      const models = docSnaps.docs.map( doc => (
        {...doc.data(), id: doc.id}
      ))
      callback(models,newStartAfter)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null,null)
    })
}

function doesModelDocExist(vendor, modelNumber, callback) {
    var docRef = firebaseutils.modelsRef.doc(combineVendorAndModelNumber(vendor, modelNumber))
    docRef.get().then(doc => {
      callback(doc.exists)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

function getSuggestedVendors(userInput, callback) {
  // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var query = userInput
                ? firebaseutils.modelsRef.where("vendor",">=",userInput).where("vendor","<",userInput.slice(0,userInput.length-1)
                  + String.fromCharCode(userInput.slice(userInput.length-1,userInput.length).charCodeAt(0)+1))
                : firebaseutils.modelsRef.orderBy('vendor')

    var vendorArray = []
    query.get().then(querySnapshot => {
      querySnapshot.forEach( doc => {
        if (!vendorArray.includes(doc.data().vendor)) {
          vendorArray.push(doc.data().vendor)
        }
      })
      callback(vendorArray)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

export { createModel, modifyModel, deleteModel, getModel, doesModelDocExist, getSuggestedVendors, getModels,
getModelByModelname, isNewHeightOk }
