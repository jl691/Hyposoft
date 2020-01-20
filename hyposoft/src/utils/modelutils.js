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
    firebaseutils.modelsRef.doc(combineVendorAndModelNumber(vendor, modelNumber)).set(packageModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment))
}

function modifyModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment) {
    firebaseutils.modelsRef.doc(combineVendorAndModelNumber(vendor, modelNumber)).update(packageUser(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment))
}

function deleteModel(vendor, modelNumber) {
    firebaseutils.modelsRef.doc(combineVendorAndModelNumber(vendor, modelNumber)).delete()
}

function doesModelDocExist(vendor, modelNumber) {
    var docRef = firebaseutils.modelsRef.doc(combineVendorAndModelNumber(vendor, modelNumber))
    docRef.get().then(doc => {
      // not sure what I should be returning
      return doc.exists
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
    })
}

function getSuggestedVendors(userInput) {
  // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var beginningInput = userInput.slice(0,userInput.length-1)
    var endInput = userInput.slice(userInput.length-1,userInput.length)
    var upperBound = beginningInput + String.fromCharCode(endInput.charCodeAt(0)+1)
    var query = firebaseutils.modelsRef.where("vendor",">=",userInput).where("vendor","<",upperBound)

    var vendorArray = new Array()
    query.get().then(querySnapshot => {
      querySnapshot.forEach( doc => {
        if (!vendorArray.includes(doc.vendor)) {
          vendorArray.push(doc.vendor)
        }
      })
      return vendorArray
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
    })
}

export { createModel, modifyModel, deleteModel, doesModelDocExist, getSuggestedVendors }
