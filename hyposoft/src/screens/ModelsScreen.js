import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import ModelSettingsLayer from '../components/ModelSettingsLayer'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import * as modelutils from '../utils/modelutils'
import * as firebaseutils from '../utils/firebaseutils'
import * as userutils from '../utils/userutils'


import {
    Box,
    Button,
    DataTable,
    Grommet,
    Heading,
    Layer,
    Text,
    TextInput,
    RangeSelector,
    Stack } from 'grommet'

import { Add, FormEdit, FormTrash } from "grommet-icons"
import theme from '../theme'

class ModelsScreen extends React.Component {
    defaultFilters = {
        ethernetPortsFilterEnd: 25,
        ethernetPortsFilterStart: 0,
        heightFilterEnd: 42,
        heightFilterStart: 0,
        powerFilterEnd: 10,
        powerFilterStart: 0,
        ethernetPortsFilterMax: 30,
        powerFilterMax: 12,
        memoryFilterMax: 1200,
        memoryFilterStart: 0,
        memoryFilterEnd: 1000,
        filters: {
            heightStart: 0, heightEnd: 42,
            ethernetPortsStart: 0, ethernetPortsEnd: 25,
            memoryStart: 0, memoryEnd: 1000,
            powerPortsStart: 0, powerPortsEnd: 10
        }
    }
    state = {
        searchQuery: '',
        ethernetPortsFilterEnd: 25,
        ethernetPortsFilterStart: 0,
        heightFilterEnd: 42,
        heightFilterStart: 0,
        powerFilterEnd: 10,
        powerFilterStart: 0,
        ethernetPortsFilterMax: 30,
        powerFilterMax: 12,
        memoryFilterMax: 1200,
        memoryFilterStart: 0,
        memoryFilterEnd: 1000,
        filters: {
            heightStart: 0, heightEnd: 42,
            ethernetPortsStart: 0, ethernetPortsEnd: 25,
            memoryStart: 0, memoryEnd: 1000,
            powerPortsStart: 0, powerPortsEnd: 10
        }
    }

    startAfter = null

    init() {
        firebaseutils.modelsRef
        .orderBy('vendor').orderBy('modelNumber')
        .get()
        .then(docSnaps => {
            var models = []
            var itemNo = 1
            for (var i = 0; i < docSnaps.docs.length; i++) {
                if (modelutils.matchesFilters(docSnaps.docs[i], this.state.filters)) {
                    models = [...models, {...docSnaps.docs[i].data(), id: docSnaps.docs[i].id, itemNo: itemNo++}]
                    if (models.length === 25 || i === docSnaps.docs.length - 1) {
                        var newStartAfter = null
                        if (i < docSnaps.docs.length - 1) {
                            newStartAfter = docSnaps.docs[i+1]
                        }
                        this.startAfter = newStartAfter
                        this.setState(oldState => ({
                            ...oldState,
                            models: models
                        }))
                        return
                    }
                }
            }

            this.startAfter = null
            this.setState(oldState => ({
                ...oldState,
                models: models
            }))
        })
    }

    componentWillMount() {
        this.init()
    }

    constructor() {
        super()
        this.showAddModelDialog = this.showAddModelDialog.bind(this)
        this.hideAddModelDialog = this.hideAddModelDialog.bind(this)
        this.showEditDialog = this.showEditDialog.bind(this)
        this.hideEditDialog = this.hideEditDialog.bind(this)
        this.showDeleteDialog = this.showDeleteDialog.bind(this)
        this.hideDeleteDialog = this.hideDeleteDialog.bind(this)

        this.init = this.init.bind(this)
    }

    showAddModelDialog() {
        if (!userutils.isLoggedInUserAdmin()) {
            ToastsStore.info('Only admins can do this', 3000, 'burntToast')
            return
        }

        this.setState(currState => (
            {...currState, showAddDialog: true, showEditDialog: false}
        ))
    }

    hideAddModelDialog() {
        this.setState(currState => (
            {...currState, showAddDialog: false}
        ))
    }

