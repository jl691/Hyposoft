import React from "react";
import theme from "../theme";
import { Box, Button, Grommet, Heading, Table, TableBody, TableCell, TableHeader, TableRow, Text } from "grommet";
import AppBar from "../components/AppBar";
import BackButton from "../components/BackButton";
import UserMenu from "../components/UserMenu";
import { ToastsContainer, ToastsStore } from "react-toasts";
import * as changeplanutils from "../utils/changeplanutils";
import * as userutils from "../utils/userutils";
import * as decommissionutils from "../utils/decommissionutils";
import DeleteChangeForm from "../components/DeleteChangeForm";
import * as changeplanconflictutils from '../utils/changeplanconflictutils'


class DetailedChangeScreen extends React.Component {

    changePlanID;
    stepID;
    conflictMessages = "";

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
        console.log(this.stepID)
        this.forceRefresh();
    }

    forceRefresh() {
        changeplanutils.getChangeDetails(this.props.match.params.changePlanID, this.props.match.params.stepID, userutils.getLoggedInUserUsername(), (result, executed, timestamp) => {
            if (result) {
                this.setState({
                    change: result,
                    executed: executed,
                    timestamp: timestamp
                }, function () {
                    this.generateConflict();
                });
            } else {
                console.log(result)
            }
        })
    }

    generateNetworkConnectionRow(old) {
        let thisState = old ? this.state.change.changes.networkConnections.old : this.state.change.changes.networkConnections.new;
        //console.log(this.state.change.changes.networkConnections.new)
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
                    return (
                        <TableRow>
                            <TableCell scope={"row"}>
                                {change}
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#ff4040", color: "#ffffff" }}>
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
                                        {this.generateNetworkConnectionRow(true)}
                                    </TableBody>
                                </Table>
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#00c781" }}>
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
                                        {this.generateNetworkConnectionRow(false)}
                                    </TableBody>
                                </Table>
                            </TableCell>
                        </TableRow>
                    )
                } else if (change === "powerConnections") {
                    return (
                        <TableRow>
                            <TableCell scope={"row"}>
                                powerConnections
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#ff4040", color: "#ffffff" }}>
                                <Table>
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
                                </Table>
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#00c781" }}>
                                <Table>
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
                                </Table>
                            </TableCell>
                        </TableRow>
                    )
                } else if (change === "macAddresses") {
                    return (
                        <TableRow>
                            <TableCell scope={"row"}>
                                macAddresses
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#ff4040", color: "#ffffff" }}>
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
                                        {this.generateMACRow(true)}
                                    </TableBody>
                                </Table>
                            </TableCell>
                            <TableCell style={{ backgroundColor: "#00c781" }}>
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
                                        {this.generateMACRow(false)}
                                    </TableBody>
                                </Table>
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
        console.log("in generate conflict", this.props.match.params.changePlanID, this.props.match.params.stepID)
        changeplanutils.getStepDocID(this.props.match.params.changePlanID, this.props.match.params.stepID, stepIDcallback => {
            if (stepIDcallback) {
                changeplanconflictutils.addAssetChangePlanPackage(
                    this.props.match.params.changePlanID,
                    stepIDcallback,
                    this.state.change.changes.model.new,
                    this.state.change.changes.hostname.new,
                    this.state.change.changes.datacenter.new,
                    this.state.change.changes.rack.new,
                    this.state.change.changes.rackU.new,
                    this.state.change.changes.owner.new,
                    this.state.change.assetID,
                    this.state.change.changes.powerConnections.new,
                    this.state.change.changes.networkConnections.new,
                    status => {
                        changeplanconflictutils.getErrorMessages(this.props.match.params.changePlanID, parseInt(this.props.match.params.stepID), errorMessages => {
                            this.setState({
                                conflictMessages: errorMessages
                            })
                            //this.conflictMessages = errorMessages;
                            console.log(errorMessages)

                        })


                    })
            }

        })

        // return (
        //     <Box style={{
        //         borderRadius: 10
        //     }} width={"large"} background={"status-error"} align={"center"} alignSelf={"center"}
        //         margin={{ top: "medium" }}>
        //         <Heading level={"3"} margin={"small"}>Conflict</Heading>
        //         <Box>
        //             <Text>
        //                 {console.log(this.conflictMessages)}
        //                 {this.conflictMessages}
        //             </Text>
        //         </Box>
        //         <Box align={"center"} width={"small"}>
        //             <Button primary label="Resolve" color={"light-1"} margin={{ top: "small", bottom: "small" }}
        //                 size={"small"} onClick={() => {

        //                 }} />
        //         </Box>
        //     </Box>
        // )
    }

    cancelPopup = (data) => {
        this.setState({
            popupType: ""
        })
    };

    callbackFunction = (data) => {
        window.location.href = "/changeplans/" + this.props.match.params.changePlanID;
    };

    render() {
        const { popupType } = this.state;
        let popup;
        // this.generateConflict()

        if (popupType === 'Delete') {
            popup = (
                <DeleteChangeForm cancelPopup={this.cancelPopup} forceRefresh={this.callbackFunction}
                    changePlanID={this.props.match.params.changePlanID} stepNumber={this.stepID} />
            )
        }

        return (
            <React.Fragment>
                <Grommet theme={theme} full className='fade'>
                    <Box fill background='light-2'>
                        <AppBar>
                            <BackButton alignSelf='start' this={this} />
                            <Heading alignSelf='center' level='4' margin={{
                                top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                            }}>{this.props.match.params.assetID}</Heading>
                            <UserMenu alignSelf='end' this={this} />
                        </AppBar>
                        {/*{this.generateConflict()}*/}
                        {this.state.executed && <Box style={{
                            borderRadius: 10
                        }} width={"large"} background={"status-ok"} align={"center"} alignSelf={"center"}
                            margin={{ top: "medium" }}>
                            <Heading level={"3"} margin={"small"}>Change Plan Executed</Heading>
                            <Box>This change plan was executed on {decommissionutils.getDate(this.state.timestamp)}. Thus, no further changes can be made.</Box>
                        </Box>}

                        { this.state.conflictMessages !== "" && <Box style={{
                            borderRadius: 10
                        }} width={"large"} background={"status-error"} align={"center"} alignSelf={"center"}
                            margin={{ top: "medium" }}>
                            <Heading level={"3"} margin={"small"}>Conflict</Heading>
                            <Box>
                                {/*{console.log(this.conflictMessages)}*/}
                                    {this.state.conflictMessages}
                                
                            </Box>
                            <Box align={"center"} width={"small"}>
                                <Button primary label="Resolve" color={"light-1"} margin={{ top: "small", bottom: "small" }}
                                    size={"small"} onClick={() => {

                                    }} />
                            </Box>
                        </Box>
                        }

                        <Box

                            align='center'
                            direction='row'
                            margin={{ left: 'medium', right: 'medium' }}
                            justify='center'>

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
                                    {!this.state.executed && <Box direction='column' flex alignSelf='stretch' style={{ marginTop: '15px' }}
                                        gap='small'>
                                        <Button label="Edit Change" onClick={() => {

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