import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { Anchor, Box, Button, DataTable, Grommet, Heading, Text, TextInput } from 'grommet'
import theme from '../theme'
import * as logutils from '../utils/logutils'

class LogScreen extends Component {
    startAfter = null
    itemNo = 1
    state = {
        searchQuery: '',
    }

    constructor(props) {
        super(props);
        this.state = {
            initialLoaded: false
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

    getTable(){
        if(!this.state.initialLoaded){
            return <Text>Please wait...</Text>
        } else {
            return <DataTable
                step={25}
                onMore={() => {
                    console.log("firing onmore")
                    logutils.getLogs(this.itemNo, this.startAfter, (logs, newStartAfter, itemNo) => {
                        this.startAfter = newStartAfter;
                        this.itemNo = itemNo
                        console.log(logs);
                        this.setState(oldState => (
                            {logs: this.state.logs.concat(logs)}
                        ))
                    })
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
                            property: 'date',
                            header: <Text size='small'>Date and Time (EST)</Text>,
                            render: datum => <Text size='small'>{datum.date}</Text>,
                            sortable: true,
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
                            if (datum.objectType == logutils.MODEL()) {
                                this.props.history.push('/models/'+datum.objectData.vendor+'/'+datum.objectData.modelNumber)
                            } else if (datum.objectType == logutils.ASSET()) {
                                this.props.history.push('/assets/'+datum.objectId)
                            }
                        }
                    })
                }}
            />
        }
    }

    render() {
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
          </Grommet>
        )
    }
}

export default LogScreen
