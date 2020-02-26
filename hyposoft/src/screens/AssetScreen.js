import React, {Component} from 'react'
import {BrowserRouter as Router, Route} from 'react-router-dom'

import {
    Text,
    Button,
    Layer,
    Form,
    Grommet,
    Heading,
    Box,
    TextInput,
    RadioButtonGroup,
    Stack,
    Menu,
    Select
} from 'grommet'
import {Add, Filter} from 'grommet-icons'
import AddAssetForm from '../components/AddAssetForm'
import DeleteAssetPopup from '../components/DeleteAssetPopup'
import EditAssetForm from '../components/EditAssetForm'

import theme from '../theme'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import AssetTable from '../components/AssetTable'
import * as userutils from "../utils/userutils";
import * as assetutils from "../utils/assetutils";
import {ToastsContainer, ToastsStore} from "react-toasts";
import * as datacenterutils from "../utils/datacenterutils";

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '89a91cdfab76a8541fe5d2da46765377')
const index = client.initIndex('assets')

class AssetScreen extends Component {

    rackSort;
    rackUSort;
    datacenters = [];

    constructor(props) {
        super(props);
        this.state = {
            assets: [],
            sortedAssets: [],
            popupType: "",
            deleteID: "",
            deleteModel: "",
            deleteHostname: "",
            updateID: "",
            initialLoaded: false,
            updateModel: "",
            updateHostname: "",
            updateRack: "",
            updateRackU: "",
            updateOwner: "",
            updateComment: "",
            updateDatacenter: "",
            rangeNumberStart: "",
            rangeNumberEnd: "",
            rackSortChoice: "asc",//by default, will be ascending
            rackUSortChoice: "asc",
            searchQuery: "",
            updateDatacenter: "",
            updateAsset_id:"",
            updateMacAddresses: [
                {
                    networkPort: "",
                    macAddress: ""
                }
            ],
            updateNetworkConnections: [
                {
                    otherAssetID: "",
                    otherPort: "",
                    thisPort: ""
                }
            ],
            updatePowerConnections: [{
                pduSide: "",
                port: ""
            }],
            datacentersLoaded: false,
            rangeStart: "",
            rangeEnd: ""
        }

        this.handleCancelPopupChange = this.handleCancelPopupChange.bind(this);
        this.handleCancelRefreshPopupChange = this.handleCancelRefreshPopupChange.bind(this);
        this.handleDeleteButton = this.handleDeleteButton.bind(this);
        this.handleUpdateButton = this.handleUpdateButton.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeRange = this.handleChangeRange.bind(this);
        this.handleRadioButtonChange = this.handleRadioButtonChange.bind(this);
        this.handleCombinedSort = this.handleCombinedSort.bind(this);
        this.handleSearch = this.handleSearch.bind(this);


        this.assetTable = React.createRef();
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
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
            this.assetTable.current.handleFilter(this.state.rangeStart, this.state.rangeEnd, this.state.datacenter);
        } else {
            this.assetTable.current.restoreDefault();
        }
    }

    handleRadioButtonChange(event) {
        if (event.target.name === "rackSortChoice") {
            console.log(event.target.value)
            this.rackSort = event.target.value;
            this.setState({
                rackSortChoice: event.target.value
            });

        } else if (event.target.name === "rackUSortChoice") {
            console.log(event.target.value)
            this.rackUSort = event.target.value;
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

        assetutils.sortAssetsByRackAndRackU(rackBool, rackUBool, sortedInst => {
            console.log("Will be sorting racks: " + this.state.rackSortChoice)
            console.log("Will be sorting rackU: " + this.state.rackUSortChoice)

            if (sortedInst) {
                this.setState({
                    sortedAssets: sortedInst
                });
                this.assetTable.current.handleRackRackUSort(sortedInst)
            } else {
                console.log("Done goofed somehow trying to sort")

            }

        })
    }

    handleCancelRefreshPopupChange() {
        this.setState({
            popupType: ""
        });
        //TODO: READ https://stackoverflow.com/questions/37949981/call-child-method-from-parent
        this.assetTable.current.forceRefresh();
    }

    handleCancelPopupChange() {
        this.setState({
            popupType: ""
        });
    }

    handleChildToast = (datum) => {
        //toast
        if(datum.type === "success"){
            ToastsStore.success(datum.message);
        } else if (datum.type === "error"){
            ToastsStore.error(datum.message);
        } else {
            ToastsStore.info(datum.message);
        }
    }

    handleDeleteButton = (datum) => {
        console.log(datum.model);
        this.setState({
            popupType: 'Delete',
            deleteID: datum.asset_id,
            deleteModel: datum.model,
            deleteHostname: datum.hostname
        });
    }
    handleUpdateButton = (datumID, datumModel, datumHostname, datumRack, datumRackU, datumOwner, datumComment, datumDatacenter, datumMACAddresses, datumNetworkConnections, datumPowerConnections) => {

        
        this.setState({
            popupType: 'Update',
            updateID: datumID,
            updateModel: datumModel,
            updateHostname: datumHostname,
            updateRack: datumRack,
            updateRackU: datumRackU,
            updateOwner: datumOwner,
            updateComment: datumComment,
            updateDatacenter: datumDatacenter,
            updateMacAddresses: datumMACAddresses,
            updateNetworkConnections: datumNetworkConnections,
            updatePowerConnections: datumPowerConnections


        });

        console.log(datumNetworkConnections)
        console.log(datumPowerConnections)

    }

    componentDidMount() {
        if (localStorage.getItem('tipShown') !== 'yes') {
            ToastsStore.info("Tip: Click on column headers to sort", 3000, 'burntToast')
            localStorage.setItem('tipShown', 'yes')
        }
        this.fetchDatacenters();
    }

    handleSearch() {
        if (this.state.searchQuery.trim() !== "") {
            index.search(this.state.searchQuery)
                .then(({hits}) => {
                    var results = []
                    var itemNo = 1
                    for (var i = 0; i < hits.length; i++) {
                        results = [...results, {
                            ...hits[i],
                            id: hits[i].objectID,
                            itemNo: itemNo++,
                            asset_id: hits[i].objectID
                        }]
                    }
                    console.log(results)
                    this.setState(oldState => ({
                        ...oldState,
                        searchResults: results
                    }))
                })
        } else {
            // reset
            this.setState(oldState => ({
                ...oldState,
                searchResults: undefined
            }))
        }
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

    render() {
        const {popupType} = this.state;
        let popup;
        if (localStorage.getItem('tipShown') !== 'yes') {
            ToastsStore.info("Tip: Click on column headers to sort", 3000, 'burntToast')
            localStorage.setItem('tipShown', 'yes')
        }

        if (popupType === 'Add') {

            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    <AddAssetForm
                        parentCallback={this.handleCancelRefreshPopupChange}
                        cancelCallback={this.handleCancelPopupChange}
                    />

                </Layer>
            )
        } else if (popupType === 'Delete') {

            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    <DeleteAssetPopup
                        parentCallback={this.handleCancelRefreshPopupChange}
                        cancelCallback={this.handleCancelPopupChange}
                        deleteIDFromParent={this.state.deleteID}
                        deleteModel={this.state.deleteModel}
                        deleteHostname={this.state.deleteHostname}

                    />
                </Layer>
            )
        } else if (popupType === 'Update') {
            console.log("In parent: updateID is " + this.state.updateID)

            popup = (

                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    <EditAssetForm
                        parentCallback={this.handleCancelRefreshPopupChange}
                        cancelCallback={this.handleCancelPopupChange}

                        updateIDFromParent={this.state.updateID}
                        updateModelFromParent={this.state.updateModel}
                        updateHostnameFromParent={this.state.updateHostname}
                        updateRackFromParent={this.state.updateRack}
                        updateRackUFromParent={this.state.updateRackU}
                        updateOwnerFromParent={this.state.updateOwner}
                        updateCommentFromParent={this.state.updateComment}
                        updateDatacenterFromParent={this.state.updateDatacenter}
                        updateAssetIDFromParent={this.state.updateID}
                        updateMacAddressesFromParent={this.state.updateMacAddresses}
                        updatePowerConnectionsFromParent={this.state.updatePowerConnections}
                        updateNetworkConnectionsFromParent={this.state.updateNetworkConnections}
                    />
                </Layer>
            )

        } else if (popupType === 'Filters') {
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
                     width="520px"
                     pad="medium">

                    {/* BEGNINNING OF FILTER BAR ==========*/}
                    <Box
                        align='center'
                        margin={{ left: 'medium', right: 'medium' }}
                        justify='start' >

                        {/* This box below is for range of racks */}
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
                            <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column' justify='start'>
                                <Text size='small'><b>Filter By Rack Range</b></Text>
                                {this.generateDatacenters()}
                                <Stack margin={{ top: 'small' }}>
                                    <Box gap='small' direction="column" margin='none' align='center'>

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
                                        <Box direction="column" justify="center" margin={{top: 'small'}}>
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
                            <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column' justify='start'>
                                {/*<Box direction="column" width={"medium"} margin={{top: 'small'}}>*/}
                                    <Button label={<Text size="small">Close</Text>} onClick={() => {
                                        this.setState({
                                            popupType: ""
                                        })
                                    }}/>
                                {/*</Box>*/}
                            </Box>
                        </Box>

                    </Box>
                    {/* END OFF FILTER BAR ================= */}



                </Box>
            </Layer>);
        }


        return (

            <Router>

                <Route
                    exact path="/assets" render={props => (
                    <React.Fragment>
                        <Grommet theme={theme} full className='fade'>
                            <Box fill background='light-2' overflow={"auto"}>
                                {popup}
                                <AppBar>

                                    <HomeButton alignSelf='start' this={this}/>
                                    <Heading alignSelf='center' level='4' margin={{
                                        top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                    }}>Assets</Heading>
                                    <UserMenu alignSelf='end' this={this}/>
                                </AppBar>
                                <Button primary icon={<Filter size={"large"}/>}
                                        onClick={() => this.setState({popupType: "Filters"})}
                                style={{
                                    position: "absolute",
                                    right: "2%",
                                    bottom: "2%"
                                }}/>


                                <Box direction='row'
                                     justify='center'
                                     wrap={true}
                                >
                                    <Box direction='row' justify='center'>
                                        <Box direction='row' justify='center'>
                                            <Box width='xxlarge' direction='column' align='stretch' justify='start'>
                                                <Box margin={{top: 'medium'}}>
                                                    <Form onSubmit={() => this.handleSearch()}>
                                                        <TextInput style={styles.TIStyle}
                                                                   placeholder="Search for assets (type your query and press enter)"
                                                                   type='search'
                                                                   onChange={e => {
                                                                       const value = e.target.value
                                                                       this.setState(oldState => ({
                                                                           ...oldState,
                                                                           searchQuery: value
                                                                       }))
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

                                                     pad='small'>
                                                    <Box margin={{
                                                        left: 'medium',
                                                        top: 'small',
                                                        bottom: 'small',
                                                        right: 'medium'
                                                    }} direction='column'
                                                         justify='start' alignSelf='stretch' flex>
                                                        <Box align="center">
                                                            <AssetTable
                                                                deleteButtonCallbackFromParent={this.handleDeleteButton}

                                                                UpdateButtonCallbackFromParent={this.handleUpdateButton}

                                                                handleToast={this.handleChildToast}

                                                                ref={this.assetTable}
                                                                searchResults={this.state.searchResults}
                                                                parent={this}

                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                {userutils.isLoggedInUserAdmin() && (
                                                    <Button primary icon={<Add/>} label="Add Asset" alignSelf='center'
                                                            onClick={() => this.setState({popupType: "Add"})}/>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>


                                </Box>
                                <ToastsContainer store={ToastsStore}/>

                            </Box>

                        </Grommet>

                    </React.Fragment>

                )}

                />

            </Router>
        )
    }
}

const styles = {
    TIStyle: {
        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#FFFFFF',
        width: '100%', paddingLeft: 20, fontWeight: 'normal'
    },
    TIStyle2: {
        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
        width: '100%', paddingLeft: 20, fontWeight: 'normal'
    }
}

export default AssetScreen
