import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
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
    Form } from 'grommet'

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
                     role: (doc.data().username === 'admin' ? 'Admin' : 'User')}
            ))})
        })
    }

    componentWillMount() {
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

    showEditDialog(username) {
        if (userutils.isLoggedInUserAdmin()) {
            this.setState(currState => (
                {...currState, showEditDialog: true, editUsername: username}
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
            ToastsStore.info("Can't delete an admin", 3000, 'burntToast')
            this.onCloseDelete()
            return
        }

        userutils.deleteUser(this.state.deleteUsername, () => {
            ToastsStore.info("Deleted @"+this.state.deleteUsername, 3000, 'burntToast')
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
            ToastsStore.info("Can't change admin's username", 3000, 'burntToast')
            return
        }

        var newUsername = this.state.editUserNewUsername
        while (newUsername.startsWith('@')) {
            newUsername = newUsername.substring(1)
        }

        if (newUsername === '') {
            ToastsStore.info('New username required', 3000, 'burntToast')
            return
        }

        userutils.usernameTaken(newUsername, taken => {
            if (taken) {
                ToastsStore.info('Username taken', 3000, 'burntToast')
            } else {
                userutils.updateUsername(this.state.editUsername, newUsername, () => {
                    ToastsStore.info("Changes saved", 3000, 'burntToast')
                    this.onCloseEdit()

                    this.init()
                })
            }
        })
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
                <FormEdit style={{cursor: 'pointer'}} onClick={() => this.showEditDialog(datum.username)} />
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
                        <HomeButton alignSelf='start' this={this} />
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
                                    <TextInput style={{
                                            borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                            width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal'
                                        }}
                                        placeholder="Username"
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, newUserUsername: value}))
                                        }}
                                        value={this.state.newUserUsername}
                                        title='Username'
                                        />
                                    <TextInput style={{
                                            borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                            width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                        }}
                                        placeholder="Email"
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
                                Edit user
                            </Heading>
                            <p>You can only change users' usernames, as they can't do that. All other profile details must be changed by the user themselves.</p>
                            <Form>
                                <Box direction="column" gap="small" margin={{top: 'small'}}>
                                    <TextInput style={{
                                            borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                            width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                        }}
                                        placeholder="New username"
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, editUserNewUsername: value}))
                                        }}
                                        value={this.state.editUserNewUsername}
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
