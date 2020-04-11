import React from "react";
import theme from "../theme";
import { Box, Button, Grommet, Heading, Layer, Table, TableBody, TableCell, TableHeader, TableRow } from "grommet";
import AppBar from "../components/AppBar";
import BackButton from "../components/BackButton";
import UserMenu from "../components/UserMenu";
import { ToastsContainer, ToastsStore } from "react-toasts";
import * as changeplanutils from "../utils/changeplanutils";
import * as userutils from "../utils/userutils";
import * as decommissionutils from "../utils/decommissionutils";
import DeleteChangeForm from "../components/DeleteChangeForm";
import * as changeplanconflictutils from '../utils/changeplanconflictutils'
import EditDecommissionChangeForm from "../components/EditDecommissionChangeForm";
import EditAssetForm from "../components/EditAssetForm";
import * as assetmacutils from "../utils/assetmacutils";
import * as assetnetworkportutils from "../utils/assetnetworkportutils";
import AddAssetForm from "../components/AddAssetForm";

class DetailedChangeScreen extends React.Component {

    changePlanID;
    stepID;
    conflictMessages = "";
    forceRefreshCount = 0;


    constructor(props) {
        super(props);
        this.state = {
            change: "",
            popupType: "",
        }
    }

    componentDidMount() {
        this.changePlanID = this.props.match.params.changePlanID;
        this.stepID = this.props.match.params.stepID;
        this.forceRefresh();
    }

    forceRefresh() {
        changeplanutils.getChangeDetails(this.props.match.params.changePlanID, this.props.match.params.stepID, userutils.getLoggedInUserUsername(), (result, executed, timestamp) => {

            if (result) {

                this.setState({
                    change: result,
                    executed: executed,
                    timestamp: timestamp
                });
            } else {
                console.log(result)
            }
        })
    }

    generateVariancesRow(old) {
        //see if table generates normally
        let thisState = old ? this.state.change.changes.variances.old : this.state.change.changes.variances.new;

        if (thisState && Object.keys(thisState).length) {
            return Object.keys(thisState).map((field) => (

                this.state.change.changes.variances[field] !== "" &&

                <TableRow>
                    <TableCell scope="row">
                        {field}
                    </TableCell>
                    <TableCell>{thisState[field]}</TableCell>
                </TableRow>
            ))
        } else {
            return (
                <TableRow>
                    <TableCell scope="row">
                        <strong>No model variances for this asset.</strong>
                    </TableCell>
                </TableRow>
            )
        }
    }

    generateNetworkConnectionRow(old) {
        let thisState = old ? this.state.change.changes.networkConnections.old : this.state.change.changes.networkConnections.new;

        if (thisState && Object.keys(thisState).length) {
            return Object.keys(thisState).map((connection) =>
                (
                    <TableRow>
                        <TableCell scope="row">
                            {connection}
                        </TableCell>
                        <TableCell>{thisState[connection].otherAssetID}</TableCell>
                        <TableCell>{thisState[connection].otherPort}</TableCell>
                    </TableRow>
                )
            )
        } else {
            return (
                <TableRow>
                    <TableCell scope="row">
                        <strong>No network connections.</strong>
                    </TableCell>
                </TableRow>
            )
        }
    }

    generatePowerConnectionRow(old) {
        let thisState = old ? this.state.change.changes.powerConnections.old : this.state.change.changes.powerConnections.new;
        if (thisState && Object.keys(thisState).length) {
            return Object.keys(thisState).map((connection) => (
                <TableRow>
                    <TableCell scope={"row"}>
                        {connection}
                    </TableCell>
                    <TableCell>
                        {thisState[connection].pduSide}
                    </TableCell>
                    <TableCell>
                        {thisState[connection].port}
                    </TableCell>
                </TableRow>
            ))
        } else {
            return (
                <TableRow>
                    <TableCell scope="row">
                        <strong>No power connections.</strong>
                    </TableCell>
                </TableRow>
            )
        }
    }

    generateMACRow(old) {
        let thisState = old ? this.state.change.changes.macAddresses.old : this.state.change.changes.macAddresses.new;
        if (thisState && Object.keys(thisState).length) {
            return Object.keys(thisState).map((address) => (
                <TableRow>
                    <TableCell scope="row">
                        {address}
                    </TableCell>
                    <TableCell>{thisState[address]}</TableCell>
                </TableRow>
            ))
        } else {
            return (
                <TableRow>
                    <TableCell scope="row">
                        <strong>No MAC addresses.</strong>
                    </TableCell>
                </TableRow>
            )

        }
    }

