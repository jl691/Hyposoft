import * as assetutils from '../utils/assetutils'
import * as firebaseutils from '../utils/firebaseutils'
//TODO: need to finish this
var assetIds = []

describe('addAssetTests', () => {
    beforeAll(done => {
        addInitialAssets(() => done())
    })


    // test('getSuggestedVendors empty string', done => {
    //     modelutils.getSuggestedVendors('', array => {
    //         expect(array).toEqual(['Apple', 'Dell', 'Google'])
    //         done()
    //     })
    // })


    afterAll(done => {
        tearDownAssets(() => done())
    })
})

function addInitialAssets(callback) {
    const dell = makeModel('Dell', 'man5', 5)
    const apple = makeModel('Apple', 'iServer', 5)
    const google = makeModel('Google', 'fusion4', 5)

    //have an asset that works with all the fields
    //have an asset that doesn't work: network connections
    //have an asset that doesnt work: power connections
    //have an asset that doesn't work: conflict on rack
    //have an asset that doesn't work: basic field check
    const asset1=addAsset(

    )

    //addAsset
    firebaseutils.modelsRef.add(dell).then(docRef => {
        modelIds.push(docRef.id)
        firebaseutils.modelsRef.add(apple).then(docRef => {
            modelIds.push(docRef.id)
            firebaseutils.modelsRef.add(google).then(docRef => {
                modelIds.push(docRef.id)
                callback()
            })
        })
    })
}

function tearDownAssets(callback) {
    firebaseutils.modelsRef.doc(modelIds[0]).delete().then(docRef => {
        firebaseutils.modelsRef.doc(modelIds[1]).delete().then(docRef => {
            firebaseutils.modelsRef.doc(modelIds[2]).delete().then(docRef => {
                callback()
            })
        })
    })
}


function addAsset(newID, model, hostname, rack, racku, owner, comment, rackID, macAddresses, networkConnections,
    powerConnections, datacenter) {
    const asset = {
        //Just the fields that are actually validated
        assetId: newID,
        model: model,
        hostname: hostname,
        rack: rack,
        rackU: racku,
        owner: owner,
        comment: comment,
        rackID: rackID,
        macAddresses,
        networkConnections,
        powerConnections,
        datacenter: datacenter,
    }
    return asset;

}

