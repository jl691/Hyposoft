import React, { Component } from 'react'
import { Button, Grommet, FormField, TextInput, Box, Select, Accordion, AccordionPanel } from 'grommet'
import theme from "../theme";
import PowerPortInput from './PowerPortInput'


export default class AssetPowerPortsForm extends Component {

    constructor(props) {

        super(props);
        this.state = {
            powerConnections: [{
                //portLimit:"",//TODO: pass in model to know number of times admin can press add new connection
                pduSide: "",
                port: ""
            }],

        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);
        this.handleValidateConnections = this.handleValidateConnections.bind(this);
        this.addPowerConnection = this.addPowerConnection.bind(this);
    }
    //Form validation/error catching: user can keep adding power connections, but in the end, need to limit the number 
    //of connections to be equal to the number of power ports on the model. So if you try to add another connection and it
    //exceeds the number of power ports on model, will throw a toast error
    //This means in the backend, need to pass in the model to get the number of power ports


    handleChange(e, idx) {
        //You are either typing into an output
        if (e.target.name === "port") {
            console.log("two")
            let powerConnections = [...this.state.powerConnections]
            powerConnections[idx][e.target.name] = e.target.value
            this.setState({ port: e.target.value })
            console.log(this.state.powerConnections[idx])

            //or it's something already 'submitted'
        } else {
            console.log("three")
            this.setState({ [e.target.name]: e.target.value })
        }
    }

    handleValidateConnections(event) {


    }

    handleSelectChange(selectedOption, idx) {

        let powerConnections = [...this.state.powerConnections]
        powerConnections[idx].pduSide = selectedOption
        this.setState({ pduSide: selectedOption })

    }

    addPowerConnection(event) {
        this.setState((prevState) => ({
            powerConnections: [...prevState.powerConnections, { pduSide: "", port: "" }],
        }));

    }

    inputCallback(){

    }

    //TODO:
    //If user fills out, must be all or nothing? Or will users know if they jsut pick left, it will be symmetric?
    render() {
        let { powerConnections } = this.state

        console.log(this.state.powerConnections)
        return (
            powerConnections.map((val, idx) => {
                return (
                    <Grommet key={idx} theme={theme}>
                        <Accordion>
                            <AccordionPanel label="Power Connections">

                                <Box direction="column" gap="small" overflow="auto" background="light-2">

                                    <PowerPortInput 
                                    powerConnections={powerConnections}
                                    handleSelectCallback={this.handleSelectChange} 
                                    handleTextCallback={this.handleChange}
                                    />

                                    {/* NEED TO MOVE THIS BUTTON OUT add to form and pass state?? OW what happens if you press it out of order */}
                                    <Button onClick={this.addPowerConnection}
                                        margin={{ horizontal: 'medium', vertical: 'small' }}

                                        label="Add a power connection" />


                                    {/* TODO: add a toast success on adding a connection/ Otherwise, error pops up */}
                                    {/* The connect is confusing...how will the user know to connect each connection? Or enter everything then press ito nce? */}
                                    <Button onClick={this.handleConnect}
                                        margin={{ horizontal: 'medium', vertical: 'small' }}
                                        label="Validate Connections" />
                                </Box>
                            </AccordionPanel>
                        </Accordion>

                    </Grommet >


                )
            })
        )
    }
}
