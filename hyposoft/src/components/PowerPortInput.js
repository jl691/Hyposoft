import React, { Component } from 'react'
import { Grommet, FormField, TextInput, Box, Select, Text} from 'grommet'
import theme from "../theme";

export default class PowerPortInput extends Component {


    render() {
        return(
        this.props.powerConnections.map((val, idx) => {
            return (
                <Grommet key={idx} theme={theme}>

                    <Box direction="column" gap="small" margin="medium" overflow="auto" background="light-2">
                        {/* This is to clearly label number of power ports you've added */}
                        <Text>{idx + 1}</Text> 

                        <Select
                            margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                            // IS IT APPROPRIATE TO CALL THIS PDU SIDE
                            placeholder="PDU Side"
                            value={this.props.powerConnections[idx].pduSide}

                            options={["Left", "Right"]}

                            ///passing state up to AssetPowerPortsForm
                            onChange={({ option }) => {
                                this.props.handleSelectCallback(option, idx)

                            }}
                        />
                        {/* TODO: AUTOCOMPLETE/PICKLIST */}
                        <FormField
                            margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                            size="small" name="port" label="Port">
                            <TextInput name="port"
                                value={this.props.powerConnections.port}
                                size="small"

                                //passing state up to AssetPowerPortsForm
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
