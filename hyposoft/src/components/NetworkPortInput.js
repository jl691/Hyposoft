import React, { Component } from 'react'
import { Grommet, FormField, TextInput, Box, Text} from 'grommet'
import theme from "../theme";

export default class PowerPortInput extends Component {


    render() {
        return(
        this.props.networkConnections.map((val, idx) => {
            return (
                <Grommet key={idx} theme={theme}>

                    <Box direction="column" gap="small" margin="large" overflow="auto" background="light-2">
                        {/* This is to clearly label number of power ports you've added */}
                        <Text>{idx + 1}</Text> 

                        {/* TODO: AUTOCOMPLETE/PICKLIST */}
                        <FormField
                            margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                            size="small" name="otherAsset" label="Connect to other asset">
                            <TextInput name="otherAsset"
                                //value={this.props.networkConnections.port}
                             
                                size="small"

                                //passing state up to AssetNetworkPortsForm
                                onChange={e => {
                                    this.props.handleTextCallback(e, idx)
                                }}
                            />
                        </FormField>

                        <FormField
                            margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                            size="small" name="otherPort" label="Other Asset Port">
                            <TextInput name="otherPort"
                                //value={this.props.networkConnections.port}
                        
                                size="small"

                                //passing state up to AssetNetworkPortsForm
                                onChange={e => {
                                    this.props.handleTextCallback(e, idx)
                                }}
                            />

                        </FormField>

                        <Text alignSelf="center"> connect to </Text>

                        <FormField
                            margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                            size="small" name="thisPort" label="This Asset Port">
                            <TextInput name="thisPort"
                               // value={this.props.networkConnections.port}
                             
                                size="small"

                                //passing state up to AssetNetworkPortsForm
                                onChange={e => {
                                    this.props.handleTextCallback(e, idx)
                                }}

                            />

                        </FormField>

                    </Box>

                </Grommet>
            )
        }))
    }
}
