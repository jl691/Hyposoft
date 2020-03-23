import * as changeplanconflictutils from '../utils/changeplanconflictutils.js'
import * as changeplanutils from '../utils/changeplanutils'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'

var ids = {}
jest.setTimeout(60000);

export const changeplanconflictsRackUTest = () => describe('change plan add asset: rackU test', () => {
    beforeAll(done => {
        conflictSetup(() => {
            done()
        })
    })

    test('changeplan add asset conflicts: rackU pass', done => {
        changeplanconflictutils.rackUConflict(ids['changePlan'], ids['changePlanStep'], 'Test Model2', 'Test Datacenter2', 'A2', 15, rackUStatus => {
            expect(rackUStatus).toBe(false)
            done()
        })

    })

    //sometimes the test will not work if there is bad data in the test db: rackID someties will not be found. clear datacenters
    test('changeplan add asset conflicts: rackU conflict', done => {
        console.log([...Object.entries(ids)])
        changeplanconflictutils.rackUConflict(ids['changePlan'], ids['changePlanStep'], 'Test Model2', 'Test Datacenter2', 'A2', 1, rackUStatus => {

            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {

                expect(docRef.data().rackU[0]).toBe('rackUConflictErrID')
                done()
            })
        })
    })

    afterAll(done => {
        tearDown(() => {
            console.log("Deleting all created database documents")
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
            const testModel2 = makeModel('Test', 'Model2', 5)
            firebaseutils.modelsRef.add(testModel2).then(docRef => {
                ids = { ...ids, model: docRef.id }
                const changePlan = makeChangePlan()
                firebaseutils.changeplansRef.add(changePlan).then(docRef => {
                    ids = { ...ids, changePlan: docRef.id }
                    const changePlanAddStep = makeChangePlanStep()
                    firebaseutils.changeplansRef.doc(ids['changePlan']).collection('changes').add(changePlanAddStep).then(docRef => {
                        { ids = { ...ids, changePlanStep: docRef.id } }
                        const asset = makeAsset('111111')
                        firebaseutils.assetRef.doc('111111').set(asset).then(() => {
                            ids = { ...ids, asset: '111111' }
                            callback()

                        })
                    })
                })
            })
        })
    })
}

function tearDown(callback) {

    firebaseutils.assetRef.doc(ids['asset']).delete().then(docRef => {
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
        name: 'Test Datacenter2',
        abbreviation: 'TD2',
        racks: []
    }
    return dc
}
function makeRack() {
    const rack = {
        letter: 'A',
        number: 2,
        height: 42,
        assets: ['111111'],
        powerPorts: [],
        datacenter: ids['datacenter']
    }
    return rack
}

function makeChangePlan() {
    const changePlan = {
        executed: false,
        name: 'Test Change Plan Conflicts 2',
        owner: 'admin',
        timestamp: 1584641154269
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
                new: "Test Datacenter2",
                old: ""
            },
            datacenterAbbrev: {
                new: 'TD2',
                old: ''
            },
            datacenterID: {
                new: ids['datacenter'],
                old: ''
            },
            hostname: {
                new: 'testHostname2',
                old: ''
            },
            macAddresses: {
                new: {},
                old: {}
            },
            model: {
                new: 'Test Model2',
                old: ''
            },
            modelID: {
                new: ids['model'],
                old: ''
            },
            modelNumber: {
                new: 'Model2',
                old: ''
            },
            networkConnections: {
                new: {},
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
                new: 'A2',
                old: ''
            },
            rackID: {
                new: ids['rack'],
                old: ''
            },
            rackNum: {
                new: 2,
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
        modelID: ids['model'],
        model: 'Test Model2',
        hostname: 'asset2',
        rack: 'A2',
        rackU: 1,
        owner: '',
        comment: '',
        rackID: ids['rack'],
        macAddresses: {},
        networkConnections: {},
        powerConnections: [],

        //This is for rack usage reports
        modelNumber: 'Model2',
        vendor: 'Test',
        //This is for sorting
        rackRow: 'A',
        rackNum: 2,
        datacenter: 'Test Datacenter2',
        datacenterID: ids['datacenter'],
        datacenterAbbrev: 'TD2'
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
