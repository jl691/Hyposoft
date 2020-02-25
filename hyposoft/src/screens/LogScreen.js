import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import {Redirect} from "react-router-dom";
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { Box, DataTable, Form, Grommet, Heading, Text, TextInput } from 'grommet'
import theme from '../theme'
import * as userutils from '../utils/userutils'
import * as logutils from '../utils/logutils'

const styles = {
    TIStyle: {
        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#FFFFFF',
        width: '100%', paddingLeft: 20, fontWeight: 'normal'
    }
}

// const algoliasearch = require('algoliasearch')
// const client = algoliasearch('V7ZYWMPYPA', '89a91cdfab76a8541fe5d2da46765377')
// const index = client.initIndex('logs')

class LogScreen extends Component {
    startAfter = null
    itemNo = 1

    constructor(props) {
        super(props);
        this.state = {
            initialLoaded: false,
            searchQuery: ''
        }
    }


    componentDidMount() {
        this.init()
    }

    init() {
      logutils.getLogs(this.itemNo, this.startAfter, (logs, newStartAfter, itemNo) => {
          this.startAfter = newStartAfter;
          this.itemNo = itemNo
          this.setState(oldState => (
              {...oldState, logs: logs, initialLoaded: true}
          ))
      })
    }

    search() {
        this.startAfter = null
        this.itemNo = 1
        if (this.state.searchQuery.trim() === '') {
            this.setState({
                initialLoaded: false
            }, function () {
                this.init()
                return
            })
        }
        logutils.filterLogsFromName(this.state.searchQuery, this.itemNo, this.startAfter, (logs, newStartAfter, itemNo) => {
            this.startAfter = newStartAfter
            this.itemNo = itemNo
            this.setState(oldState => (
                {...oldState, logs: logs, initialLoaded: true}
            ))
        })
        // index.search(this.state.searchQuery)
        // .then(({ hits }) => {
        //     var models = []
        //     var itemNo = 1
        //     this.startAfter = null
        //     for (var i = 0; i < hits.length; i++) {
        //         if (modelutils.matchesFilters(hits[i], this.state.filters)) {
        //             models = [...models, {...hits[i], id: hits[i].objectID, itemNo: itemNo++}]
        //         }
        //     }
        //     this.setState(oldState => ({
        //         ...oldState,
        //         models: models
        //     }))
        // })
    }

    getTable(){
        if(!this.state.initialLoaded){
            return <Text>Please wait...</Text>
        } else {
            return <DataTable
                step={100}
                onMore={() => {
                    logutils.filterLogsFromName(this.state.searchQuery,this.itemNo, this.startAfter, (logs, newStartAfter, itemNo) => {
                        this.startAfter = newStartAfter;
                        this.itemNo = itemNo
                        this.setState(oldState => (
                            {logs: this.state.logs.concat(logs)}
                        ))
                    })
                }}
                columns={
                    [
                        {
                            property: 'itemNo',
                            header: <Text size='small'>Date and Time (EST)</Text>,
                            render: datum => <Text size='small'>{'['+datum.itemNo+'] '+datum.date}</Text>,
                            primary: true,
                            sortable: false,
                        },
                        {
                            property: 'log',
                            header: <Text size='small'>Information</Text>,
                            render: datum => <Text size='small'>{datum.log}</Text>,
                            sortable: false,
                        }
                    ]
                }
                data={this.state.logs}
                sortable={true}
                size="medium"
                onClickRow={({datum}) => {
                    logutils.doesObjectStillExist(datum.objectType,datum.objectId,exists => {
                        if (exists) {
                            if (datum.objectType === logutils.MODEL()) {
                                this.props.history.push('/models/'+datum.currentData.vendor+'/'+datum.currentData.modelNumber)
                            } else if (datum.objectType === logutils.ASSET()) {
                                this.props.history.push('/assets/'+datum.objectId)
                            } else {
                                ToastsStore.error(datum.objectType+' does not have a detailed view', 3000)
                            }
                        } else {
                            ToastsStore.error(datum.objectType+' does not exist anymore', 3000)
                        }
                    })
                }}
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
                      <HomeButton alignSelf='start' this={this} />
                      <Heading alignSelf='center' level='4' margin={{
                          top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                      }} >Logs</Heading>
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
                                                placeholder="Search for logs by user or asset (type your query and press enter)"
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
              <ToastsContainer store={ToastsStore} lightBackground/>
          </Grommet>
        )
    }
}

export default LogScreen
