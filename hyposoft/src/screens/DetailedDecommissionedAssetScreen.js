import React, {Component} from 'react'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import {
    Button,
    Grommet,
    Heading,
    Box,
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TableBody
} from 'grommet'
import * as decomutils from '../utils/decommissionutils'
import theme from '../theme'
import BackButton from '../components/BackButton'
import AppBar from '../components/AppBar'
import UserMenu from '../components/UserMenu'
import {ToastsContainer, ToastsStore} from "react-toasts";

export default class DetailedDecommissionedAssetScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            asset: ""
        }
    }

    static contextTypes = {
        router: () => true, // replace with PropTypes.object if you use them
    }

    componentDidMount() {
        this.setState({
            asset: ""
        });
        console.log(this.props.match.params.assetID);
        decomutils.getAssetDetails(
            this.props.match.params.assetID,
            asset => {
              this.setState({
                asset: asset
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

    render() {
        console.log(this.props.match.params.assetID)
        return (

            <Router>
                <React.Fragment>

                    {/* CHange exact path to be custom, also call this.props.InstanceIDFromparent */}
                    <Route path={`/decommissioned/${this.props.match.params.assetID}`}/>

                    <Grommet theme={theme} full className='fade'>
                        <Box fill background='light-2'>
                            <AppBar>
                                {/* {this.props.match.params.vendor} {this.props.match.params.modelNumber} */}
                                <BackButton alignSelf='start' this={this}/>
                                <Heading alignSelf='center' level='4' margin={{
                                    top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                }}>{this.props.match.params.assetID}</Heading>
                                <UserMenu alignSelf='end' this={this}/>
                            </AppBar>
                            <Box

                                align='center'
                                direction='row'
                                margin={{left: 'medium', right: 'medium'}}
                                justify='center'>
                                <Box style={{
                                    borderRadius: 10,
                                    borderColor: '#EDEDED'
                                }}
                                     direction='row'

                                     background='#FFFFFF'
                                     width={'medium'}
                                     margin={{top: 'medium', left: 'medium', right: 'medium'}}
                                     pad='small'>
                                    <Box flex margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                         direction='column' justify='start'>
                                        <Heading level='4' margin='none'>Decommissioned Asset Details</Heading>
                                        <table style={{marginTop: '10px', marginBottom: '10px'}}>
                                            <tbody>
                                            <tr>
                                                <td><b>Date and Time (EST)</b></td>
                                                <td style={{textAlign: 'right'}}>{this.state.asset.date}</td>
                                            </tr>
                                            <tr>
                                                <td><b>Hostname</b></td>
                                                <td style={{textAlign: 'right'}}>{this.state.asset.hostname}</td>
                                            </tr>
                                            <tr>
                                                <td><b>Model</b></td>
                                                <td style={{textAlign: 'right'}}>{this.state.asset.model}</td>
                                            </tr>
                                            <tr>
                                                <td><b>Datacenter</b></td>
                                                <td style={{textAlign: 'right'}}>{this.state.asset.datacenter || 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td><b>Rack</b></td>
                                                <td style={{textAlign: 'right'}}>{this.state.asset.rack}</td>
                                            </tr>
                                            <tr>
                                                <td><b>Rack U</b></td>
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
                                                {this.generatePowerTable()}
                                            </TableBody>
                                        </Table>
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
                                        <span style={{maxHeight: 100, overflow: 'auto'}}>
                                         {this.state.asset.comment && this.state.asset.comment.split('\n').map((i, key) => {
                                             return <div key={key}>{i}</div>
                                         })}
                                         </span>
                                        <Box direction='column' flex alignSelf='stretch' style={{marginTop: '15px'}}
                                             gap='small'>
                                            <Button label="View Model Details" onClick={() => {
                                                this.props.history.push('/models/' + this.state.asset.vendor + '/' + this.state.asset.modelNumber)
                                            }}/>
                                            <Button label="Network Neighborhood" onClick={() => {
                                                this.props.history.push('/networkneighborhood/' + this.props.match.params.assetID)
                                            }}/>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                            <ToastsContainer store={ToastsStore}/>
                        </Box>
                    </Grommet>
                </React.Fragment>
            </Router>
        )
    }
}
