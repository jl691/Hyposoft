import React from 'react'
import AppBar from '../components/AppBar'
import HomeMenu from '../components/HomeMenu'
import UserMenu from '../components/UserMenu'
import ModelSettingsLayer from '../components/ModelSettingsLayer'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import * as modelutils from '../utils/modelutils'
import * as firebaseutils from '../utils/firebaseutils'
import * as userutils from '../utils/userutils'


import {
    Box,
    Button,
    DataTable,
    Form,
    Grommet,
    Heading,
    Layer,
    Text,
    TextInput,
    RangeSelector,
    Stack } from 'grommet'

import { Add, FormEdit, FormTrash, FormUp, FormDown, Share } from "grommet-icons"
import theme from '../theme'

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('models')

class ModelsScreen extends React.Component {
    defaultFilters = {
        networkPortsFilterEnd: 100,
        networkPortsFilterStart: 0,
        heightFilterEnd: 42,
        heightFilterStart: 0,
        powerFilterEnd: 10,
        powerFilterStart: 0,
        networkPortsFilterMax: 100,
        powerFilterMax: 10,
        memoryFilterMax: 1000,
        memoryFilterStart: 0,
        memoryFilterEnd: 1000,
        filters: {
            heightStart: 0, heightEnd: 42,
            networkPortsStart: 0, networkPortsEnd: 100,
            memoryStart: 0, memoryEnd: 1000,
            powerPortsStart: 0, powerPortsEnd: 10
        }
    }
    state = {
        searchQuery: '',
        networkPortsFilterEnd: 100,
        networkPortsFilterStart: 0,
        heightFilterEnd: 42,
        heightFilterStart: 0,
        powerFilterEnd: 10,
        powerFilterStart: 0,
        networkPortsFilterMax: 100,
        powerFilterMax: 10,
        memoryFilterMax: 1000,
        memoryFilterStart: 0,
        memoryFilterEnd: 1000,
        heightFilterMax: 42,
        filters: {
            heightStart: 0, heightEnd: 42,
            networkPortsStart: 0, networkPortsEnd: 100,
            memoryStart: 0, memoryEnd: 1000,
            powerPortsStart: 0, powerPortsEnd: 10
        },
        initialLoaded: false,
        sortField: "",
        sortAscending: ""
    }

    itemNo = 1;
    prefilterState;

    search () {
        if (this.state.searchQuery.trim() === '') {
            this.init()
            return
        }
        index.search(this.state.searchQuery)
        .then(({ hits }) => {
            var models = []
            var itemNo = 1
            console.log(hits)
            this.startAfter = null
            for (var i = 0; i < hits.length; i++) {
                if (modelutils.matchesFilters(hits[i], this.state.filters)) {
                    models = [...models, {...hits[i], id: hits[i].objectID, itemNo: itemNo++}]
                }
            }
            this.setState(oldState => ({
                ...oldState,
                models: models
            }))
        })
    }

    startAfter = null

    init() {
        this.prefilterState = this.state;
        this.itemNo = 1;
        if (this.state.searchQuery.trim() !== '') {
            this.search()
            return
        }
        firebaseutils.modelsRef
        .orderBy('vendor').orderBy('modelNumber')
        .get()
        .then(docSnaps => {
            var models = []
            var itemNo = 1
            for (var i = 0; i < docSnaps.docs.length; i++) {
                if (modelutils.matchesFilters(docSnaps.docs[i].data(), this.state.filters)) {
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
                } else {
                    console.log(docSnaps.docs[i].data())
                }
            }

            this.startAfter = null
            this.setState(oldState => ({
                ...oldState,
                models: models
            }))
        })
    }

    componentDidMount() {
        // this.init()
        this.setState({
            initialLoaded: false
        });
        this.itemNo = 1;
        let models = [];
        firebaseutils.modelsRef.orderBy("vendor").orderBy("modelNumber").limit(25).get().then(docSnaps => {
            if(docSnaps.empty){
                this.setState({
                    initialLoaded: true
                })
            } else {
                this.startAfter = docSnaps.docs[docSnaps.docs.length - 1];
                docSnaps.forEach(doc => {
                    models.push({
                        ...doc.data(),
                        id: doc.id,
                        itemNo: this.itemNo++
                    })
                    if(models.length === docSnaps.size){
                        this.setState({
                            models: models,
                            initialLoaded: true
                        })
                    }
                })
            }
        })
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
        if (!userutils.doesLoggedInUserHaveModelPerm()) {
            ToastsStore.info('Only users with model management permission can do this', 3000, 'burntToast')
            return
        }

        this.setState(currState => (
            {...currState, showAddDialog: true, showEditDialog: false, showDeleteDialog: false}
        ))
    }

