import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Button, Grommet, Heading, Box, List } from 'grommet'
import * as instutils from '../utils/instanceutils'
import theme from '../theme'
import ModelPermaScreen from '../screens/ModelPermaScreen'
import BackButton from '../components/BackButton'
import AppBar from '../components/AppBar'
import UserMenu from '../components/UserMenu'

export default class DetailedInstanceScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            instance: "",


        }
    }
    static contextTypes = {
        router: () => true, // replace with PropTypes.object if you use them
    }
    componentDidMount() {
        console.log("DetailedInstanceScreen")
        this.setState({
            instance: ""
        })
        instutils.getInstanceDetails(
            this.props.match.params.instanceID,
            instancesdb => {
                this.setState({
                    instance: instancesdb

                })

            })

    }

    render() {
        console.log(this.state.instance)
        console.log(this.props.match.params.instanceID)
        return (

            <Router>
                <React.Fragment>

                    {/* CHange exact path to be custom, also call this.props.InstanceIDFromparent */}
                    <Route path={`/instances/${this.props.match.params.instanceID}`} />

                    <Grommet theme={theme} full className='fade'>
                        <Box fill background='light-2'>
                            <AppBar>
                            {/* {this.props.match.params.vendor} {this.props.match.params.modelNumber} */}
                                <BackButton alignSelf='start' this={this} />
                                <Heading alignSelf='center' level='4' margin={{
                                    top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                }} ></Heading>
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
                                         <Heading level='4' margin='none'>Instance Details</Heading>
                                         <table style={{marginTop: '10px', marginBottom: '10px'}}>
                                             <tr><td><b>Hostname</b></td><td style={{textAlign: 'right'}}>{this.state.instance.hostname}</td></tr>
                                             <tr><td><b>Model</b></td><td style={{textAlign: 'right'}}>{this.state.instance.model}</td></tr>
                                             <tr><td><b>Rack</b></td><td style={{textAlign: 'right'}}>{this.state.instance.rack}</td></tr>
                                             <tr><td><b>Rack U</b></td><td style={{textAlign: 'right'}}>{this.state.instance.rackU}</td></tr>
                                             <tr><td><b>Owner</b></td><td style={{textAlign: 'right'}}>@{this.state.instance.owner || 'N/A'}</td></tr>
                                         </table>
                                         <span style={{maxHeight: 100, overflow: 'scroll'}}>
                                         {this.state.instance.comment && this.state.instance.comment.split('\n').map((i,key) => {
                                             return <div key={key}>{i}</div>
                                         })}
                                         </span>
                                         <Box direction='column' flex alignSelf='stretch' style={{marginTop: '15px'}} gap='small'>
                                             <Button label="View Model Details" onClick={() => {this.props.history.push('/models/'+this.state.instance.vendor+'/'+this.state.instance.modelNum)}} />
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
