import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Button, Grommet, Heading, Box, List } from 'grommet'
import * as instutils from '../utils/assetutils'
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
        instutils.getAssetDetails(
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
                        <Box>
                            <AppBar>
                            {/* {this.props.match.params.vendor} {this.props.match.params.modelNumber} */}
                                <BackButton alignSelf='start' this={this} />
                                <Heading alignSelf='center' level='4' margin={{
                                    top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                }} >Detailed Asset View</Heading>
                                <UserMenu alignSelf='end' this={this} />
                            </AppBar>
                            <List
                                margin="medium"
                                primaryKey="category"
                                secondaryKey="value"
                                data={[
                                    { category: "Asset", value: this.props.match.params.assetID },
                                    { category: "Model", value: this.state.asset.model },
                                    { category: "Hostname", value: this.state.asset.hostname },
                                    { category: "Rack", value: this.state.asset.rack },
                                    { category: "RackU", value: this.state.asset.rackU },
                                    { category: "Owner", value: this.state.asset.owner },
                                    { category: "Comment", value: this.state.asset.comment },

                                ]}
                            />

                            <Box direction="row">
                            
                    
                                <Link to={`/models/${this.state.asset.vendor}/${this.state.asset.modelNum}`}>
                                    <Button
                                        label="View model details"
                                        onClick={new ModelPermaScreen()}

                                    />
                                    {/* this.props.history.push */}
                                </Link>

                            </Box>

                        </Box>
                    </Grommet>
                </React.Fragment>
            </Router>

        )
    }
}