    hideAddModelDialog() {
        this.setState(currState => (
            {...currState, showAddDialog: false}
        ))
    }

    showEditDialog(itemNo) {
        if (!userutils.doesLoggedInUserHaveModelPerm()) {
            ToastsStore.info('Only users with model management permission can do this', 3000, 'burntToast')
            return
        }

        this.modelToEdit = this.state.models[itemNo-1]

        this.setState(currState => (
            {...currState, showEditDialog: true, showAddDialog: false, showDeleteDialog: false}
        ))
    }

    hideEditDialog() {
        this.setState(currState => (
            {...currState, showEditDialog: false}
        ))
    }

    showDeleteDialog(itemNo) {
        if (!userutils.doesLoggedInUserHaveModelPerm()) {
            ToastsStore.info('Only users with model management permission can do this', 3000, 'burntToast')
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
        if (!userutils.doesLoggedInUserHaveModelPerm()) {
            ToastsStore.info('Only users with model management permission can do this', 3000, 'burntToast')
            return
        }

        modelutils.doesModelHaveAssets(this.modelToDelete.id, yes => {
            if (yes) {
                ToastsStore.info("Can't delete model with live assets", 3000, 'burntToast')
                this.hideDeleteDialog()
                return
            }

            modelutils.deleteModel(this.modelToDelete.id, () => {
                ToastsStore.info("Model deleted", 3000, 'burntToast')
                this.init()
                this.hideDeleteDialog()
                index.deleteObject(this.modelToDelete.id)
            })

        })
    }

    colors={}

    getDatatable(){
        const adminColumns = userutils.doesLoggedInUserHaveModelPerm() ? [{
            property: 'dummy',
            render: datum => (
                <FormEdit style={{cursor: 'pointer', backgroundColor: this.colors[datum.itemNo+'_edit_color']}} onClick={(e) => {
                    e.persist()
                    e.nativeEvent.stopImmediatePropagation()
                    e.stopPropagation()
                    this.showEditDialog(datum.itemNo)
                }} onMouseOver={e => this.colors[datum.itemNo+'_edit_color']='#dddddd'}
                 onMouseLeave={e => this.colors[datum.itemNo+'_edit_color']=''} />
            ),
            align: 'center',
            header: <Text size='small'>Edit</Text>,
            sortable: false
        },
            {
                property: 'dummy2',
                render: datum => (
                    <FormTrash style={{cursor: 'pointer', backgroundColor: this.colors[datum.itemNo+'_delete_color']}} onClick={(e) => {
                        e.persist()
                        e.nativeEvent.stopImmediatePropagation()
                        e.stopPropagation()
                        this.showDeleteDialog(datum.itemNo)
                    }} onMouseOver={e => this.colors[datum.itemNo+'_delete_color']='#dddddd'}
                     onMouseLeave={e => this.colors[datum.itemNo+'_delete_color']=''} />
                ),
                align: 'center',
                header: <Text size='small'>Delete</Text>,
                sortable: false
            }] : [];

        if(!this.state.initialLoaded){
            return (<Text>Please wait...</Text>);
        } else {
            return (<DataTable
                step={25}
                onMore={() => {
                    console.log("eyyyyyyyyyyyyyyyyyyy")
                    if (this.startAfter) {
                        console.log("getting more models")

                        if (this.state.sortField) {
                            modelutils.getModels(this.itemNo, this.startAfter, (newItemNo, models, newStartAfter) => {
                                this.startAfter = newStartAfter;
                                this.itemNo = newItemNo;
                                this.setState(oldState => (
                                    {...oldState, models: [...oldState.models, ...models]}
                                ))
                            }, this.state.filters, this.state.sortField, this.state.sortAscending)
                        } else {
                            modelutils.getModels(this.itemNo, this.startAfter, (newItemNo, models, newStartAfter) => {
                                this.startAfter = newStartAfter;
                                this.itemNo = newItemNo;
                                this.setState(oldState => (
                                    {...oldState, models: [...oldState.models, ...models]}
                                ))
                            }, this.state.filters)
                        }

                    }
                }}
                columns={
                    [
                        {
                            property: 'itemNo',
                            header: <Text size='small'>#</Text>,
                            render: datum => <Text size='small'>{datum.itemNo}</Text>,
                            primary: true
                        },
                        {
                            property: 'vendor',
                            header: <Text size='small' onClick={() => {
                                this.setSort("vendor")
                            }} style={{cursor: "pointer"}}>Vendor  {this.state.sortField === 'vendor' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                            render: datum => <Text size='small'>{datum.vendor}</Text>
                        },
                        {
                            property: 'modelNumber',
                            header: <Text size='small' onClick={() => {
                                this.setSort("modelNumber")
                            }} style={{cursor: "pointer"}}>Model #  {this.state.sortField === 'modelNumber' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                            render: datum => <Text size='small'>{datum.modelNumber}</Text>
                        },
                        {
                            property: 'cpu',
                            header: <Text size='small' onClick={() => {
                                this.setSort("cpu")
                            }} style={{cursor: "pointer"}}>CPU  {this.state.sortField === 'cpu' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                            render: datum => <Text size='small'>{datum.cpu}</Text>
                        },
                        {
                            property: 'storage',
                            header: <Text size='small' onClick={() => {
                                this.setSort("storage")
                            }} style={{cursor: "pointer"}}>Storage   {this.state.sortField === 'storage' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                            render: datum => <Text size='small'>{datum.storage}</Text>
                        },
                        {
                            property: 'height',
                            header: <Text size='small' onClick={() => {
                                this.setSort("height")
                            }} style={{cursor: "pointer"}}>Height   {this.state.sortField === 'height' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                            render: datum => <Text size='small'>{datum.height}</Text>
                        },
                        {
                            property: 'networkPorts',
                            header: <Text size='small' onClick={() => {
                                this.setSort("networkPortsCount")
                            }} style={{cursor: "pointer"}}>Network ports #   {this.state.sortField === 'networkPortsCount' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                            render: datum => <Text size='small'>{datum.networkPortsCount}</Text>
                        },
                        {
                            property: 'portPorts',
                            header: <Text size='small' onClick={() => {
                                this.setSort("powerPorts")
                            }} style={{cursor: "pointer"}}>Power ports #   {this.state.sortField === 'powerPorts' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                            render: datum => <Text size='small'>{datum.powerPorts}</Text>
                        },
                        {
                            property: 'memory',
                            header: <Text size='small' onClick={() => {
                                this.setSort("memory")
                            }} style={{cursor: "pointer"}}>Memory  {this.state.sortField === 'memory' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                            render: datum => <Text size='small'>{datum.memory}</Text>
                        },
                        ...adminColumns
                    ]
                }
                data={this.state.models}
                size="medium"
                onClickRow={({datum}) => {
                    this.props.history.push('/models/'+datum.vendor+'/'+datum.modelNumber)
                }}
            />);
        }
    }

    setSort(field) {
        let newSort;
        if (this.state.sortField && this.state.sortField === field) {
            //reverse direction
            this.setState({
                sortAscending: !this.state.sortAscending,
                initialLoaded: false,
            });
            newSort = !this.state.sortAscending;
        } else {
            //start with ascending
            this.setState({
                sortField: field,
                sortAscending: true,
                initialLoaded: false,
            });
            newSort = true;
        }

        this.startAfter = null;
        this.setState({
            models: [],
            initialLoaded: false,
        });

        console.log("111")
        this.itemNo = 1;
        modelutils.getModels(this.itemNo, null,(newItemNo, newModels, newStartAfter) => {
            console.log(newModels)
            console.log(newStartAfter)
            if (newStartAfter && newModels) {
                console.log("222")
                this.itemNo = newItemNo;
                this.startAfter = newStartAfter;
                this.setState({models: newModels, initialLoaded: true})
            }
        }, this.state.filters, field, newSort)
    }

    render() {
        if (localStorage.getItem('tipShown') !== 'yes') {
            ToastsStore.info("Tip: Click on column headers to sort", 3000, 'burntToast')
            localStorage.setItem('tipShown', 'yes')
        }

        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill background='light-2'>
                    <AppBar>
                        <HomeMenu alignSelf='start' this={this} />
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
                                   <Box width='xlarge' direction='column' align='stretch' justify='start'>
                                   <Box margin={{top: 'medium'}}>
                                       <Form onSubmit={() => this.search()}>
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
                                        </Form>
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
                                                   {this.getDatatable()}
                                                </Box>
                                           </Box>
                                       </Box>
                                       {userutils.doesLoggedInUserHaveModelPerm() && (
                                           <Box
                                            direction='row'
                                            alignSelf='stretch'
                                            justify='center'
                                            gap='small' >
                                                <Button primary icon={<Add />} label="Add model" alignSelf='center' onClick={this.showAddModelDialog} />
                                                <Button icon={<Share/>} label="Export currently filtered entries" alignSelf='center' onClick={() => {modelutils.exportFilteredModels(this.state.models)}} />
                                            </Box>
                                       )}
                                   </Box>
                                   <Box
                                       width='small'
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
                                                     max={this.state.heightFilterMax}
                                                     step={1}
                                                     round="large"
                                                     values={[this.state.heightFilterStart,this.state.heightFilterEnd]}
                                                     onChange={nextRange => {
/*                                                         var newMax = this.state.heightFilterMax
                                                         if (nextRange[1] === this.state.heightFilterMax) {
                                                             newMax = parseInt(newMax*1.1)
                                                         }*/

                                                         this.setState(oldState => ({
                                                             ...oldState, heightFilterStart: nextRange[0],
                                                             heightFilterEnd: nextRange[1],
                                                             //heightFilterMax: newMax,
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
                                                 <Text size='small'><b>Network ports range</b></Text>
                                                 <Stack margin={{top: 'small'}}>
                                                    <Box background="light-4" height="10px" direction="row" round="large" />
                                                    <RangeSelector
                                                      direction="horizontal"
                                                      min={0}
                                                      max={this.state.networkPortsFilterMax}
                                                      step={1}
                                                      round="large"
                                                      values={[this.state.networkPortsFilterStart,this.state.networkPortsFilterEnd]}
                                                      onChange={nextRange => {
/*                                                          var newMax = this.state.networkPortsFilterMax
                                                          if (nextRange[1] === this.state.networkPortsFilterMax) {
                                                              newMax = parseInt(newMax*1.1)
                                                          }*/

                                                          this.setState(oldState => ({
                                                              ...oldState, networkPortsFilterStart: nextRange[0],
                                                              networkPortsFilterEnd: nextRange[1],
                                                              // networkPortsFilterMax: newMax,
                                                              filters: {...oldState.filters, networkPortsStart: nextRange[0], networkPortsEnd: nextRange[1]}
                                                          }))
                                                      }}
                                                    />
                                                </Stack>
                                                <Box align="center">
                                                    <Text size="xsmall" margin={{top: 'xsmall'}}>{this.state.networkPortsFilterStart} - {this.state.networkPortsFilterEnd} ports</Text>
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
/*                                                           var newMax = this.state.powerFilterMax
                                                           if (nextRange[1] === this.state.powerFilterMax) {
                                                               newMax = parseInt(newMax*1.1)
                                                           }*/

                                                           this.setState(oldState => ({
                                                               ...oldState, powerFilterStart: nextRange[0],
                                                               powerFilterEnd: nextRange[1],
                                                               // powerFilterMax: newMax,
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
/*                                                            var newMax = this.state.memoryFilterMax
                                                            if (nextRange[1] === this.state.memoryFilterMax) {
                                                                newMax = parseInt(newMax*1.1)
                                                            }*/

                                                            this.setState(oldState => ({
                                                                ...oldState, memoryFilterStart: nextRange[0],
                                                                memoryFilterEnd: nextRange[1],
                                                                // memoryFilterMax: newMax,
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
                                                this.setState({
                                                    ...this.prefilterState
                                                })
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
