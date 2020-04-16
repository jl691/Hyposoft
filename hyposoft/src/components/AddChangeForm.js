import React from "react";
import theme from "../theme";
import {Box, Button, Grommet, Heading, Layer, Menu} from "grommet";
import AppBar from "./AppBar";
import HomeButton from "./HomeButton";
import UserMenu from "./UserMenu";
import {ToastsContainer, ToastsStore} from "react-toasts";
import {Add} from "grommet-icons";
import * as assetutils from "../utils/assetutils"
import * as changeplanutils from "../utils/changeplanutils"
import AddAssetForm from "./AddAssetForm";
import BackButton from "./BackButton";
import EditAssetForm from "./EditAssetForm";
import * as assetmacutils from "../utils/assetmacutils"
import * as assetnetworkportutils from "../utils/assetnetworkportutils"
import DecommissionAssetPopup from "./DecommissionAssetPopup";
import MoveAssetForm from "./MoveAssetForm";

class AddChangeForm extends React.Component {

    menuItems = [];
    assetData;

    constructor(props) {
        super(props);
        this.state = {
            assetsLoaded: false
        };
        this.handleCancelPopupChange = this.handleCancelPopupChange.bind(this);
    }

    componentDidMount() {
        assetutils.getAllAssetsList((assetNames, assetData) => {
            if (assetNames) {
                this.assetData = assetData;
                let count = 0;
                assetNames.forEach(asset => {
                    this.menuItems.push(asset);
                    count++;
                    if (count === assetNames.length) {
                        this.setState({
                            assetsLoaded: true,
                        });
                    }
                })
            } else {
                this.setState({
                    assetsLoaded: true
                });
            }
        })
    }

    getAssetsList(type) {
        let newMenuItems = [];
        let action = type === "edit" ? "Update" : (type === "decommission" ? "delete" : "move");
        if (this.state.assetsLoaded) {
            this.menuItems.forEach(menuItem => {
                newMenuItems.push({
                    label: menuItem,
                    onClick: () => {
                        changeplanutils.checkChangeAlreadyExists(this.props.match.params.changePlanID, this.assetData.get(menuItem).assetId, type, exists => {
                            console.log(exists)
                            if(exists){
                                ToastsStore.error("A(n) " + type + " change with asset #" + this.assetData.get(menuItem).assetId + " already exists in this change plan - please modify that change instead.")
                            } else {
                                this.setState({
                                    selected: menuItem,
                                    popupType: action
                                });
                            }
                        });
                    }
                });
            });
            return (
                <Menu items={newMenuItems} label={"Select an asset..."} alignSelf={"center"}/>
            )
        } else {
            return (
                <Menu label={"No assets found."} alignSelf={"center"}/>
            )
        }
    }

    handleCancelPopupChange() {
        console.log("clocsing popu")
        this.setState({
            popupType: ""
        });
    }

