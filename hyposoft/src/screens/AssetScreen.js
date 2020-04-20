import React, {Component} from 'react'

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
import {Add, View, Filter, Share} from 'grommet-icons'
import AddAssetForm from '../components/AddAssetForm'
import DeleteAssetPopup from '../components/DeleteAssetPopup'
import DecommissionAssetPopup from '../components/DecommissionAssetPopup'
import EditAssetForm from '../components/EditAssetForm'

import theme from '../theme'
import AppBar from '../components/AppBar'
import HomeMenu from '../components/HomeMenu'
import UserMenu from '../components/UserMenu'
import AssetTable from '../components/AssetTable'
import * as userutils from "../utils/userutils";
import * as assetutils from "../utils/assetutils";
import * as assetmacutils from "../utils/assetmacutils";
import {ToastsContainer, ToastsStore} from "react-toasts";
import * as datacenterutils from "../utils/datacenterutils";
import * as bulkassetutils from "../utils/bulkassetsutils";
import * as bulkconnectionstutils from "../utils/bulkconnectionsutils";
import * as labelutils from "../utils/labelutils";
import * as offlinestorageutils from "../utils/offlinestorageutils";
import MoveAssetForm from "../components/MoveAssetForm";

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '89a91cdfab76a8541fe5d2da46765377')

class AssetScreen extends Component {

    rackSort;
    rackUSort;
    datacenters = [];
    activeFilters = false;

