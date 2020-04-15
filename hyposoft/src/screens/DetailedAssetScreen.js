import React, { Component } from 'react'
import { BrowserRouter as Router, Link, Redirect, Route } from 'react-router-dom'
import {
    Button,
    Grommet,
    Heading,
    Box,
    CheckBox,
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TableBody, Layer, Text,
    Meter,

} from 'grommet'
import * as assetutils from '../utils/assetutils'
import * as modelutils from '../utils/modelutils'
import * as bladeutils from '../utils/bladeutils'
import * as userutils from '../utils/userutils'
import * as powerutils from '../utils/powerutils'
import * as assetmacutils from "../utils/assetmacutils"
import * as assetnetworkportutils from "../utils/assetnetworkportutils"
import theme from '../theme'
import BackButton from '../components/BackButton'
import BladeChassisView from '../components/BladeChassisView'
import AppBar from '../components/AppBar'
import UserMenu from '../components/UserMenu'
import { FormEdit, Power, Clear, PowerCycle, View, ShareOption, Transaction } from "grommet-icons"
import { ToastsContainer, ToastsStore } from "react-toasts";
import EditAssetForm from "../components/EditAssetForm";
import ReactTooltip from "react-tooltip";
import MoveAssetForm from "../components/MoveAssetForm";

export default class DetailedAssetScreen extends Component {

    powerPorts;
    connectedPDU;
    bladeData = null
    chassisSlots = null

    constructor(props) {
        super(props);
        this.state = {
            asset: "",
            powerMap: false,
            popupType: "",
            initialLoaded: false,
            model: ""
        }

        this.generatePDUStatus = this.generatePDUStatus.bind(this);
        this.handleCancelPopupChange = this.handleCancelPopupChange.bind(this);
        this.handleCancelRefreshPopupChange = this.handleCancelRefreshPopupChange.bind(this);
        this.generateVariancesTable = this.generateVariancesTable.bind(this)
    }

    static contextTypes = {
        router: () => true, // replace with PropTypes.object if you use them
    }

    componentDidMount() {
        this.forceRefresh();
    }

    forceRefresh() {
        this.setState({
            asset: "",
            powerMap: false,
            popupType: "",
            initialLoaded: false,
            model: ""
        });
        this.powerPorts = null;
        this.connectedPDU = null;
        if (!this.props.match.params.storageSiteAbbrev) {

            powerutils.checkConnectedToPDU(this.props.match.params.assetID, result => {
                if (!(result === null)) {
                    console.log(result)
                    if (result) {
                        this.connectedPDU = true;
                    } else {
                        this.connectedPDU = false;
                    }
                }
                assetutils.getAssetDetails(
                    this.props.match.params.assetID,
                    assetsdb => {
                        this.determineBladeData(assetsdb.assetID, assetsdb.hostname, () => {
                            console.log(assetsdb)
                            this.setState({
                                asset: assetsdb,
                                //initialLoaded: true

                            }, function () {
                                console.log(this.state.model)
                                this.generatePDUStatus();
                                modelutils.getModelByModelname(assetsdb.model, modelDoc => {
                                    console.log(modelDoc.data())
                                    this.setState({
                                        model: modelDoc.data(),
                                        initialLoaded: true
                                    })
                                })
                            });
                        })
                    })
            });
        }
        else {
            assetutils.getAssetDetails(
                this.props.match.params.assetID,
                assetsdb => {
                    this.determineBladeData(assetsdb.assetID, assetsdb.hostname, () => {
                        this.setState({
                            asset: assetsdb,
                            //initialLoaded: true

                        }, function () {
                            console.log(this.state.asset)
                            this.generatePDUStatus();
                            modelutils.getModelByModelname(assetsdb.model, modelDoc => {
                                console.log(modelDoc.data())
                                this.setState({
                                    model: modelDoc.data(),
                                    initialLoaded: true
                                })
                            })

                        });
                    })
                }, this.props.match.params.storageSiteAbbrev)
        };
    }

    determineBladeData(id, hostname, callback) {
        bladeutils.getDetailBladeInfo(id, hostname, (data, chassisSlots) => {
            this.bladeData = data
            this.chassisSlots = chassisSlots
            callback()
        })
    }

