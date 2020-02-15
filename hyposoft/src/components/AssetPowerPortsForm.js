import React, { Component } from 'react'
import { Button, Grommet, Form, FormField, TextInput, Box, Select, Text } from 'grommet'
import theme from "../theme";


export default class AssetPowerPortsForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            powerConnections: [{ 
                
                pduSide: "", 
                port: "" 
            }],

        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);
        this.handleConnect = this.handleConnect.bind(this);
        this.addPowerConnection = this.addPowerConnection.bind(this);
    }
    //Form validation/error catching: user can keep adding power connections, but in the end, need to limit the number 
    //of connections to be equal to the number of power ports on the model. So if you try to add another connection and it
    //exceeds the number of power ports on model, will throw a toast error
    //This means in the backend, need to pass in the model to get the number of power ports

    handleChange(e) {
        //You are either typing into an output
        if (e.target.name === "port") {
            let powerConnections = [...this.state.powerConnections]
            powerConnections[e.target.dataset.id][e.target.name] = e.target.value
            this.setState({ powerConnections }, () => console.log(this.state.powerConnections))

            //or it's something already 'submitted'
        } else {
            this.setState({ [e.target.name]: e.target.value })
        }
    }

    handleConnect(event) {


    }

    handleSelectChange(selectedOption, event) {
        console.log(this.state)
        console.log(selectedOption)
        let powerConnections = [...this.state.powerConnections]
            powerConnections[event.target.dataset.id].pduSide = selectedOption
        this.setState(this.state.powerConnections.pduSide = selectedOption)

    }

    addPowerConnection(event) {
        this.setState((prevState) => ({
            powerConnections: [...prevState.powerConnections, { pduSide: "", port: "" }],
        }));

    }

    render() {
        let { powerConnections } = this.state

        console.log(this.state.powerConnections)
        return (
            powerConnections.map((val, idx) => {
                //let pduSideID = `pduSide-${idx}`, portID = `port-${idx}`
                return (
                    <Grommet theme={theme}>
                        <Box key={idx} direction="column" gap="xxsmall" overflow="auto">
                            <Text>Power Connections</Text>
                    
                                <Select
                               // labelKey={pduSideID}
                                placeholder="PDU Side"
                                    value={this.state.powerConnections[idx].pduSide}

                                    options={["Left", "Right"]}

                                    onChange={({option}, event) => {
                                        this.handleSelectChange(option, event)

                                    }}
                                />
                                {/* TODO: AUTOCOMPLETE/PICKLIST */}
                                <FormField name="port" label="Port">
                                    <TextInput padding="medium" name="hostname"
                                        onChange={this.handleChange}
                                     value={this.state.powerConnections.port} 
                                    />

                                </FormField>
                      

                        </Box>
                        <Button onClick={this.addPowerConnection}
                            margin="small"
                            label="Add a power connection" />
                        {/* TODO: add a toast success on adding a connection/ Otherwise, error pops up */}
                        <Button onClick={this.handleConnect} margin="small"
                            label="Connect" />
                    </Grommet>


                )
            })
        )
    }
}
