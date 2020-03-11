import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import BackButton from '../components/BackButton'
import UserMenu from '../components/UserMenu'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { Anchor, Box, Button, DataTable, Form, Grommet, Heading, Text, TextInput } from 'grommet'
import { FormUp, FormDown } from "grommet-icons"
import {Redirect} from "react-router-dom";
import theme from '../theme'
import * as userutils from '../utils/userutils'
import * as decomutils from '../utils/decommissionutils'

const styles = {
    TIStyle: {
        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#FFFFFF',
        width: '100%', paddingLeft: 20, fontWeight: 'normal'
    }
}

class DecommissionedAssetScreen extends Component {
    startAfter = null

    constructor(props) {
        super(props)
        this.state = {
          initialLoaded: false,
          searchQuery: '',
          sortField: "",
          sortAscending: true
        }
    }

    componentDidMount() {
        this.init()
    }

    init() {
      decomutils.getAssets(this.startAfter, (assets, newStartAfter) => {
          this.startAfter = newStartAfter;
          this.setState(oldState => (
              {...oldState, assets: assets, initialLoaded: true, sortField: '', sortAscending: true}
          ))
      },this.state.searchQuery)
    }

    setSort(field) {
        let newSort;
        if (this.state.sortField && this.state.sortField === field) {
            //reverse direction
            this.setState({
                sortAscending: !this.state.sortAscending
            });
            newSort = !this.state.sortAscending;
        } else {
            //start with ascending
            this.setState({
                sortField: field,
                sortAscending: true
            });
            newSort = true;
        }

        this.startAfter = null;
        this.setState({
            assets: [],
            initialLoaded: false,
            searchQuery: ''
        });
        decomutils.sortAssets(this.startAfter,(assets, newStartAfter) => {
            this.startAfter = newStartAfter;
            this.setState({assets: assets, initialLoaded: true})
        }, field, newSort)
    }

    search() {
        this.startAfter = null
        if (this.state.searchQuery.trim() === '') {
            this.setState({
                initialLoaded: false
            }, function () {
                this.init()
                return
            })
        }
        this.init()
    }