    showEditDialog(itemNo) {
        if (!userutils.isLoggedInUserAdmin()) {
            ToastsStore.info('Only admins can do this', 3000, 'burntToast')
            return
        }

        this.modelToEdit = this.state.models[itemNo-1]

        this.setState(currState => (
            {...currState, showEditDialog: true, showAddDialog: false}
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

        this.modelToDelete = this.state.models[itemNo-1]

        this.setState(currState => (
            {...currState, showEditDialog: false, showAddDialog: false, showDeleteDialog: true}
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

        modelutils.doesModelHaveInstances(this.modelToDelete.id, yes => {
            if (yes) {
                ToastsStore.info("Can't delete model with live instances", 3000, 'burntToast')
                this.hideDeleteDialog()
                return
            }

            modelutils.deleteModel(this.modelToDelete.id, () => {
                ToastsStore.info("Model deleted", 3000, 'burntToast')
                this.init()
                this.hideDeleteDialog()
            })

        })
    }

    render() {
        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill background='light-2'>
                    <AppBar>
                        <HomeButton alignSelf='start' this={this} />
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }} >Models</Heading>
                        <UserMenu alignSelf='end' this={this} />
                    </AppBar>

                    <Box direction='row'
                        justify='center'
                        wrap={true}>
                        <Box direction='row' justify='center'>
                               <Box direction='row' justify='center'>
                                   <Box width='large' direction='column' align='stretch' justify='start'>
                                   <Box margin={{top: 'medium'}}>
                                       <TextInput style={styles.TIStyle}
                                           placeholder="Search for models (type your query and press enter)"
                                           type='search'
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, searchQuery: value}))
                                           }}
                                           value={this.state.searchQuery}
                                           title='Search'
                                           />
                                   </Box>
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
                                               <Box align="center">
                                                    <DataTable
                                                        step={25}
                                                        onMore={() => {
                                                            if (this.startAfter) {
                                                                modelutils.getModels(this.startAfter, (models, newStartAfter) => {
                                                                    this.startAfter = newStartAfter
                                                                    this.setState(oldState => (
                                                                        {...oldState, models: [...oldState.userse, ...models]}
                                                                    ))
                                                                }, this.state.filters)
                                                            }
                                                        }}
                                                        columns={
                                                            [
                                                                {
                                                                    property: 'itemNo',
                                                                    header: <Text size='small'>#</Text>,
                                                                    render: datum => <Text size='small'>{datum.itemNo}</Text>,
                                                                    primary: true,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'vendor',
                                                                    header: <Text size='small'>Vendor</Text>,
                                                                    render: datum => <Text size='small'>{datum.vendor}</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'modelNumber',
                                                                    header: <Text size='small'>Model #</Text>,
                                                                    render: datum => <Text size='small'>{datum.modelNumber}</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'height',
                                                                    header: <Text size='small'>Height</Text>,
                                                                    render: datum => <Text size='small'>{datum.height}</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'ethernetPorts',
                                                                    header: <Text size='small'>Ethernet ports #</Text>,
                                                                    render: datum => <Text size='small'>{datum.ethernetPorts}</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'portPorts',
                                                                    header: <Text size='small'>Power ports #</Text>,
                                                                    render: datum => <Text size='small'>{datum.powerPorts}</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'memory',
                                                                    header: <Text size='small'>Memory</Text>,
                                                                    render: datum => <Text size='small'>{datum.memory}</Text>,
                                                                    sortable: true,
                                                                },
                                                                {
                                                                    property: 'dummy',
                                                                    render: datum => (
                                                                    <FormEdit style={{cursor: 'pointer'}} onClick={() => this.showEditDialog(datum.itemNo)} />
                                                                ),
                                                                    align: 'center',
                                                                    header: <Text size='small'>Edit</Text>,
                                                                    sortable: false
                                                                },
                                                                {
                                                                    property: 'dummy2',
                                                                    render: datum => (
                                                                    <FormTrash style={{cursor: 'pointer'}} onClick={() => this.showDeleteDialog(datum.itemNo)} />
                                                                ),
                                                                    align: 'center',
                                                                    header: <Text size='small'>Delete</Text>,
                                                                    sortable: false
                                                                }
                                                            ]
                                                        }
                                                        data={this.state.models}
                                                        sortable={true}
                                                        size="medium"
                                                    />
                                                </Box>
                                           </Box>
                                       </Box>
                                       <Button primary icon={<Add />} label="Add model" alignSelf='center' onClick={this.showAddModelDialog} />
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
                                                <Text size='small'><b>Height range</b></Text>
                                                <Stack margin={{top: 'small'}}>
                                                   <Box background="light-4" height="10px" direction="row" round="large" />
                                                   <RangeSelector
                                                     direction="horizontal"
                                                     min={0}
                                                     max={42}
                                                     step={1}
                                                     round="large"
                                                     values={[this.state.heightFilterStart,this.state.heightFilterEnd]}
                                                     onChange={nextRange => {
                                                         this.setState(oldState => ({
                                                             ...oldState, heightFilterStart: nextRange[0],
                                                             heightFilterEnd: nextRange[1],
                                                             filters: {...oldState.filters, heightStart: nextRange[0], heightEnd: nextRange[1]}
                                                         }))
                                                     }}
                                                   />
                                                </Stack>
                                                <Box align="center">
                                                   <Text size="xsmall" margin={{top: 'xsmall'}}>{this.state.heightFilterStart} - {this.state.heightFilterEnd} U</Text>
                                                </Box>
                                            </Box>
                                        </Box>
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
                                                 <Text size='small'><b>Ethernet ports range</b></Text>
                                                 <Stack margin={{top: 'small'}}>
                                                    <Box background="light-4" height="10px" direction="row" round="large" />
                                                    <RangeSelector
                                                      direction="horizontal"
                                                      min={0}
                                                      max={this.state.ethernetPortsFilterMax}
                                                      step={1}
                                                      round="large"
                                                      values={[this.state.ethernetPortsFilterStart,this.state.ethernetPortsFilterEnd]}
                                                      onChange={nextRange => {
                                                          var newMax = this.state.ethernetPortsFilterMax
                                                          if (nextRange[1] === this.state.ethernetPortsFilterMax) {
                                                              newMax = parseInt(newMax*1.1)
                                                          }

                                                          this.setState(oldState => ({
                                                              ...oldState, ethernetPortsFilterStart: nextRange[0],
                                                              ethernetPortsFilterEnd: nextRange[1],
                                                              ethernetPortsFilterMax: newMax,
                                                              filters: {...oldState.filters, ethernetPortsStart: nextRange[0], ethernetPortsEnd: nextRange[1]}
                                                          }))
                                                      }}
                                                    />
                                                </Stack>
                                                <Box align="center">
                                                    <Text size="xsmall" margin={{top: 'xsmall'}}>{this.state.ethernetPortsFilterStart} - {this.state.ethernetPortsFilterEnd} ports</Text>
                                                </Box>
                                             </Box>
                                         </Box>
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
                                                  <Text size='small'><b>Power ports range</b></Text>
                                                  <Stack margin={{top: 'small'}}>
                                                     <Box background="light-4" height="10px" direction="row" round="large" />
                                                     <RangeSelector
                                                       direction="horizontal"
                                                       min={0}
                                                       max={this.state.powerFilterMax}
                                                       step={1}
                                                       round="large"
                                                       values={[this.state.powerFilterStart,this.state.powerFilterEnd]}
                                                       onChange={nextRange => {
                                                           var newMax = this.state.powerFilterMax
                                                           if (nextRange[1] === this.state.powerFilterMax) {
                                                               newMax = parseInt(newMax*1.1)
                                                           }

                                                           this.setState(oldState => ({
                                                               ...oldState, powerFilterStart: nextRange[0],
                                                               powerFilterEnd: nextRange[1],
                                                               powerFilterMax: newMax,
                                                               filters: {...oldState.filters, powerPortsStart: nextRange[0], powerPortsEnd: nextRange[1]}
                                                           }))
                                                       }}
                                                     />
                                                  </Stack>
                                                  <Box align="center">
                                                     <Text size="xsmall" margin={{top: 'xsmall'}}>{this.state.powerFilterStart} - {this.state.powerFilterEnd} ports</Text>
                                                  </Box>
                                              </Box>
                                          </Box>
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
                                                   <Text size='small'><b>Memory range</b></Text>
                                                   <Stack margin={{top: 'small'}}>
                                                      <Box background="light-4" height="10px" direction="row" round="large" />
                                                      <RangeSelector
                                                        direction="horizontal"
                                                        min={0}
                                                        max={this.state.memoryFilterMax}
                                                        step={1}
                                                        round="large"
                                                        values={[this.state.memoryFilterStart,this.state.memoryFilterEnd]}
                                                        onChange={nextRange => {
                                                            var newMax = this.state.memoryFilterMax
                                                            if (nextRange[1] === this.state.memoryFilterMax) {
                                                                newMax = parseInt(newMax*1.1)
                                                            }

                                                            this.setState(oldState => ({
                                                                ...oldState, memoryFilterStart: nextRange[0],
                                                                memoryFilterEnd: nextRange[1],
                                                                memoryFilterMax: newMax,
                                                                filters: {...oldState.filters, memoryStart: nextRange[0], memoryEnd: nextRange[1]}
                                                            }))
                                                        }}
                                                      />
                                                   </Stack>
                                                   <Box align="center">
                                                      <Text size="xsmall" margin={{top: 'xsmall'}}>{this.state.memoryFilterStart} - {this.state.memoryFilterEnd} GB</Text>
                                                   </Box>
                                               </Box>
                                           </Box>
                                        <Box
                                             direction='row'
                                             alignSelf='stretch'
                                             width='medium'
                                             justify='center'
                                             margin={{top: 'medium', left: 'medium', right: 'medium'}} >
                                             <Button primary label="Apply filters" onClick={() => {this.init()}}
                                                />
                                            <Button label="Clear filters" onClick={() => {
                                                this.setState(oldState => ({
                                                    ...oldState, ...this.defaultFilters
                                                }), () => this.init())
                                            }} margin={{left: 'small'}}
                                               />
                                        </Box>
                                   </Box>
                               </Box>
                           </Box>
                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>
                {this.state.showAddDialog && (
                    <ModelSettingsLayer type='add' parent={this} />
                )}

                {this.state.showEditDialog && (
                    <ModelSettingsLayer type='edit' parent={this} model={this.modelToEdit} />
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

const styles = {
    TIStyle: {
        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#FFFFFF',
        width: '100%', paddingLeft: 20, fontWeight: 'normal'
    }
}

export default ModelsScreen
