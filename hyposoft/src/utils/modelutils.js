import * as firebaseutils from './firebaseutils'

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
        comment: comment.trim()
    }
    return model
}

function combineVendorAndModelNumber(vendor, modelNumber) {
    return vendor.concat(' ', modelNumber)
}

function createModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment) {
    firebaseutils.modelsRef.add(packageModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment))
}

function modifyModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment) {
    firebaseutils.modelsRef.where('vendor', '==', vendor)
    .where('modelNumber', '==', modelNumber)
    .get().then(qs => {
        if (!qs.empty) {
            qs.docs[0].ref.update(packageModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment))
        }
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
            callback(qs.docs[0].data())
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
        {...doc.data()}
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

export { createModel, modifyModel, deleteModel, getModel, doesModelDocExist, getSuggestedVendors, getModels }