    render() {
        const {popupType} = this.state;
        let popup;
        if (popupType === 'Add') {

            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    <AddAssetForm
                        parentCallback={this.handleCancelPopupChange}
                        cancelCallback={this.handleCancelPopupChange}
                        changePlanID={this.props.match.params.changePlanID}
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
        } else if (popupType === 'Update'){
            let selectedData = this.assetData.get(this.state.selected);
            // console.log(selectedData.variances)
            // console.log(selectedData)
            //console.log(selectedData.macAddresses);
            //console.log(assetmacutils.unfixMacAddressesForMACForm(selectedData.macAddresses))
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    <EditAssetForm
                        parentCallback={this.handleCancelPopupChange}
                        cancelCallback={this.handleCancelPopupChange}
                        changePlanID={this.props.match.params.changePlanID}
                        popupMode={this.state.popupType}
                        updateModelFromParent={selectedData.model}
                        updateHostnameFromParent={selectedData.hostname}
                        updateRackFromParent={selectedData.rack}
                        updateRackUFromParent={selectedData.rackU}
                        updateOwnerFromParent={selectedData.owner}
                        updateCommentFromParent={selectedData.comment}
                        updateDatacenterFromParent={selectedData.datacenter}
                        updateAssetIDFromParent={selectedData.assetId}
                        updateMacAddressesFromParent={assetmacutils.unfixMacAddressesForMACForm(selectedData.macAddresses)}
                        updatePowerConnectionsFromParent={selectedData.powerConnections}
                        updateNetworkConnectionsFromParent={assetnetworkportutils.networkConnectionsToArray(selectedData.networkConnections)}

                        offlineStorage={selectedData.offlineAbbrev ? selectedData.offlineAbbrev : null}

                        updateDisplayColorFromParent={selectedData.variances.displayColor}
                        updateCpuFromParent={selectedData.variances.cpu}
                        updateMemoryFromParent={selectedData.variances.memory}
                        updateStorageFromParent={selectedData.variances.storage}
                    />
                </Layer>
            )
        } else if (popupType === 'delete'){
            let selectedData = this.assetData.get(this.state.selected);
            console.log(selectedData)
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    {/*<DecommissionAssetPopup changePlanID={this.props.match.params.changePlanID}
                                            decommissionIDFromParent={selectedData.assetId}
                                            parentCallback={this.handleCancelPopupChange()}
                    cancelCallback={this.handleCancelPopupChange()}/>*/}

                    <DecommissionAssetPopup
                        changePlanID={this.props.match.params.changePlanID}
                        decommissionIDFromParent={selectedData.assetId}
                        decommissionModel={selectedData.model}
                        parentCallback={this.handleCancelPopupChange}
                        cancelCallback={this.handleCancelPopupChange}

                        offlineStorage={selectedData.offlineAbbrev ? selectedData.offlineAbbrev : null}
                    />
                </Layer>
            )
        } else if(popupType === 'move'){
            let selectedData = this.assetData.get(this.state.selected);
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <MoveAssetForm
                        success={this.handleCancelPopupChange}
                        cancelCallback={this.handleCancelPopupChange}
                        changePlanID={this.props.match.params.changePlanID}
                        assetID={selectedData.assetId}
                        model={selectedData.model}
                        location={selectedData.offlineAbbrev ? "offline" : "rack"}
                        currentLocation={selectedData.offlineAbbrev ? "offline storage site " + selectedData.offlineAbbrev : "datacenter " + selectedData.datacenter + " on rack " + selectedData.rack + " at height " + selectedData.rackU}
                    />
                </Layer>
            )
        }

        return (
            <Grommet theme={theme} full className='fade'>

                <Box fill background='light-2'>
                    <AppBar>
                        <BackButton alignSelf='start' this={this}/>
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }}>Add Change</Heading>
                        <UserMenu alignSelf='end' this={this}/>
                    </AppBar>
                    {popup}
                    <Box direction='row'
                         justify='center'
                         wrap={true}>
                        <Box
                            width='large'
                            align='center'
                            margin={{left: 'medium', right: 'medium'}}
                            justify='start'>
                            <Box style={{
                                borderRadius: 10,
                                borderColor: '#EDEDED'
                            }}
                                 direction='row'
                                 alignSelf='stretch'
                                 background='#FFFFFF'
                                 width={'large'}
                                 margin={{top: 'medium', left: 'medium', right: 'medium'}}
                                 pad='small'>
                                <Box flex
                                     margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                     direction='column' justify='start' align={"center"}>
                                    <Heading level='4' margin='none'>Add asset</Heading>
                                    <p>Add a new asset to the change plan.</p>
                                    <Box direction='column' flex alignSelf='stretch'>
                                        <Button primary icon={<Add/>} label="Add" onClick={() => {
                                            this.setState({popupType: "Add"})
                                        }}/>
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
                                 width={'large'}
                                 margin={{top: 'medium', left: 'medium', right: 'medium'}}
                                 pad='small'>
                                <Box flex
                                     margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                     direction='column' justify='start' align={"center"}>
                                    <Heading level='4' margin='none'>Edit asset</Heading>
                                    <p>Edit an existing asset in the change plan.</p>
                                    <Box direction='column' flex alignSelf='stretch'>
                                        {this.getAssetsList("edit")}
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
                                 width={'large'}
                                 margin={{top: 'medium', left: 'medium', right: 'medium'}}
                                 pad='small'>
                                <Box flex
                                     margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                     direction='column' justify='start' align={"center"}>
                                    <Heading level='4' margin='none'>Decommission asset</Heading>
                                    <p>Decommission an existing asset in the change plan.</p>
                                    <Box direction='column' flex alignSelf='stretch'>
                                        {this.getAssetsList("decommission")}
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
                                 width={'large'}
                                 margin={{top: 'medium', left: 'medium', right: 'medium'}}
                                 pad='small'>
                                <Box flex
                                     margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                     direction='column' justify='start' align={"center"}>
                                    <Heading level='4' margin='none'>Move asset</Heading>
                                    <p>Move an existing asset to or from an offline storage site in the change plan.</p>
                                    <Box direction='column' flex alignSelf='stretch'>
                                        {this.getAssetsList("move")}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>
            </Grommet>
        );
    }
}

export default AddChangeForm