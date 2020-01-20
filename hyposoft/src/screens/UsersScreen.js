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
    Text } from 'grommet'

import { Add, FormTrash } from "grommet-icons"
import theme from '../theme'

class UsersScreen extends Component {
    state = {
        redirect: '',
        users: [
        ]
    }

    startAfter = null

    componentWillMount() {
        firebaseutils.usersRef.orderBy('username').limit(25).get().then(docSnaps => {
            this.startAfter = docSnaps.docs[docSnaps.docs.length-1]
            this.setState({users: docSnaps.docs.map(doc => (
                {dummy: true, username: doc.data().username, name: doc.data().displayName,
                     role: (doc.data().username === 'admin' ? 'Admin' : 'User')}
            ))})
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
                                           margin={{top: 'medium', bottom: (this.props.lastCard && 'medium')}}
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
                                                            userutils.loadUsers(this.startAfter, (users, newStartAfter) => {
                                                                this.startAfter = newStartAfter
                                                                this.setState({users: users})
                                                            })
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
                                                                {
                                                                    property: 'dummy',
                                                                    render: datum => (
                                                                    <FormTrash style={{cursor: 'pointer'}} onClick={() => {}} />
                                                                ),
                                                                    align: 'center',
                                                                    header: <Text>Delete</Text>,
                                                                    sortable: false
                                                                }
                                                            ].map(col => ({ ...col }))
                                                        }
                                                        data={this.state.users}
                                                        sortable
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
                                                <p>Assign a username to them, and we'll invite them to join.</p>
                                                <Box direction='column' flex alignSelf='stretch'>
                                                    <Button primary icon={<Add />} label="Add" onClick={() => {}} />
                                                </Box>
                                            </Box>
                                        </Box>
                                   </Box>
                               </Box>
                           </Box>
                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>
            </Grommet>
        )
    }
}

export default UsersScreen
