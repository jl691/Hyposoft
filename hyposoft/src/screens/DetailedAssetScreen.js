import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Button, Grommet, Heading, Box, List } from 'grommet'
import * as assetutils from '../utils/assetutils'
import theme from '../theme'
import ModelPermaScreen from '../screens/ModelPermaScreen'
import BackButton from '../components/BackButton'
import AppBar from '../components/AppBar'
import UserMenu from '../components/UserMenu'

export default class DetailedAssetScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            asset: "",


        }
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

            })

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
                                             <tr><td><b>Hostname</b></td><td style={{textAlign: 'right'}}>{this.state.asset.hostname}</td></tr>
                                             <tr><td><b>Model</b></td><td style={{textAlign: 'right'}}>{this.state.asset.model}</td></tr>
                                             <tr><td><b>Datacenter</b></td><td style={{textAlign: 'right'}}>{this.state.asset.datacenter || 'N/A'}</td></tr>
                                             <tr><td><b>Rack</b></td><td style={{textAlign: 'right'}}>{this.state.asset.rack}</td></tr>
                                             <tr><td><b>Rack U</b></td><td style={{textAlign: 'right'}}>{this.state.asset.rackU}</td></tr>
                                             <tr><td><b>Owner</b></td><td style={{textAlign: 'right'}}>@{this.state.asset.owner || 'N/A'}</td></tr>
                                         </table>
                                         <span style={{maxHeight: 100, overflow: 'scroll'}}>
                                         {this.state.asset.comment && this.state.asset.comment.split('\n').map((i,key) => {
                                             return <div key={key}>{i}</div>
                                         })}
                                         </span>
                                         <Box direction='column' flex alignSelf='stretch' style={{marginTop: '15px'}} gap='small'>
                                             <Button label="View Model Details" onClick={() => {this.props.history.push('/models/'+this.state.asset.vendor+'/'+this.state.asset.modelNum)}} />
                                             <Button label="Network Neighborhood" onClick={() => {this.props.history.push('/networkneighborhood/' + this.props.match.params.assetID)}} />
                                         </Box>
                                     </Box>
                                 </Box>
                            </Box>

                        </Box>
                    </Grommet>
                </React.Fragment>
            </Router>

        )
    }
}
;