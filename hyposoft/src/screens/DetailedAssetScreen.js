import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {Button, Grommet, Heading, Box, List, CheckBox} from 'grommet'
import * as assetutils from '../utils/assetutils'
import * as powerutils from '../utils/powerutils'
import theme from '../theme'
import ModelPermaScreen from '../screens/ModelPermaScreen'
import BackButton from '../components/BackButton'
import AppBar from '../components/AppBar'
import UserMenu from '../components/UserMenu'
import {PowerCycle} from "grommet-icons";
import {ToastsContainer, ToastsStore} from "react-toasts";

export default class DetailedAssetScreen extends Component {

    powerPorts;

    constructor(props) {
        super(props);
        this.state = {
            asset: "",
            powerMap: false
        }

        this.generatePDUStatus = this.generatePDUStatus.bind(this);
    }
    static contextTypes = {
        router: () => true, // replace with PropTypes.object if you use them
    }
    componentDidMount() {
        console.log("DetailedAssetScreen")
        this.setState({
            asset: ""
        })
        assetutils.getAssetDetails(
            this.props.match.params.assetID,
            assetsdb => {
                this.setState({
                    asset: assetsdb

                })
                this.generatePDUStatus()
            })

    }

    generatePDUStatus() {
        this.powerPorts = [];
        if(this.state.asset.datacenterAbbrev.toUpperCase() === "RTP1" && this.state.asset.powerConnections && this.state.asset.powerConnections.length){
            ToastsStore.info("Click a refresh button by a PDU status to power cycle it.", 5000);
            Object.keys(this.state.asset.powerConnections).forEach(pduConnections => {
                let formattedNum;
                if(this.state.asset.rackNum.toString().length === 1){
                    formattedNum = "0" + this.state.asset.rackNum;
                } else {
                    formattedNum = this.state.asset.rackNum;
                }
                powerutils.getPortStatus("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                    let toggle = result === "ON" ? true: false;
                    this.powerPorts.push({
                        name: "hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0),
                        port: this.state.asset.powerConnections[pduConnections].port
                    });
                    this.setState({
                        ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: toggle
                    })
                    // this.state.powerStatuses.set("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port, toggle);
                    if(this.powerPorts.length === Object.keys(this.state.asset.powerConnections).length){
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
            if(this.state.asset.rackNum.toString().length === 1){
                formattedNum = "0" + this.state.asset.rackNum;
            } else {
                formattedNum = this.state.asset.rackNum;
            }
            powerutils.powerPortOn("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                if(result){
                    this.setState({
                        ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: true
                    });
                    count++;
                    if(count === Object.keys(this.state.asset.powerConnections).length){
                        ToastsStore.success("Successfully turned on the asset!")
                    }
                }
            })
        })
    }

    turnAssetOff() {
        let count = 0;
        Object.keys(this.state.asset.powerConnections).forEach(pduConnections => {
            let formattedNum;
            if(this.state.asset.rackNum.toString().length === 1){
                formattedNum = "0" + this.state.asset.rackNum;
            } else {
                formattedNum = this.state.asset.rackNum;
            }
            powerutils.powerPortOff("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                if(result){
                    this.setState({
                        ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: false
                    });
                    count++;
                    if(count === Object.keys(this.state.asset.powerConnections).length){
                        ToastsStore.success("Successfully turned off the asset!")
                    }
                }
            })
        })
    }

    powerCycleAsset(){
        let count = 0;
        Object.keys(this.state.asset.powerConnections).forEach(pduConnections => {
            let formattedNum;
            if(this.state.asset.rackNum.toString().length === 1){
                formattedNum = "0" + this.state.asset.rackNum;
            } else {
                formattedNum = this.state.asset.rackNum;
            }
            powerutils.powerPortOff("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                if(result){
                    this.setState({
                        ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: false
                    });
                    count++;
                    if(count === Object.keys(this.state.asset.powerConnections).length){
                        setTimeout(() => {
                            count = 0;
                            Object.keys(this.state.asset.powerConnections).forEach(pduConnections => {
                                let formattedNum;
                                if(this.state.asset.rackNum.toString().length === 1){
                                    formattedNum = "0" + this.state.asset.rackNum;
                                } else {
                                    formattedNum = this.state.asset.rackNum;
                                }
                                powerutils.powerPortOn("hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0), this.state.asset.powerConnections[pduConnections].port, (result) => {
                                    if(result){
                                        this.setState({
                                            ["hpdu-rtp1-" + this.state.asset.rackRow + formattedNum + this.state.asset.powerConnections[pduConnections].pduSide.charAt(0) + ":" + this.state.asset.powerConnections[pduConnections].port]: true
                                        });
                                        count++;
                                        if(count === Object.keys(this.state.asset.powerConnections).length){
                                            ToastsStore.success("Successfully power cycled the asset!")
                                        }
                                    }
                                })
                            })
                        }, 2000);
                    }
                }
            })
        })
    }

    renderPDUStatus(){
        if(this.state.powerMap){
            return this.powerPorts.map((connection) => (
                <tr><td><b>{connection.name}:{connection.port}</b></td><td style={{float: "right"}}><Box direction={"row"} alignSelf={"end"}><CheckBox toggle={true} checked={this.state[connection.name + ":" + connection.port]} onChange={(e) => {
                    if(this.state[connection.name + ":" + connection.port]){
                        console.log("1")
                        //on, power off
                        powerutils.powerPortOff(connection.name, connection.port, result => {
                            console.log(result)
                            if(result){
                                this.setState({
                                    [connection.name + ":" + connection.port]: false
                                });
                                ToastsStore.success("Turned " + connection.name + ":" + connection.port + " off successfully!");
                            }
                        })
                    } else {
                        console.log("2")
                        //off, power on
                        powerutils.powerPortOn(connection.name, connection.port, result => {
                            console.log(result)
                            if(result){
                                this.setState({
                                    [connection.name + ":" + connection.port]: true
                                });
                                ToastsStore.success("Turned " + connection.name + ":" + connection.port + " on successfully!");
                            }
                        })
                    }
                }}/><PowerCycle size={"medium"} style={{marginLeft: "10px", cursor: "pointer"}} onClick={(e) => {
                    ToastsStore.success("Power cycling " + connection.name + ":" + connection.port + ". Please wait!");
                    powerutils.powerPortOff(connection.name, connection.port, result => {
                        if(result){
                            this.setState({
                                [connection.name + ":" + connection.port]: false
                            });
                            setTimeout(() => {
                                powerutils.powerPortOn(connection.name, connection.port, result => {
                                    if(result){
                                        this.setState({
                                            [connection.name + ":" + connection.port]: true
                                        });
                                        ToastsStore.success("Power cycled " + connection.name + ":" + connection.port + " successfully!");
                                    }
                                })
                            }, 2000)
                        }
                    })
                }}/></Box></td></tr>
            ))
        }
    }

    render() {
        console.log(this.props.match.params.assetID)
        return (

            <Router>
                <React.Fragment>

                    {/* CHange exact path to be custom, also call this.props.InstanceIDFromparent */}
                    <Route path={`/assets/${this.props.match.params.assetID}`} />

                    <Grommet theme={theme} full className='fade'>
                        <Box fill background='light-2'>
                            <AppBar>
                            {/* {this.props.match.params.vendor} {this.props.match.params.modelNumber} */}
                                <BackButton alignSelf='start' this={this} />
                                <Heading alignSelf='center' level='4' margin={{
                                    top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                }} >{this.props.match.params.assetID}</Heading>
                                <UserMenu alignSelf='end' this={this} />
                            </AppBar>
                            <Box

                                align='center'
                                direction='row'
                                margin={{left: 'medium', right: 'medium'}}
                                justify='center' >
                                <Box style={{
                                         borderRadius: 10,
                                         borderColor: '#EDEDED'
                                     }}
                                     direction='row'

                                     background='#FFFFFF'
                                     width={'medium'}
                                     margin={{top: 'medium', left: 'medium', right: 'medium'}}
                                     pad='small' >
                                     <Box flex margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}} direction='column' justify='start'>
                                         <Heading level='4' margin='none'>Asset Details</Heading>
                                         <table style={{marginTop: '10px', marginBottom: '10px'}}>
                                             <tbody>
                                             <tr><td><b>Hostname</b></td><td style={{textAlign: 'right'}}>{this.state.asset.hostname}</td></tr>
                                             <tr><td><b>Model</b></td><td style={{textAlign: 'right'}}>{this.state.asset.model}</td></tr>
                                             <tr><td><b>Datacenter</b></td><td style={{textAlign: 'right'}}>{this.state.asset.datacenter || 'N/A'}</td></tr>
                                             <tr><td><b>Rack</b></td><td style={{textAlign: 'right'}}>{this.state.asset.rack}</td></tr>
                                             <tr><td><b>Rack U</b></td><td style={{textAlign: 'right'}}>{this.state.asset.rackU}</td></tr>
                                             <tr><td><b>Owner</b></td><td style={{textAlign: 'right'}}>@{this.state.asset.owner || 'N/A'}</td></tr>
                                             {this.renderPDUStatus()}
                                             </tbody>
                                         </table>
                                         <span style={{maxHeight: 100, overflow: 'scroll'}}>
                                         {this.state.asset.comment && this.state.asset.comment.split('\n').map((i,key) => {
                                             return <div key={key}>{i}</div>
                                         })}
                                         </span>
                                         <Box direction='column' flex alignSelf='stretch' style={{marginTop: '15px'}} gap='small'>
                                             <Button label="Power Asset On" onClick={() => {this.turnAssetOn()}} />
                                             <Button label="Power Asset Off" onClick={() => {this.turnAssetOff()}} />
                                             <Button label="Power Cycle Asset" onClick={() => {this.powerCycleAsset()}} />
                                             <Button label="View Model Details" onClick={() => {this.props.history.push('/models/'+this.state.asset.vendor+'/'+this.state.asset.modelNum)}} />
                                             <Button label="Network Neighborhood" onClick={() => {this.props.history.push('/networkneighborhood/' + this.props.match.params.assetID)}} />
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
;