    getTable(){
        if(!this.state.initialLoaded){
            return <Text>Please wait...</Text>
        } else {
            return <DataTable
                step={500}
                onMore={() => {
                    if (this.state.searchQuery) {
                        this.init()
                    } else {
                        decomutils.sortAssets(this.startAfter, (assets, newStartAfter) => {
                            this.startAfter = newStartAfter;
                            this.setState(oldState => (
                                {assets: this.state.assets.concat(assets)}
                            ))
                        },this.state.sortField,this.state.sortAscending)
                    }
                }}
                columns={
                    [
                        {
                            property: 'date',
                            header: <Text size='small'
                            onClick={() => {
                                this.setSort("timestamp")
                            }} style={{cursor: "pointer"}}
                            >Date and Time (EST){
                              this.state.sortField === 'timestamp' && (this.state.sortAscending ? <FormDown /> : <FormUp />)
                            }</Text>,
                            render: datum => <Text size='small'>{datum.date}</Text>,
                        },
                        {
                            property: 'assetId',
                            header: <Text size='small'
                            onClick={() => {
                                this.setSort("assetId")
                            }} style={{cursor: "pointer"}}
                            >Asset ID{
                              this.state.sortField === 'assetId' && (this.state.sortAscending ? <FormDown /> : <FormUp />)
                            }</Text>,
                            primary: true,
                            render: datum => <Text size='small'>{datum.assetId}</Text>
                        },
                        {
                            property: 'model',
                            header: <Text size='small'
                            onClick={() => {
                                this.setSort("model")
                            }} style={{cursor: "pointer"}}
                            >Model   {
                              this.state.sortField === 'model' && (this.state.sortAscending ? <FormDown /> : <FormUp />)
                            }</Text>,
                            render: datum => <Text size='small'>{datum.model}</Text>,
                        },
                        {
                            property: 'hostname',
                            header: <Text size='small'
                            onClick={() => {
                                this.setSort("hostname")
                            }} style={{cursor: "pointer"}}
                            >Hostname  {
                              this.state.sortField === 'hostname' && (this.state.sortAscending ? <FormDown /> : <FormUp />)
                            }</Text>,
                            render: datum => <Text wordBreak="break-all"size='small'>{datum.hostname}</Text>,
                        },
                        {
                            property: 'rack',
                            header: <Text size='small'
                            onClick={() => {
                                this.setSort("rack")
                            }} style={{cursor: "pointer"}}
                            >Rack  {
                              this.state.sortField === 'rack' && (this.state.sortAscending ? <FormDown /> : <FormUp />)
                            }</Text>,
                            render: datum => <Text size='small'>{datum.rack}</Text>,
                        },
                        {
                            property: 'rackU',
                            header: <Text size='small'
                            onClick={() => {
                                this.setSort("rackU")
                            }} style={{cursor: "pointer"}}
                            >Rack U  {
                              this.state.sortField === 'rackU' && (this.state.sortAscending ? <FormDown /> : <FormUp />)
                            }</Text>,
                            render: datum => <Text size='small'>{datum.rackU}</Text>,
                        },
                        {
                            property: 'name',
                            header: <Text size='small'
                            onClick={() => {
                                this.setSort("name")
                            }} style={{cursor: "pointer"}}
                            >Demoted By  {
                              this.state.sortField === 'name' && (this.state.sortAscending ? <FormDown /> : <FormUp />)
                            }</Text>,
                            render: datum => <Text size='small'>{datum.name}</Text>,
                        },
                        {
                            property: 'owner',
                            header: <Text size='small'
                            onClick={() => {
                                this.setSort("owner")
                            }} style={{cursor: "pointer"}}
                            >Owner  {
                              this.state.sortField === 'owner' && (this.state.sortAscending ? <FormDown /> : <FormUp />)
                            }</Text>,
                            render: datum => <Text size='small'>{datum.owner}</Text>,
                        },
                        {
                            property: 'datacenterAbbrev',
                            header: <Text size='small'
                            onClick={() => {
                                this.setSort("datacenterAbbrev")
                            }} style={{cursor: "pointer"}}
                            > Datacenter Abbrev.  {
                              this.state.sortField === 'datacenterAbbrev' && (this.state.sortAscending ? <FormDown /> : <FormUp />)
                            }</Text>,
                            render: datum => <Text size='small'>
                                {datum.datacenterAbbrev}
                            </Text>,
                        },
                    ]
                }
                data={this.state.assets}
                sortable={true}
                size="medium"
                // Decommissioned detail view
                // onClickRow={({datum}) => {
                //     logutils.doesObjectStillExist(datum.objectType,datum.objectId,exists => {
                //         if (exists) {
                //             if (datum.objectType === logutils.MODEL()) {
                //                 this.props.history.push('/models/'+datum.currentData.vendor+'/'+datum.currentData.modelNumber)
                //             } else if (datum.objectType === logutils.ASSET()) {
                //                 this.props.history.push('/assets/'+datum.objectId)
                //             } else {
                //                 ToastsStore.error(datum.objectType+' does not have a detailed view', 3000)
                //             }
                //         } else {
                //             ToastsStore.error(datum.objectType+' does not exist anymore', 3000)
                //         }
                //     })
                // }}
            />
        }
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/'/>
        }
        return (
          <Grommet theme={theme} full className='fade'>
              <Box fill background='light-2'>
                  <AppBar>
                      <BackButton alignSelf='start' this={this}/>
                      <Heading alignSelf='center' level='4' margin={{
                          top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                      }} >Decommissioned Assets</Heading>
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
                                                placeholder="Search for assets (type your query and press enter)"
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
                                                 {this.getTable()}
                                              </Box>
                                         </Box>
                                     </Box>
                                 </Box>
                             </Box>
                         </Box>
                     </Box>
              </Box>
              <ToastsContainer store={ToastsStore}/>
          </Grommet>
        )
    }
}

export default DecommissionedAssetScreen
