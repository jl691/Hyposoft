import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { sha256 } from 'js-sha256'

var firebaseConfig = {
    apiKey: "AIzaSyAxa-EP7hIwf1msxa4kGcyneWoOt7f3wR8",
    authDomain: "hyposoft-53c70.firebaseapp.com",
    databaseURL: "https://hyposoft-53c70.firebaseio.com",
    projectId: "hyposoft-53c70",
    storageBucket: "hyposoft-53c70.appspot.com",
    messagingSenderId: "290973758418",
    appId: "1:290973758418:web:0281f7a921152d805fce0b",
    measurementId: "G-713VLDN9N0"
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

export { hashAndSalt, hashAndSalt2, usersRef, racksRef, assetRef, modelsRef, claimsRef, recoveriesRef, datacentersRef, logsRef, db, firebase }