    constructor(props) {
        super(props);
        this.state = {
            assets: [],
            sortedAssets: [],
            popupType: "",
            deleteID: "",
            deleteModel: "",
            deleteHostname: "",
            decommissionID: "",
            decommissionModel: "",
            decommissionHostname: "",
            updateID: "",
            initialLoaded: false,
            updateModel: "",
            updateHostname: "",
            updateRack: "",
            updateRackU: "",
            updateOwner: "",
            updateComment: "",
            rangeNumberStart: "",
            rangeNumberEnd: "",
            rackSortChoice: "asc",//by default, will be ascending
            rackUSortChoice: "asc",
            searchQuery: "",
            updateDatacenter: "",
            updateAsset_id:"",
            updateMacAddresses:
                [],
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


            updateDisplayColor: "",
            updateCpu: "",
            updateMemory: "",
            updateStorage: "",
            datacentersLoaded: false,
            rangeStart: "",
            rangeEnd: ""
        }

        this.handleCancelPopupChange = this.handleCancelPopupChange.bind(this);
        this.handleCancelRefreshPopupChange = this.handleCancelRefreshPopupChange.bind(this);
        this.handleDeleteButton = this.handleDeleteButton.bind(this);
        this.handleDecommissionButton = this.handleDecommissionButton.bind(this);
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
            // activeFilters flag is for selectAll feature
            this.activeFilters = true
            this.assetTable.current.handleFilter(this.state.rangeStart, this.state.rangeEnd, this.state.datacenter);
        } else {
            // activeFilters flag is for selectAll feature
            this.activeFilters = false
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

        }, this.assetTable.current.state.selectedAssets, this.state.offlineStorageID)
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

    handleMoveButton = (datum) => {
        this.setState({
            popupType: 'Move',
            moveID: datum.asset_id,
            moveModel: datum.model,
            moveLocation: this.props.match.params.storageSiteAbbrev ? "offline" : "rack",
            moveCurrentLocation: this.props.match.params.storageSiteAbbrev ? "offline storage site " + this.props.match.params.storageSiteAbbrev : "datacenter " + datum.datacenter + " on rack " + datum.rack + " at height " + datum.rackU
        })
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
    handleDecommissionButton = (datum) => {
        this.setState({
            popupType: 'Decommission',
            decommissionID: datum.asset_id,
            decommissionModel: datum.model,
            decommissionHostname: datum.hostname
        });
    }
    handleUpdateButton = (datumID, datumModel, datumHostname, datumRack, datumRackU, datumOwner, datumComment, datumDatacenter, datumMACAddresses, datumNetworkConnections, datumPowerConnections, datumDisplayColor, datumCpu, datumMemory, datumStorage) => {

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
            updatePowerConnections: datumPowerConnections,

            updateDisplayColor: datumDisplayColor,
            updateCpu: datumCpu,
            updateMemory: datumMemory,
            updateStorage: datumStorage


        });

        // console.log(datumNetworkConnections)
        console.log(datumPowerConnections)

    }

    componentDidMount() {
        if (localStorage.getItem('tipShown') !== 'yes') {
            ToastsStore.info("Tip: Click on column headers to sort", 3000, 'burntToast')
            localStorage.setItem('tipShown', 'yes')
        }
        if(this.props.match.params.storageSiteAbbrev){
            offlinestorageutils.getInfoFromAbbrev(this.props.match.params.storageSiteAbbrev, (name, id) => {
                this.setState({
                    offlineStorageName: name,
                    offlineStorageID: id,
                    offlineStorageLoaded: true
                })
            })
        } else {
            this.setState({
                offlineStorageLoaded: true
            })
        }
        this.fetchDatacenters();
    }

    handleSearch() {
        let index = this.props.match.params.storageSiteAbbrev ? client.initIndex(this.props.match.params.storageSiteAbbrev + '_index') : client.initIndex('assets')
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
                            asset_id: hits[i].objectID,
                            checked: this.assetTable.current.state.selectedAssets.includes(hits[i].objectID)
                        }]
                    }
                    this.assetTable.current.presetTotalAssetIdsForSelectAll(results)
                    this.setState(oldState => ({
                        ...oldState,
                        searchResults: results
                    }))
                })
        } else {
            // reset
            this.assetTable.current.state.assets.forEach(asset => asset.checked = this.assetTable.current.state.selectedAssets.includes(asset.asset_id))
            if (this.activeFilters) {
              this.assetTable.current.presetTotalAssetIdsForSelectAll(this.assetTable.current.state.assets)
            }
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
            console.log(this.datacenters)
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
                console.log(names)
                names.forEach(name => {
                    this.datacenters.push(name);
                    count++;
                    if (count === names.length) {
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
                        updatePowerConnectionsFromParent={[]}
                        updateNetworkConnectionsFromParent={[]}
                        updateMacAddressesFromParent={[]}

                        updateIDFromParent={""}
                        updateModelFromParent={""}
                        updateHostnameFromParent={""}
                        updateRackFromParent={""}
                        updateRackUFromParent={""}
                        updateOwnerFromParent={""}
                        updateCommentFromParent={""}
                        updateDatacenterFromParent={""}
                        updateAssetIDFromParent={""}

                       
                        updateDisplayColorFromParent={""}
                        updateCpuFromParent={""}
                        updateMemoryFromParent={""}
                        updateStorageFromParent={""}
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

                        offlineStorage = {this.props.match.params.storageSiteAbbrev}

                    />
                </Layer>
            )
        } else if (popupType === 'Decommission') {

            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    <DecommissionAssetPopup
                        parentCallback={this.handleCancelRefreshPopupChange}
                        cancelCallback={this.handleCancelPopupChange}
                        decommissionIDFromParent={this.state.decommissionID}
                        decommissionModel={this.state.decommissionModel}
                        decommissionHostname={this.state.decommissionHostname}

                        offlineStorage = {this.props.match.params.storageSiteAbbrev}
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

                        offlineStorage={this.props.match.params.storageSiteAbbrev}

                        popupMode={this.state.popupType}
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

                        updateDisplayColorFromParent={this.state.updateDisplayColor}
                        updateCpuFromParent = {this.state.updateCpu}
                        updateMemoryFromParent={this.state.updateMemory}
                        updateStorageFromParent={this.state.updateStorage}

                    />
                </Layer>
            )

        } else if (popupType === 'Move') {
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    <MoveAssetForm location={this.state.moveLocation} assetID={this.state.moveID} currentLocation={this.state.moveCurrentLocation}
                                   model={this.state.moveModel} offlineAbbrev={this.props.match.params.storageSiteAbbrev}
                    success={this.handleCancelRefreshPopupChange} cancelCallback={this.handleCancelPopupChange}/>
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
                     pad="small">

                    {/* BEGNINNING OF FILTER BAR ==========*/}
                    <Box
                        align='center'
                        margin={{ left: 'small', right: 'small' }}
                        justify='start' >

                        {/* This box below is for range of racks */}
                        {!this.props.match.params.storageSiteAbbrev && <Box style={{
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
                        </Box>}


                        {/* Box for Combined Rack and Rack U sort */}
                        <Box style={{
                            borderRadius: 10,
                            borderColor: '#EDEDED'
                        }}
                             direction='row'
                             alignSelf='stretch'
                             background='#FFFFFF'
                             width={"medium"}
                             margin={{ top: 'small', left: 'medium', right: 'medium' }}
                             pad='xxsmall' >
                            <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column' justify='start'>
                                <Stack >
                                    <Box gap='small' direction="column" margin='small'>
                                        {/* Put sort buttons here */}
                                        <Text size='small'><b>Sort by Rack and RackU</b></Text>
                                        <Box direction="row" justify="center" margin="small" wrap={true}>
                                            <RadioButtonGroup
                                                label="Rack"
                                                name="rackSortChoice"
                                                margin={{right: "small"}}
                                                value={this.state.rackSortChoice}
                                                options={[
                                                    { label: "Rack: Ascend", value: "asc" },
                                                    { label: "Rack: Descend", value: "desc" },
                                                ]}
                                                onClick={e => {
                                                    this.value = e.target.value
                                                    this.setState(oldState => ({ ...oldState, rackSortChoice: this.value }))
                                                    this.handleRadioButtonChange(e)
                                                }}
                                            />
                                            <RadioButtonGroup
                                                label="Rack"
                                                name="rackUSortChoice"
                                                margin={{left: "small"}}
                                                value={this.state.rackUSortChoice}
                                                options={[
                                                    { label: "RackU: Ascend", value: "asc" },
                                                    { label: "RackU: Descend", value: "desc" },

                                                ]}
                                                onClick={e => {
                                                    this.value = e.target.value
                                                    this.setState(oldState => ({ ...oldState, rackUSortChoice: this.value }))
                                                    this.handleRadioButtonChange(e)
                                                }}
                                            />
                                        </Box>
                                        <Box direction="column" justify="center" margin={{top: 'small', bottom: 'small'}}>
                                            <Button label={<Text size="small"> Apply</Text>} onClick={this.handleCombinedSort}/>
                                        </Box>
                                        <Box direction="column" justify="center" margin={{bottom: 'small'}}>
                                            <Button label={<Text size="small"> Close</Text>} onClick={() => {
                                                this.setState({
                                                    popupType: ""
                                                })
                                            }}/>
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
                             margin={{ top: 'small', left: 'medium', right: 'medium' }}
                             pad='small' >
                            <Box flex margin={{ left: 'medium', top: 'small', right: 'medium' }} direction='column' justify='start'>
                                {/*<Box direction="column" width={"medium"} margin={{top: 'small'}}>*/}
                                <Button icon={<Share/>} label={<Text size="small">Export Filtered Assets</Text>} margin={{top: 'small', bottom: 'medium'}} onClick={() => {
                                    bulkassetutils.exportFilteredAssets(this.state.searchResults || this.assetTable.current.state.assets);
                                }} style={{marginBottom: "10px"}}/>
                                <Button icon={<Share/>} label={<Text size="small">Export Filtered Connections</Text>} margin={{bottom: 'medium'}} onClick={() => {
                                    bulkconnectionstutils.exportFilteredConnections(this.state.searchResults || this.assetTable.current.state.assets);
                                }} style={{marginBottom: "10px"}}/>
                                <Button icon={<Share/>} label={<Text size="small">Export Selected Barcodes</Text>} onClick={() => {
                                    labelutils.generateLabelPDF(this.assetTable.current.state.selectedAssets.sort());
                                }} margin={{bottom: 'medium'}}/>
                                {/*this.assetTable.current.state*/}
                                {/*</Box>*/}
                            </Box>
                        </Box>

                    </Box>
                    {/* END OFF FILTER BAR ================= */}



                </Box>
            </Layer>);
        }


        return (


                    <React.Fragment>
                        <Grommet theme={theme} full className='fade'>
                            <Box fill background='light-2' overflow={"auto"}>
                                {popup}
                                <AppBar>

                                    <HomeMenu alignSelf='start' this={this}/>
                                    <Heading alignSelf='center' level='4' margin={{
                                        top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                    }}>Assets{this.props.match.params.storageSiteAbbrev && " in storage site " + this.props.match.params.storageSiteAbbrev}</Heading>
                                    <UserMenu alignSelf='end' this={this}/>
                                </AppBar>
                                <Button primary icon={<Filter size={"medium"}/>}
                                        onClick={() => this.setState({popupType: "Filters"})}
                                style={{
                                    borderRadius: '100%',
                                    padding: '12px',
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
                                            <Box pad='medium' width='xxlarge' direction='column' align='stretch' justify='start'>
                                                <Box>
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
                                                        {this.state.offlineStorageLoaded && <AssetTable
                                                                deleteButtonCallbackFromParent={this.handleDeleteButton}
                                                                decommissionButtonCallbackFromParent={this.handleDecommissionButton}

                                                                UpdateButtonCallbackFromParent={this.handleUpdateButton}

                                                                moveButton={this.handleMoveButton}

                                                                handleToast={this.handleChildToast}

                                                                storageSiteID={this.state.offlineStorageID}
                                                                storageSiteAbbrev={this.props.match.params.storageSiteAbbrev}

                                                                ref={this.assetTable}
                                                                searchResults={this.state.searchResults}
                                                                parent={this}

                                                            />}
                                                    </Box>
                                                </Box>
                                                {(userutils.isLoggedInUserAdmin() || userutils.doesLoggedInUserHaveAnyAssetPermsAtAll()) && (
                                                    <Button primary icon={<Add/>} label="Add Asset" alignSelf='center'
                                                            onClick={() => this.setState({popupType: "Add"})}/>
                                                )}

                                                  <Button primary icon={<View/>} margin={{
                                                      left: 'medium',
                                                      top: 'small',
                                                      bottom: 'small',
                                                      right: 'medium'
                                                  }} label="View Decommissioned Assets" alignSelf='center'
                                                          onClick={() => this.props.history.push('/decommissioned')}/>

                                            </Box>
                                        </Box>
                                    </Box>


                                </Box>
                                <ToastsContainer store={ToastsStore}/>

                            </Box>

                        </Grommet>

                    </React.Fragment>


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
