import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeMenu from '../components/HomeMenu'
import UserMenu from '../components/UserMenu'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'

import {
    Box,
    Button,
    DataTable,
    Grommet,
    Heading,
    Layer,
    Text,
    TextInput,
    Form,
    CheckBox } from 'grommet'

import { Add, FormEdit, FormTrash } from "grommet-icons"
import theme from '../theme'

class UsersScreen extends Component {
    state = {
        redirect: '',
        users: [
        ],
        newUserEmail: '',
        newUserUsername: ''
    }

    startAfter = null

    constructor() {
        super()
        this.onClose = this.onClose.bind(this)
        this.addUserDialog = this.addUserDialog.bind(this)
        this.onCloseEdit = this.onCloseEdit.bind(this)
        this.onCloseDelete = this.onCloseDelete.bind(this)
        this.deleteUser = this.deleteUser.bind(this)
        this.editUser = this.editUser.bind(this)
        this.showEditDialog = this.showEditDialog.bind(this)
        this.showDeleteDialog = this.showDeleteDialog.bind(this)
        this.init = this.init.bind(this)
    }

    init() {
        firebaseutils.usersRef.orderBy('username').limit(25).get().then(docSnaps => {
            if (docSnaps.docs.length === 25) {
                this.startAfter = docSnaps.docs[docSnaps.docs.length-1]
            }
            this.setState({users: docSnaps.docs.map(doc => (
                {dummy: true, username: doc.data().username, name: doc.data().displayName,
                    permissions: doc.data().permissions,
                    role: (doc.data.username === 'admin' ? 'Admin' : (doc.data().permissions.includes('ADMIN_PERMISSION') ? 'Admin' : 'User'))}
            ))})
        })
    }

    componentWillMount() {
        userutils.getAllDataCenterAbbrevs(results => {
            this.setState(oldState => ({
                ...oldState, datacenterAbbrevs: results
            }))
        })

        this.init()
    }

    addUser() {
        var username = this.state.newUserUsername.trim()
        while (username.startsWith('@')) {
            username = username.substring(1)
        }

        var email = this.state.newUserEmail.trim()

        if (username === '') {
            ToastsStore.info('Username required', 3000, 'burntToast')
            return
        }

        if (email === '') {
            ToastsStore.info('Email required', 3000, 'burntToast')
            return
        }

        if (!userutils.validEmail(email)) {
            ToastsStore.info('Email invalid', 3000, 'burntToast')
            return
        }

        userutils.usernameTaken(username, taken => {
            if (taken) {
                ToastsStore.info('Username taken', 3000, 'burntToast')
            } else {
                userutils.getUser(email, user => {
                    if (user) {
                        ToastsStore.info('Email taken', 3000, 'burntToast')
                    } else {
                        userutils.addClaim(username, '', email, secret => {
                            fetch('https://hyposoft-53c70.appspot.com/addUser?claimCode='+secret+'&email='+email)
                            ToastsStore.info('Invite sent', 3000, 'burntToast')
                            this.onClose()
                        })
                    }
                })
            }
        })
    }

    addUserDialog() {
        this.setState(currState => (
            {...currState, showAddDialog: true}
        ))
    }

    onClose() {
        this.setState(currState => (
            {...currState, showAddDialog: false}
        ))
    }

    showDeleteDialog(username) {
        if (userutils.isLoggedInUserAdmin()) {
            this.setState(currState => (
                {...currState, showDeleteDialog: true, deleteUsername: username}
            ))
        } else {
            ToastsStore.info('Only admins can do that', 3000, 'burntToast')
        }
    }

    onCloseDelete() {
        this.setState(currState => (
            {...currState, showDeleteDialog: false, deleteUsername: ''}
        ))
    }

    showEditDialog(username, permissions) {
        if (userutils.isLoggedInUserAdmin()) {
            this.setState(currState => (
                {...currState, showEditDialog: true, editUsername: username, editPermissions: permissions}
            ))
        } else {
            ToastsStore.info('Only admins can do that', 3000, 'burntToast')
        }
    }

    onCloseEdit() {
        this.setState(currState => (
            {...currState, showEditDialog: false, editUsername: ''}
        ))
    }

