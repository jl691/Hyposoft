import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import * as modelutils from '../utils/modelutils'
import * as firebaseutils from '../utils/firebaseutils'

import { SketchPicker } from 'react-color'

import {
    Box,
    Button,
    DataTable,
    Grommet,
    Heading,
    Layer,
    Text,
    TextInput,
    TextArea,
    Form,
    RangeSelector,
    Stack } from 'grommet'

import { Add, FormEdit, FormTrash } from "grommet-icons"
import theme from '../theme'

class ModelsScreen extends React.Component {
    state = {
        searchQuery: ''
    }

    startAfter = null

    init() {
        firebaseutils.modelsRef.orderBy('vendor').orderBy('modelNumber').limit(25).get().then(docSnaps => {
            if (docSnaps.docs.length === 25) {
                this.startAfter = docSnaps.docs[docSnaps.docs.length-1]
            }
            var i = 1
            this.setState({models: docSnaps.docs.map(doc => (
                {...doc.data(), itemNo: i++}
            ))})
        })
    }

    componentWillMount() {
        this.init()
    }

    constructor() {
        super()
        this.showAddModelDialog = this.showAddModelDialog.bind(this)
        this.hideAddModelDialog = this.hideAddModelDialog.bind(this)
        this.init = this.init.bind(this)
    }

    showAddModelDialog() {
        this.setState(currState => (
            {...currState, showAddDialog: true}
        ))
    }

