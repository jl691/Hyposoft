import React, { Component } from 'react'
import { Grommet, Box, Text, FormField, TextInput } from 'grommet'
import * as assetmacutils from '../utils/assetmacutils'
import theme from "../theme";

//Instead of validate connections, upon all fields for one set of inputs, have a toast that pops up with error message
//If the connection is not valid


export default class AssetMACForm extends Component {

    constructor(props) {

        super(props);
        this.handleChange = this.handleChange.bind(this);

    }
    //Form validation/error catching: ???

    handleChange(e, idx) {
        //You are either typing into an output
        if (e.target.name === "macAddress") {

            let macAddresses = [...this.props.macAddresses]
            macAddresses[idx][e.target.name] = e.target.value
            this.setState({ macAddress: e.target.value })
            //or it's something already 'submitted'
        } else {
            this.setState({ [e.target.name]: e.target.value })
        }
    }

    createForm(model, idx) {

        assetmacutils.getNetworkPortLabels(model, function (status) {

            console.log(status)
            return status.map((port) => (

                < FormField
                    margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                    size="small" name="macAddress" label={port} >
                    <TextInput name="macAddress"
                        //value={this.props.macAddresses.port}
                        size="small"

                        onChange={e => {
                            this.handleChange(e, idx)
                        }}
                    />
                </FormField >
            ))
        })

        //return <Text> Bitch</Text>

    }

    render() {
        let { macAddresses } = this.props.macAddresses
        let idx = 0;
        let { model } = this.props.model
        console.log(macAddresses)

        return (

            <Grommet theme={theme}>

                <Box direction="column" gap="small" overflow="auto" background="light-2">

                    {this.createForm("HPE ProLiant DL20 Gen10", idx)}

                </Box>

            </Grommet >


        )
    }
}