    generateChangeTable() {
        if (this.state.change.changes) {
            return Object.keys(this.state.change.changes).map(change => {
                if (change === "networkConnections") {
                    let oldExists = Boolean(this.state.change.changes.networkConnections.old && Object.keys(this.state.change.changes.networkConnections.old).length);
                    let newExists = Boolean(this.state.change.changes.networkConnections.new && Object.keys(this.state.change.changes.networkConnections.new).length);
                    return (
                        <TableRow>
                            <TableCell scope={"row"}>
                                {change}
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#ff4040", color: "#ffffff" }}>
                                {oldExists && <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Network Port Name</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Connected Asset ID</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Connected Port Name</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {this.generateNetworkConnectionRow(true)}
                                    </TableBody>
                                </Table>}
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#00c781" }}>
                                {newExists && <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Network Port Name</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Connected Asset ID</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Connected Port Name</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {this.generateNetworkConnectionRow(false)}
                                    </TableBody>
                                </Table>}
                            </TableCell>
                        </TableRow>
                    )
                } else if (change === "powerConnections") {
                    let oldExists = Boolean(this.state.change.changes.powerConnections.old && Object.keys(this.state.change.changes.powerConnections.old).length);
                    let newExists = Boolean(this.state.change.changes.powerConnections.new && Object.keys(this.state.change.changes.powerConnections.new).length);
                    return (
                        <TableRow>
                            <TableCell scope={"row"}>
                                powerConnections
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#ff4040", color: "#ffffff" }}>
                                {oldExists && <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Power Port</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>PDU Side</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>PDU Port</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {this.generatePowerConnectionRow(true)}
                                    </TableBody>
                                </Table>}
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#00c781" }}>
                                {newExists && <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Power Port</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>PDU Side</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>PDU Port</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {this.generatePowerConnectionRow(false)}
                                    </TableBody>
                                </Table>}
                            </TableCell>
                        </TableRow>
                    )
                } else if (change === "macAddresses") {
                    let oldExists = Boolean(this.state.change.changes.macAddresses.old && Object.keys(this.state.change.changes.macAddresses.old).length);
                    let newExists = Boolean(this.state.change.changes.macAddresses.new && Object.keys(this.state.change.changes.macAddresses.new).length);
            
                    return (
                        <TableRow>
                            <TableCell scope={"row"}>
                                macAddresses
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#ff4040", color: "#ffffff" }}>
                                {oldExists && <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Network Port</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>MAC Address</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {this.generateMACRow(true)}
                                    </TableBody>
                                </Table>}
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#00c781" }}>
                                {newExists && <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Network Port</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>MAC Address</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {this.generateMACRow(false)}
                                    </TableBody>
                                </Table>}
                            </TableCell>
                        </TableRow>
                    )
                }
                else if (change === 'variances') {
                    let oldExists = Boolean(this.state.change.changes.variances.old && Object.keys(this.state.change.changes.variances.old).length);
                    let newExists = Boolean(this.state.change.changes.variances.new && Object.keys(this.state.change.changes.variances.new).length);

                    return (
                        <TableRow>
                            <TableCell scope={"row"}>
                                Model Variances
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#ff4040", color: "#ffffff" }}>
                                {oldExists && <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Model Field</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Modified</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {this.generateVariancesRow(true)}
                                        {/* {this.generateMACRow(true)} */}
                                    </TableBody>
                                </Table>}
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#00c781" }}>
                                {newExists && <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Model Field</strong>
                                            </TableCell>
                                            <TableCell scope="col" border="bottom">
                                                <strong>Modified</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {this.generateVariancesRow(false)}
                                    </TableBody>
                                </Table>}
                            </TableCell>
                        </TableRow>
                    )

                } else {
                    return (<TableRow>
                        <TableCell scope={"row"}>
                            {change}
                        </TableCell>
                        <TableCell style={{ backgroundColor: "#ff4040", color: "#ffffff" }}>
                            {this.state.change.changes[change]["old"]}
                        </TableCell>
                        <TableCell style={{ backgroundColor: "#00c781" }}>
                            {this.state.change.changes[change]["new"]}
                        </TableCell>
                    </TableRow>)
                }
            })
        }
    }

