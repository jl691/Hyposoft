import React, { Component } from 'react'
import { Grommet, Box, Text, FormField, TextInput } from 'grommet'
import * as assetmacutils from '../utils/assetmacutils'
import theme from "../theme";

//Instead of validate connections, upon all fields for one set of inputs, have a toast that pops up with error message
//If the connection is not valid


export default class AssetMACForm extends Component {
    state = {
        macTextFields: []
    }


    constructor(props) {

        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.createForm = this.createForm.bind(this);
        //This was an anonymous function, but this.setState was not working. Give name to anon function, move out of the method it was in (so it gets a class scope) and htne bind
        this.createFormCallback = this.createFormCallback.bind(this);


    }
    //Form validation/error catching: ???

    //Need to handle change: pass state back up
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

    createFormCallback(status, idx) {

        //create a bunch of new macAddress objects {}
        const fields = status.map((port) => (
            
            < FormField
                margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                size="small" name="macAddress" label={`Network Port Name: ${port}`} >
                <TextInput name="macAddress"
                    //value={this.props.macAddresses.port}
                    size="small"

                    onChange={e => {
                        this.handleChange(e, idx)
                    }}
                />
            </FormField >
        ))
        this.setState(oldState => ({
            ...oldState, macTextFields: fields
        }))
        //this.props.fieldCallback(fields)
    }

    createForm(model, idx) {

        assetmacutils.getNetworkPortLabels(model, status => this.createFormCallback(status, idx))

        //return <Text> Bitch</Text>

    }

    render() {
        //let { macAddresses } = this.props.macAddresses
        let idx = 0;
        let { model } = this.props.model
        console.log(model)

        //if(model!==""){
            this.createForm("HPE ProLiant DL20 Gen10", idx)


        //}
        

        return (

            <Grommet theme={theme}>

                <Box direction="column" gap="small" overflow="auto" background="light-2">


                    {this.state.macTextFields}

                </Box>

            </Grommet >


        )
    }
}
