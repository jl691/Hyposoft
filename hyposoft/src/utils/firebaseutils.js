import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { sha256 } from 'js-sha256'

const firebaseConfig = {
    apiKey: "AIzaSyBE772y7XqZWwG5Q6Un0lu3zJsM12l-EDg",
    authDomain: "hyposoft-dev.firebaseapp.com",
    databaseURL: "https://hyposoft-dev.firebaseio.com",
    projectId: "hyposoft-dev",
    storageBucket: "hyposoft-dev.appspot.com",
    messagingSenderId: "324524941581",
    appId: "1:324524941581:web:ea302b22697fc9cc9ad044",
    measurementId: "G-ZCSSY548ED"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

var salt = 'Do8239urjfhawfA'

function hashAndSalt(data) {
    return sha256(data + salt)
}

function makeSalt(length) {
    // Randomly generates a salt of requested length
    var result           = ''
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

function hashAndSalt2(data, randSalt=null) {
    if (!randSalt) {
        randSalt = makeSalt(15)
    }
    return sha256(data + randSalt)+'|'+randSalt
}

const db = firebase.firestore()

var usersRef = db.collection('users')
var claimsRef = db.collection('claims')
var recoveriesRef = db.collection('recoveries')
var assetRef = db.collection('assets')
var racksRef = db.collection('racks')
var modelsRef = db.collection('models')
var datacentersRef = db.collection('datacenters')
var logsRef = db.collection('logs')
var changeplansRef = db.collection('changeplans')
var decommissionRef = db.collection('decommission')

export { hashAndSalt, hashAndSalt2, usersRef, racksRef, assetRef, modelsRef, claimsRef, recoveriesRef, datacentersRef, logsRef, db, firebase, changeplansRef, decommissionRef }
