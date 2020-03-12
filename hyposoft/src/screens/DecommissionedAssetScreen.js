import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import BackButton from '../components/BackButton'
import UserMenu from '../components/UserMenu'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { Anchor,Box,Button,DataTable,Form,Grommet,Heading,Layer,RadioButtonGroup,Select,Stack,Menu,Text,TextInput } from 'grommet'
import { Filter, FormUp, FormDown } from "grommet-icons"
import {Redirect} from "react-router-dom";
import theme from '../theme'
import * as userutils from '../utils/userutils'
import * as decomutils from '../utils/decommissionutils'
import * as datacenterutils from "../utils/datacenterutils"

const styles = {
    TIStyle: {
        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#FFFFFF',
        width: '100%', paddingLeft: 20, fontWeight: 'normal'
    }
}

class DecommissionedAssetScreen extends Component {
    startAfter = null
    datacenters = []
    defaultAssets = []

    constructor(props) {
        super(props)
        this.state = {
          initialLoaded: false,
          popupType: "",
          searchQuery: '',
          sortField: "",
          sortAscending: true,
          rackSortChoice: "asc",//by default, will be ascending
          rackUSortChoice: "asc",
          datacentersLoaded: false,
          rangeStart: "",
          rangeEnd: ""
        }

        this.handleChangeRange = this.handleChangeRange.bind(this);
        this.handleRadioButtonChange = this.handleRadioButtonChange.bind(this);
        this.handleCombinedSort = this.handleCombinedSort.bind(this);
    }

    componentDidMount() {
        if (localStorage.getItem('tipShown') !== 'yes') {
            ToastsStore.info("Tip: Click on column headers to sort", 3000, 'burntToast')
            localStorage.setItem('tipShown', 'yes')
        }
        this.fetchDatacenters()
        this.init()
    }

