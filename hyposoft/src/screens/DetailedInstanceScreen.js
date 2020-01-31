import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Button, Grommet, Form, FormField, Heading, TextInput, Box, List } from 'grommet'
import * as instutils from '../utils/instanceutils'
import theme from '../theme'

export default class DetailedInstanceScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            instance: "",


        }
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
        console.log(this.props.match.params.instanceID)
        return (

            <Router>
                <React.Fragment>
                 
                    {/* CHange exact path to be custom, also call this.props.InstanceIDFromparent */}
                    <Route path={`/instances/${this.props.match.params.instanceID}`} />

                    <Grommet theme={theme} full className='fade'>
                        <Box>

                            <Heading level="2"> Detailed Instance View </Heading>
                            <List
                                //TODO: clicking on model should lead to a detailed model view. Add "View model details button"
                                margin="medium"
                                primaryKey="category"
                                secondaryKey="value"
                                data={[
                                    //TODO: Need to make sure instanceID shows
                                    { category: "Instance", value: this.props.match.params.instanceID },
                                    { category: "Model", value: this.state.instance.model },
                                    { category: "Hostname", value: this.state.instance.hostname },
                                    { category: "Rack", value: this.state.instance.rack },
                                    { category: "RackU", value: this.state.instance.rackU },
                                    { category: "Owner", value: this.state.instance.owner },
                                    { category: "Comment", value: this.state.instance.comment },

                                ]}
                            />
                            <Box direction="row">
                                <Button
                                    margin="xlarge"
                                    label="Back to all instances"
                                    onClick={() => { }}

                                />
                                <Button
                                    margin="xlarge"
                                    label="View model details"
                                    onClick={() => { }}

                                />
                            </Box>



                        </Box>
                    </Grommet>
                </React.Fragment>
            </Router>

        )
    }
}
