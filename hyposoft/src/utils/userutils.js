import * as firebaseutils from './firebaseutils'
import * as logutils from './logutils'

const ADMIN_PERMISSION = 'ADMIN_PERMISSION'

function isUserLoggedIn() {
    var loginCheck = localStorage.getItem('userLoginCheck')
    var displayName = localStorage.getItem('displayName')
    var username = localStorage.getItem('username')
    var email = localStorage.getItem('email')
    var permissions = localStorage.getItem('permissions')

    return firebaseutils.hashAndSalt(displayName+username+email+permissions) === loginCheck
}

function validEmail(email) {
    var re = /^([a-zA-Z0-9.+_-]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function isLoggedInUserAdmin() {
    return isUserLoggedIn() && ((JSON.parse(localStorage.getItem('permissions')).includes(ADMIN_PERMISSION)))
}

function doesLoggedInUserHaveModelPerm() {
    return isUserLoggedIn() && ((JSON.parse(localStorage.getItem('permissions')).includes('MODEL_PERMISSION')))
}

function doesLoggedInUserHaveAssetPerm(dcAbbrev) {
    // If dcAbbrev is null, check for global permissions
    if (!dcAbbrev) {
        return isUserLoggedIn() && ((JSON.parse(localStorage.getItem('permissions')).includes('ASSET_PERMISSION_GLOBAL')))
    }
    return isUserLoggedIn() && ((JSON.parse(localStorage.getItem('permissions')).includes('ASSET_PERMISSION_GLOBAL')) || (JSON.parse(localStorage.getItem('permissions')).includes('ASSET_PERMISSION_'+dcAbbrev)))
}

function doesLoggedInUserHaveAuditPerm() {
    return isUserLoggedIn() && ((JSON.parse(localStorage.getItem('permissions')).includes('AUDIT_PERMISSION')))
}

function doesLoggedInUserHavePowerPerm() {
    return isUserLoggedIn() && ((JSON.parse(localStorage.getItem('permissions')).includes('POWER_PERMISSION')))
}

function isLoggedInUserNetID() {
    return (localStorage.getItem('isNetIDAccount') === 'yes')
}

function packageUser(displayName, username, email, password) {
    const user = {
        displayName: displayName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: (password !== null ? firebaseutils.hashAndSalt2(password) : ''),
        permissions: []
    }

    return user
}

/**
* This function assumes validation (such as taken usernames etc.) has been done
* It also assumes that we've already validated that the logged in user is the admin
*/
function createUser(displayName, username, email, password, callback) {
    firebaseutils.usersRef.doc(email).set(packageUser(displayName, username, email, password))
    logutils.addLog(email,logutils.USER(),logutils.CREATE())
    callback({...packageUser(displayName, username, email, password), docId: email})
}

/**
* This function assumes validation (such as taken usernames etc.) has been done
* It also assumes that we've already validated that the logged in user is the user
*/
function modifyUser(displayName, username, email) {
    logutils.getObjectData(email,logutils.USER(),data => {
      firebaseutils.usersRef.doc(email).update(packageUser(displayName, username, email))
      logutils.addLog(email,logutils.USER(),logutils.MODIFY(),data)
    })
}

function updateUsername(oldUsername, newUsername, callback) {
    firebaseutils.usersRef.where('username', '==', oldUsername).get().then(qs => {
        if (!qs.empty) {
            logutils.getObjectData(qs.docs[0].id,logutils.USER(),data => {
              qs.docs[0].ref.update({
                  username: newUsername
              }).then(() => {
                logutils.addLog(qs.docs[0].id,logutils.USER(),logutils.MODIFY(),data)
                callback()
              })
            })
        }
    })
}

function updateUserPermissions(username, newPermissions, callback) {
    firebaseutils.usersRef.where('username', '==', username).get().then(qs => {
        if (!qs.empty) {
            logutils.getObjectData(qs.docs[0].id,logutils.USER(),data => {
              qs.docs[0].ref.update({
                  permissions: newPermissions
              }).then(() => {
                logutils.addLog(qs.docs[0].id,logutils.USER(),logutils.MODIFY(),data)
                callback()
              })
            })
        }
    })
}

function deleteUser(username, callback) {
    firebaseutils.usersRef.where('username', '==', username).get().then(qs => {
        if (!qs.empty) {
            const docId = qs.docs[0].id
            const docData = qs.docs[0].data()
            if (docData.password === '') {
                callback(false)
            } else {
                qs.docs[0].ref.delete().then(() => {
                    logutils.addLog(docId,logutils.USER(),logutils.DELETE(),docData);

                    firebaseutils.assetRef.where("owner", "==", docData.username).get().then(function (querySnapshot) {
                        let count = 0;
                        querySnapshot.forEach(asset => {
                            asset.ref.update({
                                owner: ""
                            }).then(function () {
                                count++;
                                if(count === querySnapshot.size){
                                    callback(true)
                                }
                            })
                        })
                    });
                })
            }
        }
    })
}

function isLoginValid(username, password, callback) {
    firebaseutils.usersRef.where('username', '==', username).get()
    .then(querySnapshot => {
        if (!querySnapshot.empty) {
            console.log(password.trim())
            console.log(firebaseutils.hashAndSalt2(password.trim(), querySnapshot.docs[0].data().password.split('|')[1]))
            if (querySnapshot.docs[0].data().password === firebaseutils.hashAndSalt2(password.trim(), querySnapshot.docs[0].data().password.split('|')[1])) {
                callback({...querySnapshot.docs[0].data(), docId: querySnapshot.docs[0].id})
            } else {
                callback(null)
            }
        } else {
            callback(null)
        }
    })
}

function logUserIn(userObject) {
    localStorage.setItem('userLoginCheck', firebaseutils.hashAndSalt(
        userObject.displayName+userObject.username+userObject.email+JSON.stringify(userObject.permissions)))
    localStorage.setItem('displayName', userObject.displayName)
    localStorage.setItem('username', userObject.username)
    localStorage.setItem('email', userObject.email)
    localStorage.setItem('userDocId', userObject.docId)
    localStorage.setItem('isNetIDAccount', userObject.password.trim() === '' ? 'yes' : 'no')
    localStorage.setItem('permissions', JSON.stringify(userObject.permissions))
}

function getLoggedInUser() {
    return localStorage.getItem('userDocId')
}

function getLoggedInUserUsername() {
    return localStorage.getItem('username')
}

function logout() {
    localStorage.clear()
}

function getUser(email, callback) {
    firebaseutils.usersRef.doc(email).get().then(doc => callback(doc.exists ? {...doc.data(), docId: doc.id} : null))
}

function usernameTaken(username, callback) {
    firebaseutils.usersRef.where('username', '==', username).get().then(qs => {
        callback(qs.size > 0)
    })
}

function changePassword(newPass) {
    firebaseutils.usersRef.doc(localStorage.getItem('email')).update({password: firebaseutils.hashAndSalt2(newPass)})
}

function changePasswordByEmail(email, newPass, callback) {
    firebaseutils.usersRef.where('email', '==', email).get().then(qs => {
        if (!qs.empty) {
            qs.docs[0].ref.update({password: firebaseutils.hashAndSalt2(newPass)}).then(() => callback())
        }
    })
}

function loadUsers(startAfter, callback) {
    firebaseutils.usersRef.orderBy('username').limit(25).startAfter(startAfter).get().then(docSnaps => {
        var newStartAfter = null
        if (docSnaps.docs.length === 25) {
            newStartAfter = docSnaps.docs[docSnaps.docs.length-1]
        }

        const users = docSnaps.docs.map(doc => (
            {dummy: true, username: doc.data().username, name: doc.data().displayName,
                 permissions: doc.data().permissions}
        ))
        callback(users, newStartAfter)
    })
}

/**
* Adds a claim document to the claimsRef with the fields above + secret
* Assumes all validation (existing username, email etc.) have been done
*/
function addClaim(username, displayName, email, callback) {
    if (!isLoggedInUserAdmin()) {
        callback(false); // They're doing something fishy
    } else {
        const secret = firebaseutils.hashAndSalt(username+email+new Date().getTime().toString())
        firebaseutils.claimsRef.doc(email).set({
            username: username,
            displayName: displayName,
            email: email,
            secret: secret
        }).then(() => callback(secret))
    }
}

/**
* Also simultaneously functions as validateClaim()
*/
function fetchClaim(secret, callback) {
    firebaseutils.claimsRef.where('secret', '==', secret).get().then(qs => {
        if (qs.size > 0) {
            callback(qs.docs[0].data())
        } else {
            callback(null)
        }
    })
}

function removeClaim(secret) {
    firebaseutils.claimsRef.where('secret', '==', secret).get().then(qs => {
        if (qs.size > 0) {
            qs.docs[0].ref.delete()
        }
    })
}

function sendRecoveryEmail(username, callback) {
    firebaseutils.usersRef.where('username', '==', username).get().then(qs => {
        if (!qs.empty) {
            var email = qs.docs[0].data().email
            var secret = firebaseutils.hashAndSalt(qs.docs[0].data().password + new Date().getTime().toString())
            firebaseutils.recoveriesRef.doc(email).set({
                secret: secret,
                email: email
            })
            fetch('https://hyposoft-53c70.appspot.com/forgotPassword?secret='+secret+'&email='+email)
        }

        callback()
    })
}

function fetchRecovery(secret, callback) {
    firebaseutils.recoveriesRef.where('secret', '==', secret).get().then(qs => {
        if (qs.size > 0) {
            callback(qs.docs[0].data())
        } else {
            callback(null)
        }
    })
}

function removeRecovery(secret) {
    firebaseutils.recoveriesRef.where('secret', '==', secret).get().then(qs => {
        if (qs.size > 0) {
            qs.docs[0].ref.delete()
        }
    })
}

function getAllUsers (callback) {
    var listOfUsers = []
    firebaseutils.usersRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            listOfUsers = [...listOfUsers, qs.docs[i].data().username.trim()]
        }
        callback(listOfUsers)
    })
}

function getAllDataCenterAbbrevs(callback) {
    // yes this is not suited for this file, but i don't wanna touch other people's code
    var results = []

    firebaseutils.datacentersRef.get().then(querySnapshot => {
        for (var i = 0; i < querySnapshot.size; i++) {
            results.push(querySnapshot.docs[i].data().abbreviation)
        }
        callback(results)
    })
}

export { isUserLoggedIn, createUser, modifyUser, deleteUser, isLoggedInUserAdmin,
isLoginValid, logUserIn, logout, getUser, changePassword, loadUsers, addClaim,
fetchClaim, usernameTaken, validEmail, removeClaim, updateUsername, sendRecoveryEmail,
fetchRecovery, removeRecovery, changePasswordByEmail, getAllUsers, getLoggedInUser,
 ADMIN_PERMISSION, isLoggedInUserNetID, getLoggedInUserUsername, getAllDataCenterAbbrevs,
updateUserPermissions, doesLoggedInUserHaveModelPerm, doesLoggedInUserHaveAssetPerm,
doesLoggedInUserHaveAuditPerm, doesLoggedInUserHavePowerPerm }
