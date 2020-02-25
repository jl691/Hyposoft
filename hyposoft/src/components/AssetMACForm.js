import React, { Component } from 'react'
import { Grommet, Box, Text, FormField, TextInput } from 'grommet'
import * as assetmacutils from '../utils/assetmacutils'
import * as modelutils from '../utils/modelutils'
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
    handleChange(e, idx, port) {
        //You are either typing into an output
        if (e.target.name === "macAddress") {

            let macAddresses = [...this.props.macAddresses]
            console.log(macAddresses)

            if (macAddresses[idx]) {
                macAddresses[idx][e.target.name]= e.target.value 
                macAddresses[idx]["networkPort"]= port 

                this.setState({ macAddress: e.target.value })
            }
            else {
                macAddresses[idx][e.target.name]= e.target.value 
                macAddresses[idx]["networkPort"]= port 

                this.setState({ macAddress: e.target.value })

            }
   


        } else {

            this.setState({ [e.target.name]: e.target.value, networkPort: port })
        }
    }

    createFormCallback(status) {

        //create a bunch of new macAddress objects {}
        const fields = status.map((port, idx) => {
            // let macAddresses = [...this.props.macAddresses]
            // macAddresses.push({ networkPort: "", macAddress:"" })
            console.log(idx)
            this.props.addMACAddrCallback()
            return (

                // TODO Masked input grommet component
                < FormField key={idx}
                    margin={{ horizontal: 'medium', vertical: 'xsmall' }}
                    size="small" name="macAddress" label={`Network Port Name: ${port}`} >
                    <TextInput name="macAddress"
                        value={this.props.macAddresses.macAddress}
                        size="small"
    
                        onChange={e => {

                            this.handleChange(e, idx, port);
                        }}
                    />
                </FormField >
            )
        })

        this.setState(oldState => ({
            ...oldState, macTextFields: fields
        }))

    }

    createForm(model) {
        console.log("here")

        assetmacutils.getNetworkPortLabels(model, status => this.createFormCallback(status))

    }

    render() {
        //let { macAddresses } = this.props.macAddresses
        this.createForm(this.props.model)
        return (

            <Grommet theme={theme}>

                <Box direction="column" gap="small" overflow="auto" background="light-2">


                    {this.state.macTextFields}

                </Box>

            </Grommet >


        )
    }
}