    generateConflict() {

        changeplanconflictutils.getErrorMessages(this.props.match.params.changePlanID, parseInt(this.props.match.params.stepID), errorMessages => {
            this.forceRefreshCount++;

            this.conflictMessages = errorMessages;
            //console.log(this.conflictMessages)
            //  if (this.forceRefreshCount === 1) {
            //need to only forceRefresh once, when we construct the message
            //Take this out if i figure out a bette timing issue
            this.forceRefresh()

            // }


        })

        if (this.conflictMessages !== "") {
            return (

                <Box style={{
                    borderRadius: 10
                }} width={"xlarge"} background={"status-error"} align={"center"} alignSelf={"center"} justify={"center"}
                    margin={{ top: "medium" }} height={"small"} overflow="auto" direction="column">
                    <Heading level={"3"} margin={"small"}>Conflict</Heading>
                    <Box overflow="auto">
                        <span style={{}}>
                            {this.conflictMessages.split('\n').map((i, key) => {
                                return <div key={key}>{i}</div>
                            })}
                        </span>
                    </Box>
                    <Box align={"center"} width={"small"}>

                        <Button primary label="Resolve" color={"light-1"} margin={{ top: "small", bottom: "small" }}
                            size={"small"} onClick={() => {

                                if (this.state.change.change === "edit") {
                                    changeplanutils.getMergedAssetAndChange(this.changePlanID, this.stepID, mergedAsset => {
                                        if (mergedAsset) {
                                            this.setState({
                                                popupType: this.state.change.change,
                                                currentChange: mergedAsset
                                            });
                                        }
                                    });
                                } else if (this.state.change.change === "add") {
                                    changeplanutils.getAssetFromAddAsset(this.changePlanID, this.stepID, asset => {
                                        if (asset) {
                                            this.setState({
                                                popupType: this.state.change.change,
                                                currentChange: asset
                                            });
                                        }
                                    })
                                } else if (this.state.change.change === "decommission") {
                                    this.setState({
                                        popupType: this.state.change.change,
                                    });
                                }
                            }} />
                    </Box>
                </Box>
            )


        }

    }

    cancelPopup = (data) => {
        this.setState({
            popupType: ""
        })
    };

    successfulEdit = (data) => {
        this.setState({
            popupType: ""
        });
        this.forceRefresh();
        ToastsStore.success(data);
    }

    callbackFunction = (data) => {
        window.location.href = "/changeplans/" + this.props.match.params.changePlanID;
    };

