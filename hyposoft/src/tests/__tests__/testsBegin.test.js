import {modelutilsTest} from '../modelutilsTest.js'
import {decomutilsTest} from '../decomutilsTest.js'
import {changeplanconflictPowerConnsTest} from '../changeplanconflictPowerConnsTest.js'
import {changeplanconflictNetworkConnsTest} from '../changeplanconflictNetworkConnsTest.js'
import {changeplanconflictsRackUTest} from '../changeplanconflictsRackUTest.js'
import {changeplanconflictutilsTest} from '../changeplanconflictutilsTest.js'

describe('Begin All Tests', () => {
    modelutilsTest()
    decomutilsTest()
    changeplanconflictPowerConnsTest()
    changeplanconflictNetworkConnsTest()
    changeplanconflictsRackUTest()
    changeplanconflictutilsTest()
})