    init() {
      decomutils.getAssets(this.startAfter, (assets, newStartAfter) => {
          this.startAfter = newStartAfter
          this.defaultAssets = assets
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

    restoreDefault() {
        this.setState({assets: this.defaultAssets})
    }

    handleFilter(start, end, datacenter) {
        console.log("triggered with " + start + " and " + end)
        let splitRackArrayStart = start.split(/(\d+)/);
        let rackRowStart = splitRackArrayStart[0];
        let rackNumStart = parseInt(splitRackArrayStart[1]);

        let splitRackArrayEnd = end.split(/(\d+)/);
        let rackRowEnd = splitRackArrayEnd[0];
        let rackNumEnd = parseInt(splitRackArrayEnd[1]);

        let newAssets = [];
        let splitRackArrayTemp, rackRowTemp, rackNumTemp;
        this.defaultAssets.forEach(asset => {
            splitRackArrayTemp = asset.rack.split(/(\d+)/);
            rackRowTemp = splitRackArrayTemp[0];
            rackNumTemp = parseInt(splitRackArrayTemp[1]);
            console.log("current asset: " + rackRowTemp.charCodeAt(0) + " " + rackNumTemp)
            console.log("rackRowTemp " + rackRowTemp + " rackNumTemp " + rackNumTemp)
            console.log("rackRowStart " + rackRowStart.charCodeAt(0) + " rackRowEnd " + rackRowEnd.charCodeAt(0) + " rackNumStart " + rackNumStart + " rackNumEnd " + rackNumEnd)
            /*if(rackRowTemp.charCodeAt(0) >= rackRowStart.charCodeAt(0) && rackRowTemp.charCodeAt(0) <= rackRowEnd.charCodeAt(0) && rackNumTemp >= rackNumStart && rackNumTemp <= rackNumEnd){
                console.log("found a match!")
                newInstances.push(asset);
            }*/
            if (datacenter === "All datacenters" || asset.datacenter === datacenter) {
                if ((rackRowTemp === rackRowStart && rackNumTemp >= rackNumStart) || (rackRowTemp === rackRowEnd && rackNumTemp <= rackNumEnd) || (rackRowTemp.charCodeAt(0) > rackRowStart.charCodeAt(0) && rackRowTemp.charCodeAt(0) < rackRowEnd.charCodeAt(0))) {
                    if (rackRowStart === rackRowEnd && rackRowEnd === rackRowTemp) {
                        if (rackNumTemp >= rackNumStart && rackNumTemp <= rackNumEnd) {
                            console.log("found a match!")
                            newAssets.push(asset);
                        }
                    } else {
                        console.log("found a match!")
                        newAssets.push(asset);
                    }
                }
            }
        })

        this.setState({assets: newAssets})
    }

    handleRackRackUSort(sortedAssets) {
        this.setState({assets: sortedAssets,searchQuery: ''})
    }

    handleChangeRange(event) {
        if (event.target.name === "rangeNumberStart") {
            console.log("start")
            this.setState({
                rangeStart: event.target.value
            }, function () {
                this.checkFilterDone();
            });
        } else if (event.target.name === "rangeNumberEnd") {
            console.log("end")
            this.setState({
                rangeEnd: event.target.value
            }, function () {
                this.checkFilterDone();
            });
        }
    }

    checkFilterDone(){
        if (/[A-Z]\d+/.test(this.state.rangeStart) && /[A-Z]\d+/.test(this.state.rangeEnd) && this.state.datacenter) {
            console.log("passed")
            this.handleFilter(this.state.rangeStart, this.state.rangeEnd, this.state.datacenter);
        } else {
            this.restoreDefault();
        }
    }

    handleRadioButtonChange(event) {
        if (event.target.name === "rackSortChoice") {
            console.log(event.target.value)
            this.setState({
                rackSortChoice: event.target.value
            });

        } else if (event.target.name === "rackUSortChoice") {
            console.log(event.target.value)
            this.setState({
                rackUSortChoice: event.target.value
            });
        }
    }

    handleCombinedSort(event) {
        let rackBool = this.state.rackSortChoice === "asc" ? true : false;
        let rackUBool = this.state.rackUSortChoice === "asc" ? true : false;

        if(this.state.rangeStart && this.state.rangeEnd && this.state.datacenter){
            ToastsStore.info("To sort by rack and rack U as well as filter by rack range, please sort by rack and rack U first before filtering by range.", 10000)
        }

        this.setState({
            datacenter: "",
            rangeStart: "",
            rangeEnd: ""
        });

        decomutils.sortAssetsByRackAndRackU(rackBool, rackUBool, sortedInst => {
            console.log("Will be sorting racks: " + this.state.rackSortChoice)
            console.log("Will be sorting rackU: " + this.state.rackUSortChoice)

            if (sortedInst) {
                this.handleRackRackUSort(sortedInst)
            } else {
                console.log("Done goofed somehow trying to sort")

            }

        })
    }

    generateDatacenters() {
        if (!this.state.datacentersLoaded) {
            return (<Menu
                label="Please wait..."
            />)
        } else {
            //console.log(this.datacenters)
            return (
                <Select
                    placeholder="Select a datacenter..."
                    options={this.datacenters}
                    value={this.state.datacenter}
                    onChange={(option) => {
                        this.setState({
                            datacenter: option.value
                        }, function () {
                            this.checkFilterDone();
                        });
                    }}
                />
            )
        }
    }

    fetchDatacenters() {
        let count = 0;
        datacenterutils.getAllDatacenterNames(names => {
            if (names.length) {
                names.forEach(name => {
                    this.datacenters.push(name);
                    count++;
                    if (count === names.length) {
                        this.datacenters.push(name);
                        this.datacenters.push("All datacenters")
                        //console.log(items)
                        this.setState({
                            datacentersLoaded: true
                        });
                    }
                })
            } else {
                console.log("no datacenters")
                this.datacenters.push("No datacenters exist.")
                this.setState({
                    datacentersLoaded: true
                });
            }
        })
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
                onClickRow={({datum}) => {
                    this.props.history.push('/decommissioned/' + datum.assetId)
                }}
            />
        }
    }

    render() {
        const {popupType} = this.state;
        let popup;
        if (localStorage.getItem('tipShown') !== 'yes') {
            ToastsStore.info("Tip: Click on column headers to sort", 3000, 'burntToast')
            localStorage.setItem('tipShown', 'yes')
        }

        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/'/>
        }
        if (popupType === 'Filters') {
            popup = (<Layer
                position="right"
                full="vertical"
                modal
                onClickOutside={() => this.setState({
                    popupType: ""
                })}
                onEsc={() => this.setState({
                    popupType: ""
                })}
            >
                <Box background='light-2' align={"center"}
                     fill="vertical"
                     overflow="auto"
                     pad="small">
                    {/* BEGNINNING OF FILTER BAR ==========*/}
                    <Box
                        align='center'
                        margin={{ left: 'small', right: 'small' }}
                        justify='start' >
                        {/* This box below is for range of racks */}
                        <Box style={{
                            borderRadius: 10,
                            borderColor: '#EDEDED'
                        }}
                             background='#FFFFFF'
                             width={"medium"}
                             margin={{ top: 'medium', left: 'medium', right: 'medium' }}
                             pad='small' >
                            <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column' justify='start'>
                                <Text size='small'><b>Filter By Rack Range</b></Text>
                                {this.generateDatacenters()}
                                <Stack margin={{ top: 'small', bottom: 'small' }}>
                                    <Box gap='small' direction="column" align='center' margin={{bottom: 'medium'}}>

                                        <TextInput style={styles.TIStyle2} name="rangeNumberStart" value={this.state.rangeStart} placeholder="eg. B1" size="xsmall" onChange={this.handleChangeRange} />
                                        <span>to</span>
                                        <TextInput style={styles.TIStyle2} name="rangeNumberEnd" value={this.state.rangeEnd} placeholder="eg. C21" size="xsmall" onChange={this.handleChangeRange} />
                                    </Box>

                                </Stack>
                            </Box>
                        </Box>
                        {/* Box for Combined Rack and Rack U sort */}
                        <Box style={{
                            borderRadius: 10,
                            borderColor: '#EDEDED'
                        }}
                             direction='row'
                             alignSelf='stretch'
                             background='#FFFFFF'
                             width={"medium"}
                             margin={{ top: 'medium', left: 'medium', right: 'medium' }}
                             pad='xxsmall' >
                            <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column' justify='start'>
                                <Stack >
                                    <Box gap='small' direction="column" margin='small'>
                                        {/* Put sort buttons here */}
                                        <Text size='small'><b>Rack</b></Text>
                                        <Box direction="row" justify="start" margin="small">
                                            <RadioButtonGroup
                                                label="Rack"
                                                name="rackSortChoice"
                                                value={this.state.rackSortChoice}
                                                options={[
                                                    { label: "Ascending", value: "asc" },
                                                    { label: "Descending", value: "desc" },
                                                ]}
                                                onClick={e => {
                                                    this.value = e.target.value
                                                    this.setState(oldState => ({ ...oldState, rackSortChoice: this.value }))
                                                    this.handleRadioButtonChange(e)
                                                }}
                                            />
                                        </Box>
                                        <Text size='small'><b>Rack U</b></Text>
                                        <Box direction="row" justify="start" margin="small">
                                            <RadioButtonGroup
                                                label="Rack"
                                                name="rackUSortChoice"
                                                value={this.state.rackUSortChoice}
                                                options={[
                                                    { label: "Ascending", value: "asc" },
                                                    { label: "Descending", value: "desc" },

                                                ]}
                                                onClick={e => {
                                                    this.value = e.target.value
                                                    this.setState(oldState => ({ ...oldState, rackUSortChoice: this.value }))
                                                    this.handleRadioButtonChange(e)
                                                }}
                                            />
                                        </Box>
                                        <Box direction="column" justify="center" margin={{top: 'small', bottom: 'medium'}}>
                                            <Button label={<Text size="small"> Apply</Text>} onClick={this.handleCombinedSort}/>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Box>
                        </Box>
                        <Box style={{
                            borderRadius: 10,
                            borderColor: '#EDEDED'
                        }}
                             direction='row'
                             alignSelf='stretch'
                             background='#FFFFFF'
                             width={"medium"}
                             margin={{ top: 'medium', left: 'medium', right: 'medium' }}
                             pad='small' >
                            <Box flex margin={{ left: 'medium', top: 'small', right: 'medium' }} direction='column' justify='start'>
                                {/*<Box direction="column" width={"medium"} margin={{top: 'small'}}>*/}
                                <Button label={<Text size="small">Close</Text>} margin={{top: 'small', bottom: 'medium'}} onClick={() => {
                                    this.setState({
                                        popupType: ""
                                    })
                                }}/>
                                {/* <Button icon={<Share/>} label={<Text size="small">Export Filtered Assets</Text>} onClick={() => {
                                    bulkassetutils.exportFilteredAssets(this.state.searchResults || this.assetTable.current.state.assets);
                                }} style={{marginBottom: "10px"}}/>
                                <Button icon={<Share/>} label={<Text size="small">Export Filtered Connections</Text>} onClick={() => {
                                    bulkconnectionstutils.exportFilteredConnections(this.state.searchResults || this.assetTable.current.state.assets);
                                }} margin={{bottom: 'medium'}}/>
                                */}
                            </Box>
                        </Box>
                    </Box>
                    {/* END OFF FILTER BAR ================= */}
                </Box>
            </Layer>);
        }
        return (
          <Grommet theme={theme} full className='fade'>
              <Box fill background='light-2'>
                  {popup}
                  <AppBar>
                      <BackButton alignSelf='start' this={this}/>
                      <Heading alignSelf='center' level='4' margin={{
                          top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                      }} >Decommissioned Assets</Heading>
                      <UserMenu alignSelf='end' this={this} />
                  </AppBar>
                  <Button primary icon={<Filter size={"medium"}/>}
                          onClick={() => this.setState({popupType: 'Filters'})}
                  style={{
                      borderRadius: '100%',
                      padding: '12px',
                      position: "absolute",
                      right: "2%",
                      bottom: "2%"
                  }}/>

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
