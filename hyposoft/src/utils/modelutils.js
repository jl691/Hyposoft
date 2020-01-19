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

export { createModel, modifyModel, deleteModel }
