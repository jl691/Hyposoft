import React, { Component } from 'react'
import { Grommet, Box, Text, FormField, TextInput } from 'grommet'
import theme from "../theme";

//Instead of validate connections, upon all fields for one set of inputs, have a toast that pops up with error message
//If the connection is not valid


export default class AssetNetworkPortsForm extends Component {

    constructor(props) {

        super(props);
        this.handleChange = this.handleChange.bind(this);

    }
    //Form validation/error catching: ???

    handleChange(e, idx) {
        //You are either typing into an output
        if (e.target.name === "otherAssetID" || e.target.name === "otherPort" || e.target.name === "thisPort") {

            let networkConnections = [...this.props.networkConnections]
            networkConnections[idx][e.target.name] = e.target.value
            this.setState({ port: e.target.value })

            //or it's something already 'submitted'
        } else {
            this.setState({ [e.target.name]: e.target.value })
        }
    }


    render() {
        let { networkConnections } = this.props
        // console.log(networkConnections)
        return (
            networkConnections.map((val, idx) => {
                return (
                    <Grommet key={idx} theme={theme}>

                        <Box direction="column" gap="small" overflow="auto" background="light-2">

                            <Text>{idx + 1}</Text>

                            {/* TODO: AUTOCOMPLETE/PICKLIST */}

                            <FormField
                                margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                                size="small" name="thisPort" label="This Asset Port">
                                <TextInput name="thisPort"
                                    // value={this.props.networkConnections.port}

                                    size="small"

                                    //passing state up to AssetNetworkPortsForm
                                    onChange={e => {
                                        this.handleChange(e, idx)
                                    }}

                                />

                            </FormField>

                            <Text weight="bold" margin="small" > Connect to </Text>

                            {/* TODO: AUTOCOMPLETE/PICKLIST */}
                            <FormField
                                margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                                size="small" name="otherAssetID" label="Other Asset">
                                <TextInput name="otherAssetID"
                                    //value={this.props.networkConnections.port}

                                    size="small"

                                    onChange={e => {
                                        this.handleChange(e, idx)
                                    }}
                                />
                            </FormField>

                            {/* TODO: AUTOCOMPLETE/PICKLIST */}
                            <FormField
                                margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                                size="small" name="otherPort" label="Other Asset Port">
                                <TextInput name="otherPort"
                                    //value={this.props.networkConnections.port}

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
