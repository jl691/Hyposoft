import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import {
    Button,
    Grommet,
    Heading,
    Box,
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TableBody, Text
} from 'grommet'
import { View, ShareOption } from "grommet-icons"
import * as decomutils from '../utils/decommissionutils'
import * as modelutils from '../utils/modelutils'
import theme from '../theme'
import BackButton from '../components/BackButton'
import BladeChassisView from '../components/BladeChassisView'
import AppBar from '../components/AppBar'
import UserMenu from '../components/UserMenu'
import { ToastsContainer, ToastsStore } from "react-toasts";

export default class DetailedDecommissionedAssetScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            asset: "",
            modelExists: undefined,
            initialLoaded: false,
        }
    }

    static contextTypes = {
        router: () => true, // replace with PropTypes.object if you use them
    }

    componentDidMount() {
        this.setState({
            asset: ""
        });
       //console.log(this.props.match.params.assetID);
        decomutils.getAssetDetails(
            this.props.match.params.assetID,
            asset => {

                //console.log(asset);
                this.setState({
                    asset: asset,

                    initialLoaded: true
                })

            })
    }

    generateNetworkTable() {
        if (this.state.asset.networkConnections && Object.keys(this.state.asset.networkConnections).length) {
            console.log(this.state.asset.networkConnections)
            return Object.keys(this.state.asset.networkConnections).map((connection) => (
                <TableRow>
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
       // console.log(this.state.asset.baseModel)
    

        return Object.keys(this.state.asset.variances).map((field) => (

            this.state.asset.variances[field] === "" ?
                <tr>
                    <td><b>Model {[field]} variance</b></td>
                    <td style={{ textAlign: 'right' }}>{"No variance. (Base value "+ this.state.asset.baseModel[field]+")"}</td>
                </tr>
                :

                <tr>
                    <td><b>Model {[field]} variance</b></td>
                    <td style={{ textAlign: 'right' }}>{this.state.asset.variances[field]+ "(Modified from base value " + this.state.asset.baseModel[field] + ")" }</td>
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

    doesModelExist() {
        if (this.state.asset.vendor && this.state.asset.modelNumber && this.state.modelExists === undefined) {
            modelutils.doesModelDocExist(this.state.asset.vendor, this.state.asset.modelNumber, exist => {
                this.setState({ modelExists: exist })
            })
        }
    }

    render() {
        //console.log(this.props.match.params.assetID)
        return (

            <Router>
                <React.Fragment>

                    {/* CHange exact path to be custom, also call this.props.InstanceIDFromparent */}
                    <Route path={`/decommissioned/${this.props.match.params.assetID}`} />

                    <Grommet theme={theme} full className='fade'>
                        <Box fill background='light-2' overflow={"auto"}>
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
                                            <Heading level='4' margin='none'>Decommissioned Asset Details</Heading>
                                            <table style={{ marginTop: '10px', marginBottom: '10px' }}>
                                                <tbody>
                                                    <tr>
                                                        <td><b>Date and Time (EST)</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.asset.date}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><b>Hostname</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.asset.hostname}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><b>Model</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.asset.model}</td>
                                                    </tr>
                                                    {this.generateVariancesTable()}

                                                    <tr>
                                                        <td><b>Datacenter</b></td>
                                                        <td style={{ textAlign: 'right' }}>{this.state.asset.datacenter || 'N/A'}</td>
                                                    </tr>
                                                    {(this.state.asset.chassisParams && this.state.asset.chassisParams.slot
                                                        ?
                                                        <tr>
                                                            <td><b>Chassis Hostname</b></td>
                                                            <td style={{ textAlign: 'right' }}>{this.state.asset.chassisParams.chassisHostname}</td>
                                                        </tr>
                                                        :
                                                        <tr></tr>
                                                    )}
                                                    {(this.state.asset.chassisParams && this.state.asset.chassisParams.slot
                                                        ?
                                                        <tr>
                                                            <td><b>Slot</b></td>
                                                            <td style={{ textAlign: 'right' }}>{this.state.asset.chassisParams.slot}</td>
                                                        </tr>
                                                        :
                                                        <tr></tr>
                                                    )}
                                               <tr>
                                                   <td><b>{!(this.state.asset.chassisParams && this.state.asset.chassisParams.slot) ? 'Rack' : 'Chassis Rack'}</b></td>
                                                   <td style={{textAlign: 'right'}}>{this.state.asset.rack}</td>
                                               </tr>
                                               <tr>
                                                   <td><b>{!(this.state.asset.chassisParams && this.state.asset.chassisParams.slot) ? 'Rack U' : 'Chassis Rack U'}</b></td>
                                                   <td style={{textAlign: 'right'}}>{this.state.asset.rackU}</td>
                                               </tr>
                                               <tr>
                                                   <td><b>Demoted By</b></td>
                                                   <td style={{textAlign: 'right'}}>@{this.state.asset.name}</td>
                                               </tr>
                                               <tr>
                                                   <td><b>Owner</b></td>
                                                   <td style={{textAlign: 'right'}}>@{this.state.asset.owner || 'N/A'}</td>
                                               </tr>
                                               </tbody>
                                           </table>
                                           {(

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

                                           )}
                                           {(!(this.state.asset.chassisParams && this.state.asset.chassisParams.slot)
                                                ?
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
                                                </Table>
                                                :
                                                <Table></Table>
                                            )}
                                            {(!(this.state.asset.chassisParams && this.state.asset.chassisParams.slot)
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
                                            {(this.state.asset.chassisParams
                                                ?
                                                <Box flex margin={{ top: 'small', bottom: 'small' }}
                                                    direction='column' justify='start'>
                                                    <Heading level='4' margin='none'>Blade Chassis View</Heading>
                                                    <Box direction='column' flex alignSelf='stretch' style={{ marginTop: '15px' }}
                                                        gap='small' align='center'>
                                                        <BladeChassisView
                                                            chassisId={this.state.asset.chassisParams.chassisId}
                                                            chassisHostname={this.state.asset.chassisParams.chassisHostname}
                                                            chassisSlots={this.state.asset.chassisParams.chassisSlots}
                                                            slot={this.state.asset.chassisParams.slot}
                                                            notClickable={true}
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
                                                {(this.state.modelExists ? <Button icon={<View />} label="View Model Details" onClick={() => {
                                                    this.props.history.push('/models/' + this.state.asset.vendor + '/' + this.state.asset.modelNumber)
                                                }} /> : <Box>{this.doesModelExist()}</Box>)}
                                                <Button icon={<ShareOption />} label="Network Neighborhood" onClick={() => {
                                                    this.props.history.push('/networkneighborhood/' + this.props.match.params.assetID)
                                                }} />
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