    generateNetworkTable() {
        if (this.state.asset.networkConnections && Object.keys(this.state.asset.networkConnections).length) {
            console.log(this.state.asset.networkConnections)
            return Object.keys(this.state.asset.networkConnections).map((connection) => (
                <TableRow
                    style={{ cursor: 'pointer' }} onClick={() => {
                        window.location.href = '/assets/' + this.state.asset.networkConnections[connection].otherAssetID;
                    }}>
                    <TableCell scope="row">
                        {connection}
                    </TableCell>
                    <TableCell>{this.state.asset.networkConnections[connection].otherAssetID}</TableCell>
                    <TableCell>{this.state.asset.networkConnections[connection].otherPort}</TableCell>
                </TableRow>
            ))
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

    generatePowerTable() {
        if (this.state.asset.powerConnections && Object.keys(this.state.asset.powerConnections).length) {
            return Object.keys(this.state.asset.powerConnections).map((connection) => (
                <TableRow>
                    <TableCell scope="row">
                        {connection}
                    </TableCell>
                    <TableCell>{this.state.asset.powerConnections[connection].pduSide}</TableCell>
                    <TableCell>{this.state.asset.powerConnections[connection].port}</TableCell>
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

    generateMACTable() {
        if (this.state.asset.macAddresses && Object.keys(this.state.asset.macAddresses).length) {
            return Object.keys(this.state.asset.macAddresses).map((address) => (
                <TableRow>
                    <TableCell scope="row">
                        {address}
                    </TableCell>
                    <TableCell>{this.state.asset.macAddresses[address]}</TableCell>
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


    generateVariancesTable() {

        console.log(this.state)

        return Object.keys(this.state.asset.variances).map((field) => (

            this.state.model[field] === "" ?
                <tr>
                    <td><b>Model {[field]} </b></td>
                    <td style={{ textAlign: 'right' }}>{this.state.asset.variances[field] !== "" ? this.state.asset.variances[field] + " " + "(Modified from base value N/A)" : "N/A"}</td>
                </tr>
                :

                <tr>
                    <td><b>Model {[field]} </b></td>
                    <td style={{ textAlign: 'right' }}>{this.state.asset.variances[field] !== "" ? this.state.asset.variances[field] + " " + "(Modified from base value " + this.state.model[field] + ")" : this.state.model[field]}</td>
                </tr>
        ))
    }

    generateModelNetworkPortString() {
        let result = ""
        let count = 0;
        console.log(this.state.model)
        this.state.model.networkPorts.forEach(port => {
            count++;
            if (count == 1) {
                result = result + port
            }
            else {
                result = result + "," + port
            }
        })

        return (
            <tr>
                <td><b>Model Network Ports </b></td>
                <td style={{ textAlign: 'right' }}>{result}</td>
            </tr>)

    }

    generatePDUStatus() {
        if (this.connectedPDU) {
            this.powerPorts = [];
            if (userutils.doesLoggedInUserHavePowerPerm() || userutils.isLoggedInUserAdmin() || userutils.getLoggedInUserUsername() === this.state.asset.owner) {
                ToastsStore.info("Click a refresh button by a PDU status to power cycle it.", 5000);
            }
            Object.keys(this.state.asset.powerConnections).forEach(pduConnections => {
                let formattedNum;
                if (this.state.asset.rackNum.toString().length === 1) {
                    formattedNum = "0" + this.state.asset.rackNum;
                } else {
                    formattedNum = this.state.asset.rackNum;
                }
                powerutils.getPortStatus("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                    let toggle;
                    if (result === null) {
                        ToastsStore.info("PDU power status is currently unavailable due to network issues.")
                        toggle = false;
                    } else {
                        toggle = result === "ON" ? true : false;
                    }
                    this.powerPorts.push({
                        name: "hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0),
                        port: this.state.asset.powerConnections[pduConnections].port
                    });
                    this.setState({
                        ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: toggle
                    })
                    // this.state.powerStatuses.set("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port, toggle);
                    if (this.powerPorts.length === Object.keys(this.state.asset.powerConnections).length) {
                        this.setState({
                            powerMap: true
                        })
                    }
                })
            })
        }
    }


    turnAssetOn() {
        let count = 0;
        Object.keys(this.state.asset.powerConnections).forEach(pduConnections => {
            let formattedNum;
            if (this.state.asset.rackNum.toString().length === 1) {
                formattedNum = "0" + this.state.asset.rackNum;
            } else {
                formattedNum = this.state.asset.rackNum;
            }
            powerutils.powerPortOn("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                if (result) {
                    this.setState({
                        ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: true
                    });
                    count++;
                    if (count === Object.keys(this.state.asset.powerConnections).length) {
                        ToastsStore.success("Successfully turned on the asset!")
                    }
                } else {
                    ToastsStore.info("Could not power on due to network connectivity issues.")
                }
            })
        })
    }

    turnAssetOff() {
        let count = 0;
        Object.keys(this.state.asset.powerConnections).forEach(pduConnections => {
            let formattedNum;
            if (this.state.asset.rackNum.toString().length === 1) {
                formattedNum = "0" + this.state.asset.rackNum;
            } else {
                formattedNum = this.state.asset.rackNum;
            }
            powerutils.powerPortOff("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                if (result) {
                    this.setState({
                        ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: false
                    });
                    count++;
                    if (count === Object.keys(this.state.asset.powerConnections).length) {
                        ToastsStore.success("Successfully turned off the asset!")
                    }
                } else {
                    ToastsStore.error("Could not power off the asset due to network connectivity issues.")
                }
            })
        })
    }

    powerCycleAsset() {
        let count = 0;
        Object.keys(this.state.asset.powerConnections).forEach(pduConnections => {
            let formattedNum;
            if (this.state.asset.rackNum.toString().length === 1) {
                formattedNum = "0" + this.state.asset.rackNum;
            } else {
                formattedNum = this.state.asset.rackNum;
            }
            powerutils.powerPortOff("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                if (result) {
                    this.setState({
                        ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: false
                    });
                    count++;
                    if (count === Object.keys(this.state.asset.powerConnections).length) {
                        setTimeout(() => {
                            count = 0;
                            Object.keys(this.state.asset.powerConnections).forEach(pduConnections => {
                                let formattedNum;
                                if (this.state.asset.rackNum.toString().length === 1) {
                                    formattedNum = "0" + this.state.asset.rackNum;
                                } else {
                                    formattedNum = this.state.asset.rackNum;
                                }
                                powerutils.powerPortOn("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                                    if (result) {
                                        this.setState({
                                            ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: true
                                        });
                                        count++;
                                        if (count === Object.keys(this.state.asset.powerConnections).length) {
                                            ToastsStore.success("Successfully power cycled the asset!")
                                        }
                                    } else {
                                        ToastsStore.error("Could not power cycle due to network connectivity issues.")
                                    }
                                })
                            })
                        }, 2000);
                    }
                } else {
                    ToastsStore.error("Could not power cycle due to network connectivity issues.")
                }
            })
        })
    }

    renderPDUStatus() {
        if (this.state.powerMap) {
            return this.powerPorts.map((connection) => (
                <tr>
                    <td><b>{connection.name}:{connection.port}</b></td>
                    <td style={{ float: "right" }}><Box direction={"row"} alignSelf={"end"}>
                        <CheckBox toggle={true}
                            disabled={!(userutils.doesLoggedInUserHavePowerPerm() || userutils.isLoggedInUserAdmin() || userutils.getLoggedInUserUsername() === this.state.asset.owner)}
                            checked={this.state[connection.name + ":" + connection.port]}
                            onChange={(e) => {
                                if (this.state[connection.name + ":" + connection.port]) {
                                    console.log("1")
                                    //on, power off
                                    powerutils.powerPortOff(connection.name, connection.port, result => {
                                        console.log(result)
                                        if (result) {
                                            this.setState({
                                                [connection.name + ":" + connection.port]: false
                                            });
                                            ToastsStore.success("Turned " + connection.name + ":" + connection.port + " off successfully!");
                                        } else {
                                            ToastsStore.error("Could not power off due to network connectivity issues.")
                                        }
                                    })
                                } else {
                                    console.log("2")
                                    //off, power on
                                    powerutils.powerPortOn(connection.name, connection.port, result => {
                                        console.log(result)
                                        if (result) {
                                            this.setState({
                                                [connection.name + ":" + connection.port]: true
                                            });
                                            ToastsStore.success("Turned " + connection.name + ":" + connection.port + " on successfully!");
                                        } else {
                                            ToastsStore.error("Could not power on due to network connectivity issues.")
                                        }
                                    })
                                }
                            }} />{(userutils.doesLoggedInUserHavePowerPerm() || userutils.isLoggedInUserAdmin() || userutils.getLoggedInUserUsername() === this.state.asset.owner) &&
                                <PowerCycle
                                    data-tip="Power cycle"
                                    size={"medium"} style={{ marginLeft: "10px", cursor: "pointer" }} onClick={(e) => {
                                        ToastsStore.success("Power cycling " + connection.name + ":" + connection.port + ". Please wait!");
                                        powerutils.powerPortOff(connection.name, connection.port, result => {
                                            if (result) {
                                                this.setState({
                                                    [connection.name + ":" + connection.port]: false
                                                });
                                                setTimeout(() => {
                                                    powerutils.powerPortOn(connection.name, connection.port, result => {
                                                        if (result) {
                                                            this.setState({
                                                                [connection.name + ":" + connection.port]: true
                                                            });
                                                            ToastsStore.success("Power cycled " + connection.name + ":" + connection.port + " successfully!");
                                                        } else {
                                                            ToastsStore.error("Could not power cycle due to network connectivity issues.")
                                                        }
                                                    })
                                                }, 2000)
                                            } else {
                                                ToastsStore.error("Could not power cycle due to network connectivity issues.")
                                            }
                                        })
                                    }} />}<ReactTooltip /></Box></td>
                </tr>
            ))
        }
    }

    handleCancelRefreshPopupChange(offlineStorageAbbrev) {
        ToastsStore.success("Successfully " + this.props.match.params.storageSiteAbbrev ? "moved" : "updated" + " asset.");
        if (this.state.popupType === 'Move') {
            if (this.props.match.params.storageSiteAbbrev) {
                console.log("1")
                this.setState({
                    popupType: ""
                }, function () {
                    this.props.history.push('/assets/' + this.state.asset.assetID)
                });

            } else {
                console.log("2")
                this.setState({
                    popupType: ""
                }, function () {
                    this.props.history.push('/offlinestorage/' + offlineStorageAbbrev + '/' + this.state.asset.assetID)
                });
            }
        } else {
            console.log("3")
            window.location.reload();
        }
    }

    handleCancelPopupChange() {
        this.setState({
            popupType: ""
        });
    }

    render() {
        const { popupType } = this.state;
        let popup;

        if (popupType === 'Update') {
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>
                    <EditAssetForm
                        parentCallback={this.handleCancelRefreshPopupChange}
                        cancelCallback={this.handleCancelPopupChange}

                        popupMode={this.state.popupType}
                        updateIDFromParent={this.state.asset.assetID}
                        updateModelFromParent={this.state.asset.model}
                        updateHostnameFromParent={this.state.asset.hostname}
                        updateRackFromParent={this.state.asset.rack}
                        updateRackUFromParent={this.state.asset.rackU}
                        updateOwnerFromParent={this.state.asset.owner}
                        updateCommentFromParent={this.state.asset.comment}
                        updateDatacenterFromParent={this.state.asset.datacenter}
                        updateAssetIDFromParent={this.state.asset.assetID}
                        updateMacAddressesFromParent={assetmacutils.unfixMacAddressesForMACForm(this.state.asset.macAddresses)}
                        updatePowerConnectionsFromParent={this.state.asset.powerConnections}
                        updateNetworkConnectionsFromParent={assetnetworkportutils.networkConnectionsToArray(this.state.asset.networkConnections)}

                        updateDisplayColorFromParent={this.state.asset.variances.displayColor}
                        updateCpuFromParent={this.state.asset.variances.cpu}
                        updateMemoryFromParent={this.state.asset.variances.memory}
                        updateStorageFromParent={this.state.asset.variances.storage}
                    />
                </Layer>
            )
        } else if (popupType === 'Move') {
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>

                    <MoveAssetForm location={this.props.match.params.storageSiteAbbrev ? "offline" : "rack"} assetID={this.state.asset.assetID}
                        currentLocation={this.props.match.params.storageSiteAbbrev ? "offline storage site " + this.props.match.params.storageSiteAbbrev : "datacenter " + this.state.asset.datacenter + " on rack " + this.state.asset.rack + " at height " + this.state.asset.rackU}
                        success={this.handleCancelRefreshPopupChange} cancelCallback={this.handleCancelPopupChange} />
                </Layer>
            )
        }