    deleteUser() {
        if (!userutils.isLoggedInUserAdmin()) {
            ToastsStore.info('Only admins can do that', 3000, 'burntToast')
            this.onCloseDelete()
            return
        }

        if (this.state.deleteUsername === 'admin') {
            ToastsStore.info("Can't delete the special admin account", 3000, 'burntToast')
            this.onCloseDelete()
            return
        }

        userutils.deleteUser(this.state.deleteUsername, isLocalUser => {
            if (isLocalUser) {
                ToastsStore.info("Deleted @"+this.state.deleteUsername, 3000, 'burntToast')
            } else {
                ToastsStore.info("Can't delete NetID user", 3000, 'burntToast')
            }
            this.onCloseDelete()

            this.init()
        })
    }

    editUser() {
        if (!userutils.isLoggedInUserAdmin()) {
            ToastsStore.info('Only admins can do that', 3000, 'burntToast')
            this.onCloseDelete()
            return
        }

        if (this.state.editUsername === 'admin') {
            ToastsStore.info("Can't edit the special admin's settings", 3000, 'burntToast')
            return
        }



        userutils.updateUserPermissions(this.state.editUsername, this.state.editPermissions, () => {
            ToastsStore.info("Changes saved", 3000, 'burntToast')
            this.onCloseEdit()

            this.init()
        })

    }

    componentDidMount() {
        if (localStorage.getItem('tipShown') !== 'yes') {
            ToastsStore.info("Tip: Click on column headers to sort", 3000, 'burntToast')
            localStorage.setItem('tipShown', 'yes')
        }
    }

    render() {
        if (this.state.redirect !== '') {
            return <Redirect to={this.state.redirect} />
        }
        if (!userutils.isUserLoggedIn()) {
            userutils.logout()
            return <Redirect to='/' />
        }

        const adminColumns = userutils.isLoggedInUserAdmin() ? [
            {
                property: 'dummy',
                render: datum => (
                <FormEdit style={{cursor: 'pointer'}} onClick={() => this.showEditDialog(datum.username, datum.permissions)} />
            ),
                align: 'center',
                header: <Text>Edit</Text>,
                sortable: false
            },
            {
                property: 'dummy2',
                render: datum => (
                <FormTrash style={{cursor: 'pointer'}} onClick={() => this.showDeleteDialog(datum.username)} />
            ),
                align: 'center',
                header: <Text>Delete</Text>,
                sortable: false
            }
        ] : []

        return (
            <Grommet theme={theme} full className='fade'>

                <Box fill background='light-2'>
                    <AppBar>
                        <HomeMenu alignSelf='start' this={this} />
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }} >Users</Heading>
                        <UserMenu alignSelf='end' this={this} />
                    </AppBar>

