import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import BackButton from '../components/BackButton'
import UserMenu from '../components/UserMenu'
import ModelSettingsLayer from '../components/ModelSettingsLayer'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import * as userutils from '../utils/userutils'
import * as modelutils from '../utils/modelutils'
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

import theme from '../theme'

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '89a91cdfab76a8541fe5d2da46765377')
const index = client.initIndex('models')

class UsersScreen extends Component {
    state = {
        vendor: '',
        modelNumber: '',
        height: '',
        displayColor: '#BD10E0',
        ethernetPorts: '',
        powerPorts: '',
        cpu: '',
        memory: '',
        storage: '',
        comment: ''
    }

    startAfter = null

    constructor() {
        super()
        this.showEditDialog = this.showEditDialog.bind(this)
        this.hideEditDialog = this.hideEditDialog.bind(this)
        this.showDeleteDialog = this.showDeleteDialog.bind(this)
        this.hideDeleteDialog = this.hideDeleteDialog.bind(this)
    }

    showEditDialog(itemNo) {
        if (!userutils.isLoggedInUserAdmin()) {
            ToastsStore.info('Only admins can do this', 3000, 'burntToast')
            return
        }

        this.setState(currState => (
            {...currState, showEditDialog: true, showDeleteDialog: false}
        ))
    }

    hideEditDialog() {
        this.setState(currState => (
            {...currState, showEditDialog: false}
        ))
    }

    showDeleteDialog(itemNo) {
        if (!userutils.isLoggedInUserAdmin()) {
            ToastsStore.info('Only admins can do this', 3000, 'burntToast')
            return
        }

        this.setState(currState => (
            {...currState, showEditDialog: false, showDeleteDialog: true}
        ))
    }

    hideDeleteDialog() {
        this.setState(currState => (
            {...currState, showDeleteDialog: false}
        ))
    }

    deleteModel() {
        if (!userutils.isLoggedInUserAdmin()) {
            ToastsStore.info('Only admins can do this', 3000, 'burntToast')
            return
        }

        if (this.state.instances.length > 0) {
            ToastsStore.info("Can't delete model with live instances", 3000, 'burntToast')
        } else {
            modelutils.deleteModel(this.state.id, () => {
                ToastsStore.info("Model deleted", 3000, 'burntToast')
                this.init()
                this.hideDeleteDialog()
                index.deleteObject(this.state.id)
            })
        }
    }

    init() {
        modelutils.getModelByModelname(this.props.match.params.vendor+' '+this.props.match.params.modelNumber, model => {
            this.setState(oldState => ({
                ...oldState,
                ...model.data(),
                id: model.id,
                model: {...model.data(), id: model.id}
            }))
        })

        firebaseutils.instanceRef
        .where('model', '==', this.props.match.params.vendor+' '+this.props.match.params.modelNumber)
        .limit(25)
        .get().then(docSnaps => {
            if (docSnaps.docs.length === 25) {
                this.startAfter = docSnaps.docs[docSnaps.docs.length-1]
            }
            var i = 1
            this.setState({instances: docSnaps.docs.map(doc => (
                {...doc.data(), id: doc.id, itemNo: i++}
            ))})
        })
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
                        <BackButton alignSelf='start' this={this} />
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
                                       margin={{top: 'medium', bottom: 'small'}}
                                       flex={{
                                           grow: 0,
                                           shrink: 0
                                       }}
                                       pad='small' >
                                       <Heading level='5' margin={{left: 'medium', top: 'none', bottom: 'none'}}>Deployed Instances</Heading>
                                   </Box>
                                       <Box style={{
                                                borderRadius: 10,
                                                borderColor: '#EDEDED'
                                            }}
                                           id='containerBox'
                                           direction='row'
                                           background='#FFFFFF'
                                           margin={{top: 'small', bottom: 'medium'}}
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
                                                                    property: 'hostname',
                                                                    header: <Text size='small'>Hostname</Text>,
                                                                    render: datum => <Text size='small'>{datum.hostname}</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'rack',
                                                                    header: <Text size='small'>Rack</Text>,
                                                                    render: datum => <Text size='small'>{datum.rack}</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'rackU',
                                                                    header: <Text size='small'>Rack U</Text>,
                                                                    render: datum => <Text size='small'>{datum.rackU}</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'owner',
                                                                    header: <Text size='small'>Owner</Text>,
                                                                    render: datum => <Text size='small'>{datum.owner}</Text>,
                                                                    sortable: true,
                                                                },
                                                            ]
                                                        }
                                                        data={this.state.instances}
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
                                                borderColor: '#EDEDED'
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
                                                    <tr><td><b>Vendor</b></td><td style={{textAlign: 'right'}}>{this.state.vendor}</td></tr>
                                                    <tr><td><b>Model Number</b></td><td style={{textAlign: 'right'}}>{this.state.modelNumber}</td></tr>
                                                    <tr><td><b>Height</b></td><td style={{textAlign: 'right'}}>{this.state.height} U</td></tr>
                                                    <tr><td><b>Display Color</b></td><td style={{textAlign: 'right'}}>
                                                    <Meter
                                                        values={[{
                                                        value: 100,
                                                        color: this.state.displayColor
                                                        }]}
                                                        size='xsmall'
                                                        thickness='xsmall'
                                                        />
                                                    </td></tr>
                                                    <tr><td><b>Ethernet Ports</b></td><td style={{textAlign: 'right'}}>{this.state.ethernetPorts || 'N/A'} Ports</td></tr>
                                                    <tr><td><b>Power Ports</b></td><td style={{textAlign: 'right'}}>{this.state.powerPorts || 'N/A'} Ports</td></tr>
                                                    <tr><td><b>CPU</b></td><td style={{textAlign: 'right'}}>{this.state.cpu || 'N/A'}</td></tr>
                                                    <tr><td><b>Memory</b></td><td style={{textAlign: 'right'}}>{this.state.memory || 'N/A'} GB</td></tr>
                                                    <tr><td><b>Storage</b></td><td style={{textAlign: 'right'}}>{this.state.storage || 'N/A'}</td></tr>
                                                </table>
                                                <span style={{maxHeight: 100, overflow: 'scroll'}}>
                                                {this.state.comment.split('\n').map((i,key) => {
                                                    return <div key={key}>{i}</div>
                                                })}
                                                </span>
                                                <Box direction='column' flex alignSelf='stretch' style={{marginTop: '15px'}} gap='small'>
                                                    <Button primary label="Edit" onClick={this.showEditDialog} />
                                                    <Button label="Delete" onClick={this.showDeleteDialog} />
                                                </Box>
                                            </Box>
                                        </Box>
                                   </Box>
                               </Box>
                           </Box>
                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>

                {this.state.showEditDialog && (
                    <ModelSettingsLayer type='edit' parent={this} model={this.state.model} />
                )}

                {this.state.showDeleteDialog && (
                    <Layer position="center" modal onClickOutside={this.hideDeleteDialog} onEsc={this.hideDeleteDialog}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Are you sure?
                            </Heading>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="row"
                                align="center"
                                justify="end" >
                                <Button label="Yes" type='submit' primary onClick={() => this.deleteModel()} />
                                <Button
                                    label="No"
                                    onClick={this.hideDeleteDialog}
                                    />
                            </Box>
                        </Box>
                    </Layer>
                )}
            </Grommet>
        )
    }
}

export default UsersScreen
