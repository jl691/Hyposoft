import React, { Component } from 'react'
import { Button, Grommet,Box } from 'grommet'
import theme from "../theme";
import NetworkPortInput from './NetworkPortInput'

//Instead of validate connections, upon all fields for one set of inputs, have a toast that pops up with error message
//If the connection is not valid


export default class AssetNetworkPortsForm extends Component {

    constructor(props) {

        super(props);
        this.state = {
            networkConnections: [{
                //portLimit:"",//TODO: pass in model to know number of times admin can press add new connection
                otherAssetID: "",
                otherPort: "",
                thisPort:""
            }],

        };

        this.handleChange = this.handleChange.bind(this);
        this.handleValidateConnections = this.handleValidateConnections.bind(this);
        this.addNetworkConnection = this.addNetworkConnection.bind(this);
    }
    //Form validation/error catching: ???

    handleChange(e, idx) {
        //You are either typing into an output
        if (e.target.name === "otherAssetID" || e.target.name === "otherPort" || e.target.name === "thisPort") {
            console.log("two")
            let networkConnections = [...this.state.networkConnections]
            networkConnections[idx][e.target.name] = e.target.value
            this.setState({ port: e.target.value })

            //or it's something already 'submitted'
        } else {
            console.log("three")
            this.setState({ [e.target.name]: e.target.value })
        }
    }

    handleValidateConnections(event) {


    }

    addNetworkConnection(event) {
        this.setState((prevState) => ({
            networkConnections: [...prevState.networkConnections, { otherAssetID: "", otherPort: "", thisPort:"" }]
        }));

    }

    render() {
        let { networkConnections } = this.state
        console.log(networkConnections)
        return (
            networkConnections.map((val, idx) => {
                return (
                    <Grommet key={idx} theme={theme}>
                
                                <Box direction="column" gap="small" overflow="auto" background="light-2">

                                    <NetworkPortInput 
                                    networkConnections={networkConnections}
                                    handleTextCallback={this.handleChange}
                                    />

                                    {/* TODO: add a toast success on adding a connection/ Otherwise, error pops up */}
                                    {/* The connect is confusing...how will the user know to connect each connection? Or enter everything then press ito nce? */}
                                    <Button onClick={this.handleConnect}
                                        margin={{ horizontal: 'medium', vertical: 'small' }}
                                        label="Validate Connections" />
                                </Box>

                    </Grommet >


                )
            })
        )
    }
}
