import * as changeplanconflictutils from '../utils/changeplanconflictutils.js'
import * as changeplanutils from '../utils/changeplanutils'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'

var ids = {}
//NOTE: things (specifically assets--there are 3 of them) are very hardcoded in this unit test

describe('change plan add asset: network connections test', () => {
    beforeAll(done => {
        conflictSetup(() => {
            firebaseutils.testDB.goOnline()
            done()
        })
    })

    test('changeplan add asset conflicts: network connections pass', done => {
        const networkConnections = [
            {
                thisPort: '3',
                 otherAssetID: ids['assetB'],
                otherPort: '2'
            }
        ]
        changeplanconflictutils.networkConnectionConflict(ids['changePlan'], ids['changePlanStep'], networkConnections, null, networkConnectionsStatus => {
                expect(networkConnectionsStatus).toBe(false)
                done()
        })
    })

    test('changeplan add asset conflicts: network connection conflict', done => {
        //the function used expects network connections to be an array
        //only converted to map object before adding to db
        const networkConnections = [
            {
                thisPort: '2',
                otherAssetID: ids['assetB'],
                otherPort: '1'
            },
            {
                thisPort: '3',

                otherAssetID: ids['assetB'],
                otherPort: '2'
            }
        ]
        changeplanconflictutils.networkConnectionConflict(ids['changePlan'], ids['changePlanStep'], networkConnections, null, networkConnectionsStatus => {

            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                expect(docRef.data().database.networkConnections[0]).toBe('networkConnectionConflictErrID')
                // expect([...docRef.data().networkConnections].includes('networkConnectionOtherAssetIDErrID')).toBe(true)
                done()
            })
        })
    })


    test('changeplan add asset conflicts: network connections nonexistent other asset', done => {
        const networkConnections = [
            {
                thisPort: '1',
                otherAssetID: ids['assetA'],
                otherPort: '1'
            },
        ]
        changeplanconflictutils.networkConnectionConflict(ids['changePlan'], ids['changePlanStep'], networkConnections, null, networkConnectionsStatus => {

            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                expect(docRef.data().database.networkConnections[0]).toBe('networkConnectionOtherAssetIDErrID')
                expect(docRef.data().database.networkConnections[1]).toBe('networkConnectionNonExistentOtherPortErrID')
                done()
            })
        })

    })



    afterAll(done => {
        tearDown(() => {
            console.log("Deleting all created database documents")
            firebaseutils.testDB.goOffline()
            done()
        })
    })
})

//helper functions

