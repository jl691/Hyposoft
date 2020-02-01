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
    Meter,
    Text,
    TextInput,
    Form } from 'grommet'

import { Add, FormEdit, FormTrash } from "grommet-icons"
import theme from '../theme'

class UsersScreen extends Component {
    state = {

    }

    startAfter = null

    constructor() {
        super()
    }

    init() {

    }

    componentWillMount() {
        this.init()
    }

    render() {
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
                        }} >{this.props.match.params.vendor} {this.props.match.params.modelNumber}</Heading>
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
                                                <Heading level='4' margin='none'>Model Details</Heading>
                                                <table style={{marginTop: '10px', marginBottom: '10px'}}>
                                                    <tr><td><b>Vendor</b></td><td style={{textAlign: 'right'}}>Apple</td></tr>
                                                    <tr><td><b>Model Number</b></td><td style={{textAlign: 'right'}}>iServer 3.0</td></tr>
                                                    <tr><td><b>Height</b></td><td style={{textAlign: 'right'}}>5 U</td></tr>
                                                    <tr><td><b>Display Color</b></td><td style={{textAlign: 'right'}}>
                                                    <Meter
                                                        values={[{
                                                        value: 100,
                                                        color: '#0000ff'
                                                        }]}
                                                        size='xsmall'
                                                        thickness='xsmall'
                                                        />
                                                    </td></tr>
                                                    <tr><td><b>Ethernet Ports</b></td><td style={{textAlign: 'right'}}>5 Ports</td></tr>
                                                    <tr><td><b>Power Ports</b></td><td style={{textAlign: 'right'}}>5 Ports</td></tr>
                                                    <tr><td><b>CPU</b></td><td style={{textAlign: 'right'}}>iCPU</td></tr>
                                                    <tr><td><b>Memory</b></td><td style={{textAlign: 'right'}}>10 GB</td></tr>
                                                    <tr><td><b>Storage</b></td><td style={{textAlign: 'right'}}>iStorage</td></tr>
                                                </table>
                                                {"".split('\n').map((i,key) => {
                                                    return <div key={key}>{i}</div>
                                                })}
                                                <Box direction='column' flex alignSelf='stretch' style={{marginTop: '15px'}}>
                                                    <Button primary icon={<Add />} label="Add" onClick={this.addUserDialog} />
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