    render() {
        const { popupType } = this.state;
        let popup;

        if (popupType === 'Delete') {
            popup = (
                <DeleteChangeForm cancelPopup={this.cancelPopup} forceRefresh={this.callbackFunction} genConflict={this.generateConflict}
                    changePlanID={this.props.match.params.changePlanID} stepNumber={this.stepID} />
            )
        } else if (popupType === 'decommission') {
            popup = (
                <EditDecommissionChangeForm cancelPopup={this.cancelPopup} stepID={this.stepID}
                    changePlanID={this.changePlanID} successfulEdit={this.successfulEdit} />
            )
        } else if (popupType === 'edit') {
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>

                    <EditAssetForm
                        parentCallback={this.cancelPopup}
                        cancelCallback={this.cancelPopup}
                        changePlanID={this.changePlanID}
                        popupMode={'Update'}
                        changeDocID={this.state.currentChange.changeDocID}
                        updateModelFromParent={this.state.currentChange.model}
                        updateHostnameFromParent={this.state.currentChange.hostname}
                        updateRackFromParent={this.state.currentChange.rack}
                        updateRackUFromParent={this.state.currentChange.rackU}
                        updateOwnerFromParent={this.state.currentChange.owner}
                        updateCommentFromParent={this.state.currentChange.comment}
                        updateDatacenterFromParent={this.state.currentChange.datacenter}
                        updateAssetIDFromParent={this.state.currentChange.assetId}
                        updateMacAddressesFromParent={assetmacutils.unfixMacAddressesForMACForm(this.state.currentChange.macAddresses)}
                        updatePowerConnectionsFromParent={this.state.currentChange.powerConnections}
                        updateNetworkConnectionsFromParent={assetnetworkportutils.networkConnectionsToArray(this.state.currentChange.networkConnections)}
                    />
                </Layer>
            )
        } else if (popupType === 'add') {
            console.log(this.state.currentChange)
            // console.log(this.state.currentChange.macAddresses, this.state.currentChange, assetmacutils.unfixMacAddressesForMACForm(this.state.currentChange.macAddresses))
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>

                    <AddAssetForm
                        parentCallback={this.cancelPopup}
                        cancelCallback={this.cancelPopup}
                        changePlanID={this.changePlanID}
                        popupMode={"Update"}
                        changeDocID={this.state.currentChange.changeDocID}
                        updateMacAddressesFromParent={assetmacutils.unfixMacAddressesForMACForm(this.state.currentChange.macAddresses)}
                        updatePowerConnectionsFromParent={this.state.currentChange.powerConnections}
                        updateNetworkConnectionsFromParent={assetnetworkportutils.networkConnectionsToArray(this.state.currentChange.networkConnections)}

                        updateModelFromParent={this.state.currentChange.model}
                        updateHostnameFromParent={this.state.currentChange.hostname}
                        updateRackFromParent={this.state.currentChange.rack}
                        updateRackUFromParent={this.state.currentChange.rackU}
                        updateOwnerFromParent={this.state.currentChange.owner}
                        updateCommentFromParent={this.state.currentChange.comment}
                        updateDatacenterFromParent={this.state.currentChange.datacenter}
                        updateAssetIDFromParent={this.state.currentChange.assetId ? this.state.currentChange.assetId : ""}


                    // updateDisplayColorFromParent={this.state.currentChange.variances.displayColor}
                    // updateCpuFromParent={this.state.currentChange.variances.cpu}
                    // updateMemoryFromParent={this.state.currentChange.variances.memory}
                    // updateStorageFromParent={this.state.currentChange.variances.storage}
                    />
                </Layer>
            )
        }

        return (
            <React.Fragment>
                <Grommet theme={theme} className='fade'>
                    <Box fill background='light-2' overflow={"auto"}>
                        <AppBar>
                            <BackButton alignSelf='start' this={this} />
                            <Heading alignSelf='center' level='4' margin={{
                                top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                            }}>{this.props.match.params.assetID}</Heading>
                            <UserMenu alignSelf='end' this={this} />
                        </AppBar>
                        {this.generateConflict()}
                        {this.state.executed && <Box style={{
                            borderRadius: 10
                        }} width={"xlarge"} background={"status-ok"} align={"center"} alignSelf={"center"}
                            margin={{ top: "medium" }}>
                            <Heading level={"3"} margin={"small"}>Change Plan Executed</Heading>
                            <Box>This change plan was executed on {decommissionutils.getDate(this.state.timestamp)}.
                                Thus, no further changes can be made.</Box>
                        </Box>}
                        <Box
                            align='center'
                            margin={{ left: 'medium', right: 'medium' }}
                            justify='center' overflow={"auto"}>
                            <Box style={{
                                borderRadius: 10,
                                borderColor: '#EDEDED'
                            }}
                                direction='row'
                                background='#FFFFFF'
                                width={'xlarge'}
                                margin={{ top: 'medium', left: 'medium', right: 'medium' }}
                                pad='small'
                                overflow={"auto"}>
                                <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }}
                                    direction='column' justify='start'>
                                    <Heading level='4' margin='none'>Step #{this.stepID} Details</Heading>
                                    <table style={{ marginTop: '10px', marginBottom: '10px' }}>
                                        <tbody>
                                            <tr>
                                                <td><b>Step #</b></td>
                                                <td style={{ textAlign: 'right' }}>{this.stepID}</td>
                                            </tr>
                                            <tr>
                                                <td><b>Asset ID</b></td>
                                                <td style={{ textAlign: 'right' }}>{this.state.change.assetID ? this.state.change.assetID : "TBD"}</td>
                                            </tr>
                                            <tr>
                                                <td><b>Change</b></td>
                                                <td style={{ textAlign: 'right' }}>{this.state.change.change}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableCell scope="col" border="bottom">
                                                    <strong>Field</strong>
                                                </TableCell>
                                                <TableCell scope="col" border="bottom">
                                                    <strong>Old State</strong>
                                                </TableCell>
                                                <TableCell scope="col" border="bottom">
                                                    <strong>New State</strong>
                                                </TableCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {this.generateChangeTable()}
                                        </TableBody>
                                    </Table>
                                    {(!this.state.executed && (userutils.isLoggedInUserAdmin() || userutils.doesLoggedInUserHaveAnyAssetPermsAtAll())) &&
                                        <Box direction='column' flex alignSelf='stretch' style={{ marginTop: '15px' }}
                                            gap='small'>
                                            <Button label="Edit Change" onClick={() => {
                                                if (this.state.change.change === "edit") {
                                                    changeplanutils.getMergedAssetAndChange(this.changePlanID, this.stepID, mergedAsset => {
                                                        if (mergedAsset) {
                                                            this.setState({
                                                                popupType: this.state.change.change,
                                                                currentChange: mergedAsset
                                                            });
                                                        }
                                                    });
                                                } else if (this.state.change.change === "add") {
                                                    changeplanutils.getAssetFromAddAsset(this.changePlanID, this.stepID, asset => {
                                                        if (asset) {
                                                            this.setState({
                                                                popupType: this.state.change.change,
                                                                currentChange: asset
                                                            });
                                                        }
                                                    })
                                                } else if (this.state.change.change === "decommission") {
                                                    this.setState({
                                                        popupType: this.state.change.change,
                                                    });
                                                }
                                            }} />
                                            <Button label="Delete Change" onClick={() => {
                                                this.setState({
                                                    popupType: "Delete"
                                                })
                                            }} />
                                        </Box>}
                                </Box>
                            </Box>
                        </Box>
                        {popup}
                        <ToastsContainer store={ToastsStore} />
                    </Box>
                </Grommet>
            </React.Fragment>
        )
    }

}

export default DetailedChangeScreen