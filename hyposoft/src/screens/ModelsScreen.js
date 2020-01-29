import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import * as modelutils from '../utils/modelutils'
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
            this.setState({models: docSnaps.docs.map(doc => (
                {...doc.data()}
            ))})
        })
    }

    componentWillMount() {
        this.init()
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
                                                                    property: 'dummy',
                                                                    render: datum => (
                                                                    <FormTrash style={{cursor: 'pointer'}} onClick={() => this.showDeleteDialog(datum.username)} />
                                                                ),
                                                                    align: 'center',
                                                                    header: <Text size='small'>Delete</Text>,
                                                                    sortable: false
                                                                }
                                                            ].map(col => ({ ...col }))
                                                        }
                                                        data={this.state.models}
                                                        sortable={true}
                                                        size="medium"
                                                    />
                                                </Box>
                                           </Box>
                                       </Box>
                                       <Button primary icon={<Add />} label="Add model" alignSelf='center' onClick={this.addModelDialog} />
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
