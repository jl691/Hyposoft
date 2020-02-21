import React, { Component } from 'react'
import { Grommet, FormField, TextInput, Box, Select, Text } from 'grommet'
import theme from "../theme";


export default class AssetPowerPortsForm extends Component {

    constructor(props) {

        super(props);


        this.handleChange = this.handleChange.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);

    }
    //Form validation/error catching: user can keep adding power connections, but in the end, need to limit the number 
    //of connections to be equal to the number of power ports on the model. So if you try to add another connection and it
    //exceeds the number of power ports on model, will throw a toast error
    //This means in the backend, need to pass in the model to get the number of power ports


    handleChange(e, idx) {
        //You are either typing into an output
        if (e.target.name === "port") {
            console.log("two")
            let powerConnections = [...this.props.powerConnections]
            powerConnections[idx][e.target.name] = e.target.value
            this.setState({ port: e.target.value })
            console.log(this.props.powerConnections[idx])

            //or it's something already 'submitted'
        } else {
            console.log("three")
            this.setState({ [e.target.name]: e.target.value })
        }
    }


    handleSelectChange(selectedOption, idx) {

        let powerConnections = [...this.props.powerConnections]
        powerConnections[idx].pduSide = selectedOption
        this.setState({ pduSide: selectedOption })
        console.log(this.props.powerConnections[idx])

    }


    //TODO:
    //If user fills out, must be all or nothing? Or will users know if they jsut pick left, it will be symmetric?
    render() {
        let { powerConnections } = this.props
        return (
            powerConnections.map((val, idx) => {
                return (
                    <Grommet key={idx} theme={theme}>

                        <Box direction="column" gap="small" overflow="auto" background="light-2">
                            <Text>{idx + 1}</Text>

                            <Select
                                margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                                // IS IT APPROPRIATE TO CALL THIS PDU SIDE
                                placeholder="PDU Side"
                                value={this.props.powerConnections[idx].pduSide}

                                options={["Left", "Right"]}
                                onChange={({ option }) => {
                                    this.handleSelectChange(option, idx)

                                }}
                            />
                            {/* TODO: AUTOCOMPLETE/PICKLIST */}
                            <FormField
                                margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                                size="small" name="port" label="Port">
                                <TextInput name="port"
                                    //value={this.props.powerConnections.port}
                                    size="small"
                                    onChange={e => {
                                        this.handleChange(e, idx)
                                    }}

                                />

                            </FormField>

                        </Box>

                    </Grommet >


                )
            })
        )
    }
}
