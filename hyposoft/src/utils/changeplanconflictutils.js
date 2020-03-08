import { assetRef, racksRef, modelsRef, usersRef, firebase, datacentersRef } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as userutils from './userutils'
import * as assetIDutils from './assetidutils'
import * as datacenterutils from './datacenterutils'
import * as assetnetworkportutils from './assetnetworkportutils'
import * as assetpowerportutils from './assetpowerportutils'

//check add asset change plan edits

//check edit asset change plan edits

//check decomm asset change plan edits


//proof of concept

/**
 * 
 * @param {*} rackName 
 * @param {*} datacenter 
 */
const rackNonExistent = async (rackName, datacenter) => {//make this async/await if you want to return something
    let splitRackArray = rackName.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])
    let errorID = null;

    rackutils.getRackID(rackRow, rackNum, datacenter, rackID => {

        if (!rackID) {
            console.log("Unable to find the rackID in this add asset change plan")
            errorID = "rackErrID"

        }

    })

    return errorID;
    



}


export {
    rackNonExistent,


}