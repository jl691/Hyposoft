import * as changeplanconflictutils from '../utils/changeplanconflictutils.js'
import * as changeplanutils from '../utils/changeplanutils'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'

var ids = {}
jest.setTimeout(60000);

describe('change plan add asset tests: basic test', () => {
    beforeAll(done => {
        conflictSetup(() => {
            firebaseutils.testDB.goOnline()
            done()
        })
    })

    test('changeplan add asset conflicts: rack', done => {
        //trying to simulate someone clicking on the detail view of the change plan step and retriggering the check
        changeplanconflictutils.rackNonExistent(ids['changePlan'], ids['changePlanStep'], 'A1', 'Test Datacenter', rackStatus => {
            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                expect(docRef.data().rack[0]).toBe('rackErrID')
                done()
            })

        })

    })
    test('changeplan add asset conflicts: datacenter', done => {
        changeplanconflictutils.datacenterNonExistent(ids['changePlan'], ids['changePlanStep'], 'Test Datacenter', datacenterStatus => {
            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                expect(docRef.data().datacenter[0]).toBe('datacenterErrID')
                done()
            })

        })

    })
    test('changeplan add asset conflicts: hostname', done => {
        changeplanconflictutils.hostnameConflict(ids['changePlan'], ids['changePlanStep'], 'asset1', hostnameStatus => {
            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                expect(docRef.data().hostname[0]).toBe('hostnameErrID')
                done()
            })

        })

    })
    test('changeplan add asset conflicts: owner', done => {
        changeplanconflictutils.ownerConflict(ids['changePlan'], ids['changePlanStep'], 'testUser', ownerStatus => {
            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                //expect(ownerStatus).toBe(true)
                expect(docRef.data().owner[0]).toBe('ownerErrID')
                done()
            })

        })

    })
    test('changeplan add asset conflicts: assetID', done => {
        changeplanconflictutils.assetIDConflict(ids['changePlan'], ids['changePlanStep'], '999999', assetIDStatus => {
            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                expect(docRef.data().assetID[0]).toBe('assetIDErrID')
                done()
            })

        })

    })

    test('changeplan add asset conflicts: model', done => {
        changeplanconflictutils.modelConflict(ids['changePlan'], ids['changePlanStep'], 'Test Model1', modelStatus => {
            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                expect(docRef.data().model[0]).toBe('modelErrID')
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
    const owner = makeUser()
    firebaseutils.usersRef.add(owner).then(docRef => {
        ids = { ...ids, user: docRef.id }
        const dc = makeDatacenter()
        firebaseutils.datacentersRef.add(dc).then(docRef => {
            ids = { ...ids, datacenter: docRef.id }
            const rack = makeRack()
            firebaseutils.racksRef.add(rack).then(docRef => {
                ids = { ...ids, rack: docRef.id }
                const testModel = makeModel('Test', 'Model1', 5)
                firebaseutils.modelsRef.add(testModel).then(docRef => {
                    ids = { ...ids, model: docRef.id }
                    const changePlan = makeChangePlan()
                    firebaseutils.changeplansRef.add(changePlan).then(docRef => {
                        ids = { ...ids, changePlan: docRef.id }
                        const changePlanAddStep = makeChangePlanStep()
                        firebaseutils.changeplansRef.doc(ids['changePlan']).collection('changes').add(changePlanAddStep).then(docRef => {
                            { ids = { ...ids, changePlanStep: docRef.id } }
                            const asset = makeAsset('999999')
                            firebaseutils.assetRef.doc('999999').set(asset).then(() => {
                                ids = { ...ids, asset: '999999' }

                                //changing the 'live' database so there are conflicts now with the change plan step
                                firebaseutils.modelsRef.doc(ids['model']).delete().then(docRef => {
                                    firebaseutils.datacentersRef.doc(ids['datacenter']).delete().then(docRef => {
                                        firebaseutils.racksRef.doc(ids['rack']).delete().then(docRef => {
                                            firebaseutils.usersRef.doc(ids['user']).delete().then(docRef => {
                                                callback()
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
    })
}

function tearDown(callback) {

    firebaseutils.assetRef.doc(ids['asset']).delete().then(docRef => {
        firebaseutils.usersRef.doc(ids['user']).delete().then(docRef => {
            changeplanutils.deleteChangePlan(ids['changePlan'], status => {
                callback()
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
        networkPorts: null,
        networkPortsCount: 0,
        powerPorts: null,
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
        name: 'Test Datacenter',
        abbreviation: 'TD1',
        racks: []
    }
    return dc
}
function makeRack() {
    const rack = {
        letter: 'A',
        number: 1,
        height: 42,
        assets: ['999999'],
        powerPorts: [],
        datacenter: ids['datacenter']
    }
    return rack
}

function makeChangePlan() {
    const changePlan = {
        executed: false,
        name: 'Test Change Plan Conflicts',
        owner: 'admin',
        timestamp: 1584641154278
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
                new: "Test Datacenter",
                old: ""
            },
            datacenterAbbrev: {
                new: 'TD1',
                old: ''
            },
            datacenterID: {
                new: ids['datacenter'],
                old: ''
            },
            hostname: {
                new: 'testHostname',
                old: ''
            },
            macAddresses: {
                new: {},
                old: {}
            },
            model: {
                new: 'Test Model1',
                old: ''
            },
            modelID: {
                new: ids['model'],
                old: ''
            },
            modelNumber: {
                new: 'Model1',
                old: ''
            },
            networkConnections: {
                new: {},
                old: {}
            },
            //change this to test owner conflicts
            owner: {
                new: 'testUser',
                old: ''
            },
            powerConnections: {
                new: [],
                old: []
            },
            rack: {
                new: 'A1',
                old: ''
            },
            rackID: {
                new: ids['rack'],
                old: ''
            },
            rackNum: {
                new: 1,
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

function makeAsset(id) {
    const asset = {
        assetId: id,
        modelId: ids['model'],
        model: 'Dell man5',
        hostname: 'asset1',
        rack: 'A1',
        rackU: 1,
        owner: '',
        comment: '',
        rackID: ids['rack'],
        macAddresses: {},
        networkConnections: {},
        powerConnections: [],

        //This is for rack usage reports
        modelNumber: 'man5',
        vendor: 'Dell',
        //This is for sorting
        rackRow: 'A',
        rackNum: 1,
        datacenter: 'Test Datacenter',
        datacenterID: ids['datacenter'],
        datacenterAbbrev: 'TD1'
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

//add this to the set up

function makeUser() {
    const user = {
        displayName: 'testUser',
        username: 'testUser',
        email: 'anshu.dwibhashi@duke.edu',
        docId: 'anshu.dwibhashi@duke.edu',
        password: '',
        role: 'ADMIN_ROLE'
    }
    return user


}