        return (

            <Router>
                <React.Fragment>

                    {/* CHange exact path to be custom, also call this.props.InstanceIDFromparent */}
                    <Route path={`/assets/${this.props.match.params.assetID}`} />

                    <Grommet theme={theme} full className='fade'>
                        <Box fill background='light-2' overflow={"auto"}>
                            {popup}
                            <AppBar>
                                {/* {this.props.match.params.vendor} {this.props.match.params.modelNumber} */}
                                <BackButton alignSelf='start' this={this} />
                                <Heading alignSelf='center' level='4' margin={{
                                    top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                }}>{this.props.match.params.assetID}</Heading>
                                <UserMenu alignSelf='end' this={this} />
                            </AppBar>
                            <Box
                                align='start'
                                direction='row'
                                margin={{ left: 'medium', right: 'medium' }}
                                justify='start'>
                                <Box style={{
                                    borderRadius: 10,
                                    borderColor: '#EDEDED'
                                }}
                                    direction='row'
                                    background='#FFFFFF'
                                    width={'xxlarge'}
                                    justify='center'
                                    margin={{ top: 'medium', left: 'medium', right: 'medium' }}
                                    pad='small'>
                                    {(!this.state.initialLoaded
                                        ?
                                        <Box align="center"><Text>Please wait...</Text></Box>
                                        :
                                        <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }}
                                            direction='column' justify='start'>
                                            <Heading level='4' margin='none'>Asset Details</Heading>
                                            <table style={{ marginTop: '10px', marginBottom: '10px' }}>

                                                <tbody>


                                                    <tr>
                                                        <td><b>Hostname</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.asset.hostname === "" ? "N/A" : this.state.asset.hostname}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><b>Model</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.asset.model}</td>
                                                    </tr>
                                                    {this.generateVariancesTable()}
                                                    {/* make sure you've accounted for all fields */}
                                                    <tr>
                                                        <td><b>Model Vendor</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.model.vendor}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><b>Model Number</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.model.modelNumber}</td>
                                                    </tr>

                                                    {this.generateModelNetworkPortString()}

                                                    <tr>
                                                        <td><b>Model Power Ports</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.model.powerPorts}</td>
                                                    </tr>
                                                    {!this.props.match.params.storageSiteAbbrev && <tr>
                                                        <td><b>Datacenter</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.asset.datacenter || 'N/A'}</td>
                                                    </tr>}
                                                    {(this.bladeData
                                                        ?
                                                        <tr>
                                                            <td><b>Chassis Hostname</b></td>
                                                            <td style={{ textAlign: 'right' }}>{this.bladeData.rack}</td>
                                                        </tr>
                                                        :
                                                        <tr></tr>
                                                    )}
                                                    {(this.bladeData
                                                        ?
                                                        <tr>
                                                            <td><b>Slot</b></td>
                                                            <td style={{ textAlign: 'right' }}>{this.bladeData.rackU}</td>
                                                        </tr>
                                                        :
                                                        <tr></tr>
                                                    )}
                                                    {!this.props.match.params.storageSiteAbbrev && <tr>
                                                        <td><b>{!this.bladeData ? 'Rack' : 'Chassis Rack'}</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.asset.rack}</td>
                                                    </tr>}
                                                    {!this.props.match.params.storageSiteAbbrev && <tr>
                                                        <td><b>{!this.bladeData ? 'Rack U' : 'Chassis Rack U'}</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.asset.rackU}</td>
                                                    </tr>}
                                                    <tr>
                                                        <td><b>Owner</b></td>
                                                        <td style={{ textAlign: 'right' }}>@{this.state.asset.owner || 'N/A'}</td>
                                                    </tr>
                                                    {this.renderPDUStatus()}
                                                </tbody>
                                            </table>
                                            {(!this.bladeData && !this.props.match.params.storageSiteAbbrev) &&
                                                <Table>
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
                                                        {this.generateNetworkTable()}
                                                    </TableBody>
                                                </Table>
                                            }
                                            {(!this.bladeData && !this.props.match.params.storageSiteAbbrev) &&
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableCell scope="col" border="bottom">
                                                                <strong>Power Port Name</strong>
                                                            </TableCell>
                                                            <TableCell scope="col" border="bottom">
                                                                <strong>Connected PDU Side</strong>
                                                            </TableCell>
                                                            <TableCell scope="col" border="bottom">
                                                                <strong>Connected PDU Port</strong>
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {this.generatePowerTable()}
                                                    </TableBody>
                                                </Table>}

                                            {(!this.bladeData
                                                ?
                                                <Table>
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
                                                        {this.generateMACTable()}
                                                    </TableBody>
                                                </Table>
                                                :
                                                <Table></Table>
                                            )}


                                            <span style={{ maxHeight: 100, overflow: 'auto' }}>
                                                {this.state.asset.comment && this.state.asset.comment.split('\n').map((i, key) => {
                                                    return <div key={key}>{i}</div>
                                                })}
                                            </span>
                                            {(this.chassisSlots
                                                ?
                                                <Box flex margin={{ top: 'small', bottom: 'small' }}
                                                    direction='column' justify='start'>
                                                    <Heading level='4' margin='none'>Blade Chassis View</Heading>
                                                    <Box direction='column' flex alignSelf='stretch' style={{ marginTop: '15px' }}
                                                        gap='small' align='center'>
                                                        <BladeChassisView
                                                            chassisId={!this.bladeData ? this.state.asset.assetID : this.bladeData.chassisId}
                                                            chassisHostname={!this.bladeData ? this.state.asset.hostname : this.bladeData.rack}
                                                            chassisSlots={this.chassisSlots}
                                                            slot={!this.bladeData ? null : this.bladeData.rackU}
                                                        />
                                                    </Box>
                                                </Box>
                                                :
                                                <Box></Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                                {(!this.state.initialLoaded
                                    ?
                                    <Box></Box>
                                    :
                                    <Box style={{
                                        borderRadius: 10,
                                        borderColor: '#EDEDED'
                                    }}
                                        direction='row'
                                        background='#FFFFFF'
                                        width={'large'}
                                        margin={{ top: 'medium', left: 'medium', right: 'medium' }}
                                        pad='small'>
                                        <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }}
                                            direction='column' justify='start'>
                                            <Heading level='4' margin='none'>Asset Actions</Heading>
                                            <Box direction='column' flex alignSelf='stretch' style={{ marginTop: '15px' }}
                                                gap='small'>
                                                {(this.connectedPDU && !this.props.match.params.storageSiteAbbrev(userutils.doesLoggedInUserHavePowerPerm() || userutils.isLoggedInUserAdmin() || userutils.getLoggedInUserUsername() === this.state.asset.owner)) &&
                                                    <Box direction='column' flex alignSelf='stretch'
                                                        gap='small'>
                                                        <Button icon={<Power />} label="Power Asset On" onClick={() => {
                                                            this.turnAssetOn()
                                                        }} />
                                                        <Button icon={<Clear />} label="Power Asset Off" onClick={() => {
                                                            this.turnAssetOff()
                                                        }} />
                                                        <Button icon={<PowerCycle />} label="Power Cycle Asset" onClick={() => {
                                                            this.powerCycleAsset()
                                                        }} />
                                                    </Box>}
                                                {(userutils.isLoggedInUserAdmin() || userutils.doesLoggedInUserHaveAssetPerm(null) || userutils.doesLoggedInUserHaveAssetPerm(this.state.asset.datacenterAbbrev)) &&
                                                    <Button icon={<FormEdit />} label="Edit Asset" onClick={() => {
                                                        this.setState({
                                                            popupType: "Update"
                                                        })
                                                    }} />}
                                                {(userutils.isLoggedInUserAdmin() || userutils.doesLoggedInUserHaveAssetPerm(null) || userutils.doesLoggedInUserHaveAssetPerm(this.state.asset.datacenterAbbrev)) &&
                                                    <Button icon={<Transaction />} label="Move Asset" onClick={() => {
                                                        this.setState({
                                                            popupType: "Move"
                                                        })
                                                    }} />}
                                                <Button icon={<View />} label="View Model Details" onClick={() => {
                                                    this.props.history.push('/models/' + this.state.asset.vendor + '/' + this.state.asset.modelNum)
                                                }} />
                                                {!this.props.match.params.storageSiteAbbrev && <Button icon={<ShareOption />} label="Network Neighborhood" onClick={() => {
                                                    this.props.history.push('/networkneighborhood/' + this.props.match.params.assetID)
                                                }} />}
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                            <ToastsContainer store={ToastsStore} />
                        </Box>
                    </Grommet>
                </React.Fragment>
            </Router>

        )
    }
}
;
