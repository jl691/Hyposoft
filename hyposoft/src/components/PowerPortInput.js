import React, { Component } from 'react'
import { Button, Grommet, FormField, TextInput, Box, Select } from 'grommet'
import theme from "../theme";

export default class PowerPortInput extends Component {
    render() {
        return (
            <Box direction="column" gap="small" overflow="auto" background="light-2">

                <Select
                    margin="medium"
                    key={pduSideID}
                    // IS IT APPROPRIATE TO CALL THIS PDU SIDE
                    placeholder="PDU Side"
                    value={this.state.powerConnections[idx].pduSide}

                    options={["Left", "Right"]}

                    onChange={({ option }) => {
                        this.handleSelectChange(option, idx)

                    }}
                />
                {/* TODO: AUTOCOMPLETE/PICKLIST */}
                <FormField margin="medium" size="small" name="port" label="Port">
                    <TextInput name="port"
                        value={this.state.powerConnections.port}
                        required="true"
                        onChange={e => {
                            this.handleChange(e, idx)
                        }}

                    />

                </FormField>
                {/* TODO: add a toast success on adding a connection/ Otherwise, error pops up */}
                {/* The connect is confusing...how will the user know to connect each connection? Or enter everything then press ito nce? */}
                <Button onClick={this.handleConnect}
                    margin={{ horizontal: 'medium', vertical: 'small' }}
                    label="Validate Connection" />
            </Box>
        )
    }
}