                    <Box direction='row'
                        justify='center'
                        wrap={true}>
                        <Box direction='row' justify='center' overflow={{ horizontal: 'hidden' }}>
                               <Box direction='row' justify='center'>
                                   <Box width='large' direction='column' align='stretch' justify='start'>
                                       <Box style={{
                                                borderRadius: 10,
                                                borderColor: '#EDEDED'
                                            }}
                                           id='containerBox'
                                           direction='row'
                                           background='#FFFFFF'
                                           margin={{top: 'medium', bottom: 'medium'}}
                                           flex={{
                                               grow: 0,
                                               shrink: 0
                                           }}
                                           pad='small' >
                                           <Box margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}} direction='column'
                                               justify='start' alignSelf='stretch' flex>
                                               <Heading level='4' margin='none'>{this.props.title}</Heading>
                                               <Box align="center">
                                                    <DataTable
                                                        step={25}
                                                        onMore={() => {
                                                            if (this.startAfter) {
                                                                userutils.loadUsers(this.startAfter, (users, newStartAfter) => {
                                                                    this.startAfter = newStartAfter
                                                                    this.setState(oldState => (
                                                                        {...oldState, users: [...oldState.users, ...users]}
                                                                    ))
                                                                })
                                                            }
                                                        }}
                                                        columns={
                                                            [
                                                                {
                                                                    property: 'name',
                                                                    header: <Text>Name</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'username',
                                                                    header: <Text>Username</Text>,
                                                                    primary: true,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'role',
                                                                    header: <Text>Role</Text>,
                                                                    sortable: true,
                                                                },
                                                                ...adminColumns
                                                            ]
                                                        }
                                                        data={this.state.users}
                                                        sortable={true}
                                                        size="medium"
                                                    />
                                                </Box>
                                           </Box>
                                       </Box>
                                   </Box>
                                   <Box
                                       width='medium'
                                       align='center'
                                       margin={{left: 'medium', right: 'medium'}}
                                       justify='start' >
                                       <Box style={{
                                                borderRadius: 10,
                                                borderColor: '#EDEDED',
                                                position: 'fixed'
                                            }}
                                            direction='row'
                                            alignSelf='stretch'
                                            background='#FFFFFF'
                                            width={'medium'}
                                            margin={{top: 'medium', left: 'medium', right: 'medium'}}
                                            pad='small' >
                                            <Box flex margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}} direction='column' justify='start'>
                                                <Heading level='4' margin='none'>Missing someone?</Heading>
                                                {
                                                    userutils.isLoggedInUserAdmin() ?
                                                    <p>Assign a username to them, and we'll invite them to join.</p> :
                                                    <p>Ask your admin to add them!</p>
                                                }

                                                {userutils.isLoggedInUserAdmin() && (
                                                    <Box direction='column' flex alignSelf='stretch'>
                                                        <Button primary icon={<Add />} label="Add" onClick={this.addUserDialog} />
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                   </Box>
                               </Box>
                           </Box>
                    </Box>
                </Box>
                {this.state.showAddDialog && (
                    <Layer position="center" modal onClickOutside={this.onClose} onEsc={this.onClose}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Add User
                            </Heading>
                            <p>Assign them a username, and give us an email address to send them their invitation.</p>

                            <Form>
                                <Box direction="column" gap="small">
                                    <Text size={"small"} style={{marginLeft: "20px"}}>Username</Text>
                                    <TextInput style={{
                                            borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                            width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal'
                                        }}
                                        placeholder="eg. admin, tkb13"
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, newUserUsername: value}))
                                        }}
                                        value={this.state.newUserUsername}
                                        title='Username'
                                        />
                                    <Text size={"small"} style={{marginLeft: "20px"}}>Email</Text>
                                    <TextInput style={{
                                            borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                            width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                        }}
                                        placeholder="eg. example@example.com"
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, newUserEmail: value}))
                                        }}
                                        value={this.state.newUserEmail}
                                        title='Email'
                                        />
                                </Box>
                                <Box
                                    margin={{top: 'medium'}}
                                    as="footer"
                                    gap="small"
                                    direction="row"
                                    align="center"
                                    justify="end" >
                                    <Button label="Add" type='submit' primary onClick={() => this.addUser()} />
                                    <Button
                                        label="Close"
                                        onClick={this.onClose}
                                        />
                                </Box>
                            </Form>
                        </Box>
                    </Layer>
                )}

                {this.state.showDeleteDialog && (
                    <Layer position="center" modal onClickOutside={this.onCloseDelete} onEsc={this.onCloseDelete}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Are you sure?
                            </Heading>
                            <p>Deleting @{this.state.deleteUsername}'s account is an action that cannot be reversed.</p>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="row"
                                align="center"
                                justify="end" >
                                <Button label="Yes" type='submit' primary onClick={() => this.deleteUser()} />
                                <Button
                                    label="No"
                                    onClick={this.onCloseDelete}
                                    />
                            </Box>
                        </Box>
                    </Layer>
                )}

                {this.state.showEditDialog && (
                    <Layer position="center" modal onClickOutside={this.onCloseEdit} onEsc={this.onCloseEdit}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Edit user permissions
                            </Heading>
                            <Form>
                                <Box direction="column" gap="small" margin={{top: 'small'}}
                                    style={{maxHeight: 300}}
                                    overflow='auto'>
                                    <CheckBox
                                        checked={this.state.editPermissions.includes('ADMIN_PERMISSION')}
                                        label="Administrator permission"
                                        onChange={(event) => {
                                            if (event.target.checked && !this.state.editPermissions.includes('ADMIN_PERMISSION')){
                                                this.setState(oldState => ({
                                                    ...oldState, editPermissions: ['ADMIN_PERMISSION', 'AUDIT_PERMISSION', 'MODEL_PERMISSION', 'POWER_PERMISSION', 'ASSET_PERMISSION_GLOBAL', ...this.state.datacenterAbbrevs.map(dc => 'ASSET_PERMISSION_'+dc)]
                                                }))
                                            } else if (!event.target.checked && this.state.editPermissions.includes('ADMIN_PERMISSION')) {
                                                this.setState(oldState => {
                                                    var newPermissions = [...oldState.editPermissions]
                                                    newPermissions.splice(newPermissions.indexOf('ADMIN_PERMISSION'), 1)
                                                    return ({
                                                        ...oldState, editPermissions: newPermissions
                                                    })
                                                })
                                            }
                                        }}
                                        />

                                    <CheckBox
                                        checked={this.state.editPermissions.includes('AUDIT_PERMISSION')}
                                        label="Audit permission"
                                        onChange={(event) => {
                                            if (event.target.checked && !this.state.editPermissions.includes('AUDIT_PERMISSION')){
                                                this.setState(oldState => ({
                                                    ...oldState, editPermissions: [...oldState.editPermissions, 'AUDIT_PERMISSION']
                                                }))
                                            } else if (!event.target.checked && this.state.editPermissions.includes('AUDIT_PERMISSION')) {
                                                this.setState(oldState => {
                                                    var newPermissions = [...oldState.editPermissions]
                                                    newPermissions.splice(newPermissions.indexOf('AUDIT_PERMISSION'), 1)
                                                    if (newPermissions.indexOf('ADMIN_PERMISSION') !== -1)
                                                        newPermissions.splice(newPermissions.indexOf('ADMIN_PERMISSION'), 1)
                                                    return ({
                                                        ...oldState, editPermissions: newPermissions
                                                    })
                                                })
                                            }
                                        }}
                                        />
                                    <CheckBox
                                        checked={this.state.editPermissions.includes('MODEL_PERMISSION')}
                                        label="Model management permission"
                                        onChange={(event) => {
                                            if (event.target.checked && !this.state.editPermissions.includes('MODEL_PERMISSION')){
                                                this.setState(oldState => ({
                                                    ...oldState, editPermissions: [...oldState.editPermissions, 'MODEL_PERMISSION']
                                                }))
                                            } else if (!event.target.checked && this.state.editPermissions.includes('MODEL_PERMISSION')) {
                                                this.setState(oldState => {
                                                    var newPermissions = [...oldState.editPermissions]
                                                    newPermissions.splice(newPermissions.indexOf('MODEL_PERMISSION'), 1)
                                                    if (newPermissions.indexOf('ADMIN_PERMISSION') !== -1)
                                                        newPermissions.splice(newPermissions.indexOf('ADMIN_PERMISSION'), 1)
                                                    return ({
                                                        ...oldState, editPermissions: newPermissions
                                                    })
                                                })
                                            }
                                        }}
                                        />
                                    <CheckBox
                                        checked={this.state.editPermissions.includes('POWER_PERMISSION')}
                                        label="Power permission"
                                        onChange={(event) => {
                                            if (event.target.checked && !this.state.editPermissions.includes('POWER_PERMISSION')){
                                                this.setState(oldState => ({
                                                    ...oldState, editPermissions: [...oldState.editPermissions, 'POWER_PERMISSION']
                                                }))
                                            } else if (!event.target.checked && this.state.editPermissions.includes('POWER_PERMISSION')) {
                                                this.setState(oldState => {
                                                    var newPermissions = [...oldState.editPermissions]
                                                    newPermissions.splice(newPermissions.indexOf('POWER_PERMISSION'), 1)
                                                    if (newPermissions.indexOf('ADMIN_PERMISSION') !== -1)
                                                        newPermissions.splice(newPermissions.indexOf('ADMIN_PERMISSION'), 1)
                                                    return ({
                                                        ...oldState, editPermissions: newPermissions
                                                    })
                                                })
                                            }
                                        }}
                                        />
                                        <hr
                                            style={{
                                                color: '#dddddd',
                                                backgroundColor: '#dddddd',
                                                height: 1,
                                                border: 'none',
                                                width: '100%'
                                            }}
                                        />
                                    <CheckBox
                                        checked={this.state.editPermissions.includes('ASSET_PERMISSION_GLOBAL')}
                                        label="Asset management permission (Global)"
                                        onChange={(event) => {
                                            if (event.target.checked && !this.state.editPermissions.includes('ASSET_PERMISSION_GLOBAL')){
                                                this.setState(oldState => {
                                                    var newPermissions = ['ASSET_PERMISSION_GLOBAL']
                                                    oldState.editPermissions.forEach((item, i) => {
                                                        if (!item.startsWith('ASSET_PERMISSION')) {
                                                            newPermissions.push(item)
                                                        }
                                                    })
                                                    oldState.datacenterAbbrevs.forEach((item, i) => {
                                                        newPermissions.push('ASSET_PERMISSION_'+item)
                                                    })

                                                    return ({
                                                        ...oldState, editPermissions: newPermissions
                                                    })
                                                })
                                            } else if (!event.target.checked && this.state.editPermissions.includes('ASSET_PERMISSION_GLOBAL')) {
                                                this.setState(oldState => {
                                                    var newPermissions = []
                                                    oldState.editPermissions.forEach((item, i) => {
                                                        if (!item.startsWith('ASSET_PERMISSION')) {
                                                            newPermissions.push(item)
                                                        }
                                                    })
                                                    if (newPermissions.indexOf('ADMIN_PERMISSION') !== -1)
                                                        newPermissions.splice(newPermissions.indexOf('ADMIN_PERMISSION'), 1)

                                                    return ({
                                                        ...oldState, editPermissions: newPermissions
                                                    })
                                                })
                                            }
                                        }}
                                        />
                                    {this.state.datacenterAbbrevs.map(dcAbbrev => (
                                        <CheckBox
                                            checked={this.state.editPermissions.includes('ASSET_PERMISSION_'+dcAbbrev)}
                                            label={"Asset management permission ("+dcAbbrev+")"}
                                            onChange={(event) => {
                                                if (event.target.checked && !this.state.editPermissions.includes('ASSET_PERMISSION_'+dcAbbrev)){
                                                    this.setState(oldState => ({
                                                        ...oldState, editPermissions: [...oldState.editPermissions, 'ASSET_PERMISSION_'+dcAbbrev]
                                                    }))
                                                } else if (!event.target.checked && this.state.editPermissions.includes('ASSET_PERMISSION_'+dcAbbrev)) {
                                                    this.setState(oldState => {
                                                        var newPermissions = [...oldState.editPermissions]
                                                        if (newPermissions.indexOf('ASSET_PERMISSION_GLOBAL') !== -1)
                                                            newPermissions.splice(newPermissions.indexOf('ASSET_PERMISSION_GLOBAL'), 1)
                                                        if (newPermissions.indexOf('ADMIN_PERMISSION') !== -1)
                                                            newPermissions.splice(newPermissions.indexOf('ADMIN_PERMISSION'), 1)
                                                        newPermissions.splice(newPermissions.indexOf('ASSET_PERMISSION_'+dcAbbrev), 1)
                                                        return ({
                                                            ...oldState, editPermissions: newPermissions
                                                        })
                                                    })
                                                }

                                            }}
                                            />
                                    ))}
                                </Box>
                                <Box
                                    margin={{top: 'medium'}}
                                    as="footer"
                                    gap="small"
                                    direction="row"
                                    align="center"
                                    justify="end" >
                                    <Button label="Save" type='submit' primary onClick={() => this.editUser()} />
                                    <Button
                                        label="Cancel"
                                        onClick={this.onCloseEdit}
                                        />
                                </Box>
                            </Form>
                        </Box>
                    </Layer>
                )}
                <ToastsContainer store={ToastsStore} lightBackground/>
            </Grommet>
        )
    }
}

export default UsersScreen
