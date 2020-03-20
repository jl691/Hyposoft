import * as changeplanconflictutils from '../utils/changeplanconflictutils.js'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'

var ids = {}
jest.setTimeout(100000);

describe('decomutilsTests', () => {
    beforeAll(done => {
        conflictSetup(() => {
            firebaseutils.testDB.goOnline()
            done()
        })
    })

    test('change plan add asset conflicts: basic', done => {
        //trying to simulate someone clicking on the detail view of the change plan step and retriggering the check
        changeplanconflictutils.addAssetChangePlanPackage(ids['changePlan'], ids['changePlanStep'], 'Test Model1', 'asset1', 'Test Datacenter', 'A1', 1, 'testUser', '999999', [], {});

        firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
            //surely there is a more elegant way to check
            // const correctDoc = {
            //     rack: "rackErrID",
            //     datacenter: "datacenterErrID",
            //     hostname: "hostnameErrID",
            //     assetID: "assetIDErrID",
            //     model: "modelErrID"
            // }
            if (docRef.exists && docRef.id == ids['changePlanStep']
                && docRef.data().rack[0] === "rackErrID" && docRef.data().rack[0] === "datacenterErrID"
                && docRef.data().hostname[0] === "hostnameErrID" && docRef.data().assetID[0] === "assetIDErrID"
                && DOMRectReadOnly.data().model[0] === "modelErrID") {

                expect(true).toBe(true)
                done()
            }
        })

    })

    afterAll(done => {
        tearDown(() => {
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
    firebaseutils.changeplansRef.doc(ids['changePlan']).delete().then(docRef => {
        firebaseutils.assetRef.doc(ids['asset']).delete().then(docRef => {
            firebaseutils.usersRef.doc(ids['user']).delete().then(docRef => {
                // firebaseutils.changeplansRef.doc(ids['changePlan']).collection('changes').delete().then(docRef => {
                // firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').delete().then(docRef => {

                callback()

                // })
                // })
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