function conflictSetup(callback) {
    userutils.logUserIn(makeLoggedInUser('admin'))
    const dc = makeDatacenter()
    firebaseutils.datacentersRef.add(dc).then(docRef => {
        ids = { ...ids, datacenter: docRef.id }
        const rack = makeRack()
        firebaseutils.racksRef.add(rack).then(docRef => {
            ids = { ...ids, rack: docRef.id }
            const testModel4 = makeModel('Test', 'Model4', 5)
            firebaseutils.modelsRef.add(testModel4).then(docRef => {
                ids = { ...ids, model: docRef.id }

                const assetA = makeAssetType1('333333')
                firebaseutils.assetRef.doc('333333').set(assetA).then(() => {
                    ids = { ...ids, assetA: '333333' }
                    const assetB = makeAssetType1('444444')
                    firebaseutils.assetRef.doc('444444').set(assetB).then(() => {
                        ids = { ...ids, assetB: '444444' }
                        const changePlan = makeChangePlan()
                        firebaseutils.changeplansRef.add(changePlan).then(docRef => {
                            ids = { ...ids, changePlan: docRef.id }
                            const changePlanAddStep = makeChangePlanStep()
                            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('changes').add(changePlanAddStep).then(docRef => {
                                { ids = { ...ids, changePlanStep: docRef.id } }
                                firebaseutils.assetRef.doc(ids['assetA']).delete().then(docRef => {
                                    const assetC = makeAssetType2('555555')
                                    firebaseutils.assetRef.doc('555555').set(assetC).then(() => {
                                        ids = { ...ids, assetC: '555555' }
                                        simulateSymmConnection(ids['assetB'], status => {
                                            if (status) {
                                                callback()
                                            }
                                            else {
                                                console.log("Failed to make symmetric network connection")
                                                callback()
                                            }

                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })
}

//TODO: delete all the assets you made
function tearDown(callback) {

    firebaseutils.assetRef.doc(ids['assetA']).delete().then(docRef => {
        firebaseutils.assetRef.doc(ids['assetB']).delete().then(docRef => {
        firebaseutils.assetRef.doc(ids['assetC']).delete().then(docRef => {
        changeplanutils.deleteChangePlan(ids['changePlan'], status => {
            firebaseutils.modelsRef.doc(ids['model']).delete().then(docRef => {
                firebaseutils.datacentersRef.doc(ids['datacenter']).delete().then(docRef => {
                    firebaseutils.racksRef.doc(ids['rack']).delete().then(docRef => {

                        callback()

                    })
                })
            })
        })
      })
      })
    })
}

function makeModel(vendor, modelNum, height) {
    const model = {
        vendor: vendor,
        modelNumber: modelNum,
        height: height,
        displayColor: 'BD10E0',
        networkPorts: ["1", "2", "3", "4"],
        networkPortsCount: 4,
        powerPorts: 2,
        cpu: null,
        memory: null,
        storage: null,
        comment: null,
        modelName: vendor + ' ' + modelNum
    }
    return model
}

function makeDatacenter() {
    const dc = {
        name: 'Test Datacenter4',
        abbreviation: 'TD4',
        racks: []
    }
    return dc
}
function makeRack() {
    const rack = {
        letter: 'A',
        number: 4,
        height: 42,
        assets: ['333333', '444444'],
        powerPorts: [],
        datacenter: ids['datacenter']
    }
    return rack
}

function makeChangePlan() {
    const changePlan = {
        executed: false,
        name: 'Test Change Plan Conflicts 4',
        owner: 'admin',
        timestamp: 1584641154271
    }
    return changePlan
}
function makeChangePlanStep() {
    const addAssetStep = {
        assetID: "",
        change: "add",
        changes: {
            comment: {
                new: "",
                old: ""
            },
            datacenter: {
                new: "Test Datacenter4",
                old: ""
            },
            datacenterAbbrev: {
                new: 'TD4',
                old: ''
            },
            datacenterID: {
                new: ids['datacenter'],
                old: ''
            },
            hostname: {
                new: 'testHostname4',
                old: ''
            },
            macAddresses: {
                new: {},
                old: {}
            },
            model: {
                new: 'Test Model4',
                old: ''
            },
            modelID: {
                new: ids['model'],
                old: ''
            },
            modelNumber: {
                new: 'Model4',
                old: ''
            },
            networkConnections: {
                new: {
                    '1': {
                        otherAssetID: ids['assetA'],
                        otherPort: '1'
                    },
                    '2': {
                        otherAssetID: ids['assetB'],
                        otherPort: '1'
                    },
                    '3': {
                        otherAssetID: ids['assetB'],
                        otherPort: '2'
                    }
                },
                old: {}
            },
            owner: {
                new: '',
                old: ''
            },
            powerConnections: {
                new: [],
                old: []
            },
            rack: {
                new: 'A4',
                old: ''
            },
            rackID: {
                new: ids['rack'],
                old: ''
            },
            rackNum: {
                new: 4,
                old: ""
            },
            rackRow: {
                new: "A",
                old: ""
            },
            rackU: {
                new: 1,
                old: ""
            },
            vendor: {
                new: "Test",
                old: ""
            }
        },
        step: 1
    }
    return addAssetStep

}

//assets A and B are of this type
function makeAssetType1(id) {
    const asset = {
        assetId: id,
        modelID: ids['model'],
        model: 'Test Model4',
        hostname: 'asset4',
        rack: 'A4',
        rackU: 1,
        owner: '',
        comment: '',
        rackID: ids['rack'],
        macAddresses: {},
        networkConnections: {},
        powerConnections: [],

        //This is for rack usage reports
        modelNumber: 'Model4',
        vendor: 'Test',
        //This is for sorting
        rackRow: 'A',
        rackNum: 4,
        datacenter: 'Test Datacenter4',
        datacenterID: ids['datacenter'],
        datacenterAbbrev: 'TD4'
    }
    return asset
}

//Asset C is of this type: has connections when being made
function makeAssetType2(id) {
    const asset = {
        assetId: id,
        modelID: ids['model'],
        model: 'Test Model4',
        hostname: 'asset4',
        rack: 'A4',
        rackU: 1,
        owner: '',
        comment: '',
        rackID: ids['rack'],
        macAddresses: {},
        networkConnections: {
            '1': {
                otherAssetID: ids['assetB'],
                otherPort: "1"
            }
        },
        powerConnections: [],

        //This is for rack usage reports
        modelNumber: 'Model4',
        vendor: 'Test',
        //This is for sorting
        rackRow: 'A',
        rackNum: 4,
        datacenter: 'Test Datacenter4',
        datacenterID: ids['datacenter'],
        datacenterAbbrev: 'TD4'
    }
    return asset
}
function makeLoggedInUser(password) {
    const user = {
        displayName: 'Admin',
        username: 'admin',
        email: 'anshu.dwibhashi@duke.edu',
        docId: 'anshu.dwibhashi@duke.edu',
        password: '',
        role: 'ADMIN_ROLE'
    }
    return user
}
//assetC (makeAssetType2) trying to make a connection to
function simulateSymmConnection(assetID, callback) {
    firebaseutils.assetRef.doc(assetID).update({

        assetId: assetID,
        modelID: ids['model'],
        model: 'Test Model4',
        hostname: 'asset4',
        rack: 'A4',
        rackU: 1,
        owner: '',
        comment: '',
        rackID: ids['rack'],
        macAddresses: {},
        networkConnections: {
            '1': {
                otherAssetID: ids['assetB'],
                otherPort: "1"
            }
        },
        powerConnections: [],

        //This is for rack usage reports
        modelNumber: 'Model4',
        vendor: 'Test',
        //This is for sorting
        rackRow: 'A',
        rackNum: 4,
        datacenter: 'Test Datacenter4',
        datacenterID: ids['datacenter'],
        datacenterAbbrev: 'TD4'


    }).then(
        callback(true)
    ).catch(error => {
        console.log(error)
        callback(false)

    })
}