    hideAddModelDialog() {
        this.setState(currState => (
            {...currState, showAddDialog: false}
        ))
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
                                                                })
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
                                                                    <FormEdit style={{cursor: 'pointer'}} onClick={() => this.showEditDialog(datum.username)} />
                                                                ),
                                                                    align: 'center',
                                                                    header: <Text size='small'>Edit</Text>,
                                                                    sortable: false
                                                                },
                                                                {
                                                                    property: 'dummy2',
                                                                    render: datum => (
                                                                    <FormTrash style={{cursor: 'pointer'}} onClick={() => this.showDeleteDialog(datum.username)} />
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
                                                     max={10}
                                                     step={1}
                                                     round="large"
                                                     values={[1,2]}
                                                     onChange={nextRange => {

                                                     }}
                                                   />
                                                </Stack>
                                                <Box align="center">
                                                   <Text size="xsmall" margin={{top: 'xsmall'}}>1 - 2 U</Text>
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
                                                      max={10}
                                                      step={1}
                                                      round="large"
                                                      values={[1,2]}
                                                      onChange={nextRange => {

                                                      }}
                                                    />
                                                </Stack>
                                                <Box align="center">
                                                    <Text size="xsmall" margin={{top: 'xsmall'}}>1 - 2 ports</Text>
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
                                                       max={10}
                                                       step={1}
                                                       round="large"
                                                       values={[1,2]}
                                                       onChange={nextRange => {

                                                       }}
                                                     />
                                                  </Stack>
                                                  <Box align="center">
                                                     <Text size="xsmall" margin={{top: 'xsmall'}}>1 - 2 ports</Text>
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
                                                        max={10}
                                                        step={1}
                                                        round="large"
                                                        values={[1,2]}
                                                        onChange={nextRange => {

                                                        }}
                                                      />
                                                   </Stack>
                                                   <Box align="center">
                                                      <Text size="xsmall" margin={{top: 'xsmall'}}>1 - 2 GB</Text>
                                                   </Box>
                                               </Box>
                                           </Box>
                                        <Box
                                             direction='row'
                                             alignSelf='stretch'
                                             width='medium'
                                             justify='center'
                                             margin={{top: 'medium', left: 'medium', right: 'medium'}} >
                                             <Button primary label="Apply filters" onClick={() => {}}
                                                />
                                        </Box>
                                   </Box>
                               </Box>
                           </Box>
                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>
                {this.state.showAddDialog && (
                    <Layer position="center" modal onClickOutside={this.hideAddModelDialog} onEsc={this.hideAddModelDialog}>
                        <Box pad="medium" gap="small" width="large">
                            <Heading level={4} margin="none">
                                Add Model
                            </Heading>
                            <p>Add a new model (uniquely identified by a vendor + model number combo) to the databse using this form.</p>

                            <Form>
                                <Box direction='row' justify='center' gap='medium'>
                                    <Box direction="column" pad='xsmall' gap="small" flex height={{max: 'medium'}} overflow={{vertical: 'scroll'}}>
                                        <TextInput style={{
                                                borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                                width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal'
                                            }}
                                            placeholder="Vendor"
                                            onChange={e => {
                                                const value = e.target.value
                                                this.setState(oldState => ({...oldState, vendor: value}))
                                            }}
                                            value={this.state.newUserUsername}
                                            title='Vendor'
                                            />
                                        <TextInput style={{
                                                borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                                width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                            }}
                                            placeholder="Model number"
                                            onChange={e => {
                                                const value = e.target.value
                                                this.setState(oldState => ({...oldState, modelNumber: value}))
                                            }}
                                            value={this.state.newUserEmail}
                                            title='Model number'
                                            />
                                        <TextInput style={{
                                                borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                                width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                            }}
                                            placeholder="Height"
                                            onChange={e => {
                                                const value = e.target.value
                                                this.setState(oldState => ({...oldState, height: value}))
                                            }}
                                            value={this.state.newUserEmail}
                                            title='Height'
                                            />
                                        <TextInput style={{
                                                borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                                width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                            }}
                                            placeholder="Ethernet ports"
                                            onChange={e => {
                                                const value = e.target.value
                                                this.setState(oldState => ({...oldState, ethernetPorts: value}))
                                            }}
                                            value={this.state.ethernetPorts}
                                            title='Ethernet ports'
                                            />
                                        <TextInput style={{
                                                borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                                width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                            }}
                                            placeholder="Power ports"
                                            onChange={e => {
                                                const value = e.target.value
                                                this.setState(oldState => ({...oldState, powerPorts: value}))
                                            }}
                                            value={this.state.powerPorts}
                                            title='Power ports'
                                            />
                                        <TextInput style={{
                                                borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                                width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                            }}
                                            placeholder="CPU"
                                            onChange={e => {
                                                const value = e.target.value
                                                this.setState(oldState => ({...oldState, CPU: value}))
                                            }}
                                            value={this.state.CPU}
                                            title='CPU'
                                            />
                                        <TextInput style={{
                                                borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                                width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                            }}
                                            placeholder="Memory"
                                            onChange={e => {
                                                const value = e.target.value
                                                this.setState(oldState => ({...oldState, memory: value}))
                                            }}
                                            value={this.state.memory}
                                            title='Memory'
                                            />
                                        <TextInput style={{
                                                borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                                width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                            }}
                                            placeholder="Storage"
                                            onChange={e => {
                                                const value = e.target.value
                                                this.setState(oldState => ({...oldState, storage: value}))
                                            }}
                                            value={this.state.storage}
                                            title='Storage'
                                            />
                                        <TextArea style={{
                                                borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                                width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                                minHeight: 100, marginBottom: 20
                                            }}
                                            placeholder="Comment"
                                            onChange={e => {
                                                const value = e.target.value
                                                this.setState(oldState => ({...oldState, comment: value}))
                                            }}
                                            value={this.state.comment}
                                            resize={false}
                                            title='Comment'
                                            />
                                    </Box>
                                    <Box>
                                        <SketchPicker disableAlpha
                                            color={ this.state.modelColor }
                                            onChange={color => {
                                                this.setState(oldState => ({...oldState, modelColor: color.hex}))
                                              }} />
                                    </Box>
                                </Box>
                                <Box
                                    margin={{top: 'medium'}}
                                    as="footer"
                                    gap="small"
                                    direction="row"
                                    align="center"
                                    justify="end" >
                                    <Button label="Add" type='submit' primary onClick={() => this.addModel()} />
                                    <Button
                                        label="Cancel"
                                        onClick={this.hideAddModelDialog}
                                        />
                                </Box>
                            </Form>
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
