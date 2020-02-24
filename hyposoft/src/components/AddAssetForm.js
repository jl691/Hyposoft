import React, { Component } from 'react'
import { Button, Grommet, Form, FormField, Heading, TextInput, Box, Layer, Accordion, AccordionPanel } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as assetutils from '../utils/assetutils'
import * as assetpowerportutils from '../utils/assetpowerportutils'
import * as modelutils from '../utils/modelutils'
import * as formvalidationutils from "../utils/formvalidationutils";
import * as userutils from "../utils/userutils";
import { Redirect } from "react-router-dom";
import theme from "../theme";

import AssetPowerPortsForm from './AssetPowerPortsForm'
import AssetNetworkPortsForm from './AssetNetworkPortsForm';
import AssetMACForm from './AssetMACForm';


//Instance table has a layer, that holds the button to add instance and the form

//TODO: need to change states in here, screen, elsewhere
export default class AddAssetForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            asset_id: "",
            model: "",
            hostname: "",
            rack: "",
            rackU: "",
            owner: "",
            comment: "",
            datacenterName: "",
            datacenterAbbrev: "",
            macAddresses: [
                {
                    networkPort: "",
                    macAddress: ""
                }
            ],
            networkConnections: [
                {
                    otherAssetID: "",
                    otherPort: "",
                    thisPort: ""
                }
            ],
            powerConnections: [{
                pduSide: "",
                port: ""
            }],
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.addNetworkConnection = this.addNetworkConnection.bind(this);
        this.addPowerConnection = this.addPowerConnection.bind(this);
        this.defaultPDUFields = this.defaultPDUFields.bind(this)
    }


    defaultPDUFields(model, rack, datacenter) {
        //if the model has 2 or more ports, need to do these default fields
        //find the first available spot
        let numPorts = 0;
        //instead of going into modelsRef, use a backend method
        modelutils.getModelByModelname(model, status => {

            if (status) {
                console.log(status.powerPorts)
                //TODO: change this back, was using 3 for testing
                //numPorts = status.powerPorts.length
                numPorts = 3;
                if (numPorts >= 2) {
                    //call assetpowerportutils to find first available spot on the rack on both left and right sides
                    //set the state
                    //let portField = 
                    assetpowerportutils.getFirstFreePort(rack, datacenter, returnedPort =>{
                        console.log(returnedPort)
                        if (returnedPort) {

                            this.setState(oldState => ({
                                ...oldState,
                                powerConnections: [{
                                    pduSide: "Left",
                                    port: returnedPort.toString()
                                },
                                {
                                    pduSide: "Right",
                                    port: returnedPort.toString()
                                },
    
                                ]
                            }))

                            console.log(this.state.powerConnections)
                        }


                    });
                 
                    
                }
            }
        })
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
        if (event.target.name == "rack" || event.target.name == "model" || event.target.name == "datacenter") {
            console.log(this.state)
            console.log(this.state.datacenter)
            this.defaultPDUFields(this.state.model, this.state.rack, this.state.datacenter)
        }
    }

    handleDisplayMACFields(event){
        console.log(this.state.macAddresses)
        this.setState(prevState => ({ }))
    }



    addNetworkConnection(event) {
        this.setState(prevState => ({
            networkConnections: [...prevState.networkConnections, { otherAssetID: "", otherPort: "", thisPort: "" }]
        }));
    }

    addPowerConnection(event) {
        //Bletsch said to expect no more than 8 power ports on an asset

            this.setState((prevState) => ({
                powerConnections: [...prevState.powerConnections, { pduSide: "", port: "" }],
            }));


    }

    //toLowercase, to colon
    handleMacAddressFixAndSet(event) {

        let fixedMAC = "";
        if (this.state.macAddress && !/^([0-9a-f]{2}[:]){5}([0-9a-f]{2})$/.test(this.state.macAddress)) {
            fixedMAC = this.fixMACAddress(this.state.macAddress);

        }
            //TODO: this is not correct
        this.setState((prevState) => ({
            powerConnections: [...prevState.powerConnections, { pduSide: "", port: "" }],
        }));


    }

    handleSubmit(event) {
        if (event.target.name === "addInst") {
            if (!this.state.model || !this.state.rack || !this.state.rackU || !this.state.datacenter) {
                //not all required fields filled out
                ToastsStore.error("Please fill out all required fields.");
            } else if (this.state.hostname && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/.test(this.state.hostname)) {
                //not a valid hostname
                ToastsStore.error("Invalid hostname. It must start with a letter or number, contain only letters, numbers, or hyphens, and end with a letter or number. It must be 63 characters or less.");
            } else if (!/[A-Z]\d+/.test(this.state.rack)) {
                //not a valid rack
                ToastsStore.error("Invalid rack.");
            } else if (!parseInt(this.state.rackU)) {
                //invalid number
                ToastsStore.error("Rack U must be a number.");
            } else if (!formvalidationutils.checkPositive(this.state.rackU)) {
                ToastsStore.error("Rack U must be positive.");

                //need regex to ensure it's 0-9, a-f, and colon, dash, underscore, no sep at all the right places
            } else if (this.state.macAddress && !/^([0-9A-Fa-f]{2}[-:\_]?){5}([0-9A-Fa-f]{2})$/.test(this.state.macAddress)) {
                ToastsStore.error("Invalid MAC address. Ensure it is a six-byte hexadecimal value with any byte separator punctuation.");
            } else {

                //TODO: fix this in assetmacutils
                //assetmacutils.handleMacAddressFixAndSet();

                assetutils.addAsset(
                    this.state.asset_id,
                    this.state.model,
                    this.state.hostname,
                    this.state.rack,
                    parseInt(this.state.rackU),
                    this.state.owner,
                    this.state.comment,
                    this.state.datacenter,
                    this.state.macAddress,
                    this.state.networkConnections,
                    this.state.powerConnections,

                    errorMessage => {
                        if (errorMessage) {
                            ToastsStore.error(errorMessage, 10000)
                        } else {
                            this.props.parentCallback(true);
                            ToastsStore.success('Successfully added asset!');
                        }
                    }
                );
            }

        }
    }

    render() {

        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }


        return (
            <Grommet theme={theme}>
                <Box height="550px" width="450px" pad="medium" gap="xxsmall" overflow="auto">
                    <Heading
                        size="small"
                        margin="small"
                        level="4"
                    >Add Asset</Heading>
                    <Form onSubmit={this.handleSubmit} name="addInst">
                        <Box direction="column" pad='xsmall' gap="small" flex overflow={{ vertical: 'scroll' }}>
                            <FormField name="model" label="Model">


                                <TextInput name="model" required="true"
                                    placeholder="eg. Dell R710"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({ ...oldState, model: value }))
                                        assetutils.getSuggestedModels(value, results => this.setState(oldState => ({
                                            ...oldState,
                                            modelSuggestions: results
                                        })))
                                    }}
                                    onSelect={e => {
                                        this.setState(oldState => ({ ...oldState, model: e.suggestion }))
                                        //this.defaultPDUFields(e.suggestion, this.state.rack, this.state.datacenter)
                                    }}
                                    value={this.state.model}
                                    suggestions={this.state.modelSuggestions}
                                    onClick={() => assetutils.getSuggestedModels(this.state.model, results => this.setState(oldState => ({
                                        ...oldState,
                                        modelSuggestions: results
                                    })))}
                                    title='Model'
                                />
                            </FormField>

                            <FormField name="hostname" label="Hostname">

                                <TextInput padding="medium" name="hostname" placeholder="eg. server9"
                                    onChange={this.handleChange}
                                    value={this.state.hostname} />
                            </FormField>

                            <FormField name="datacenter" label="Datacenter">
                                <TextInput name="datacenter"
                                    placeholder="eg. Research Triangle Park #1"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({ ...oldState, datacenter: value }))
                                        assetutils.getSuggestedDatacenters(value, results => this.setState(oldState => ({
                                            ...oldState,
                                            datacenterSuggestions: results
                                        })))
                                    }}
                                    onSelect={e => {
                                        this.setState(oldState => ({ ...oldState, datacenter: e.suggestion }))
                                        //this.defaultPDUFields(this.state.model, this.state.rack, e.suggestion)
                                    }}
                                    value={this.state.datacenter}
                                    suggestions={this.state.datacenterSuggestions}
                                    onClick={() => {
                                        console.log("blah");
                                        assetutils.getSuggestedDatacenters(this.state.datacenter, results => {
                                            console.log(results);
                                            this.setState(oldState => ({
                                                ...oldState,
                                                datacenterSuggestions: results
                                            }))
                                        })
                                    }}
                                    title='Datacenter'
                                    required="true"
                                />
                            </FormField>

                            <FormField name="rack" label="Rack">


                                <TextInput name="rack"
                                    placeholder="eg. B12"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({ ...oldState, rack: value }))
                                        assetutils.getSuggestedRacks(this.state.datacenter, value, results => this.setState(oldState => ({
                                            ...oldState,
                                            rackSuggestions: results
                                        })))
                                    }}
                                    onSelect={e => {
                                        this.setState(oldState => ({ ...oldState, rack: e.suggestion }))

                                    }}
                                    value={this.state.rack}
                                    suggestions={this.state.rackSuggestions}
                                    onClick={() => {
                                        if (this.state.datacenter) {
                                            assetutils.getSuggestedRacks(this.state.datacenter, this.state.rack, results => this.setState(oldState => ({
                                                ...oldState,
                                                rackSuggestions: results
                                            })))

                                        }
                                    }
                                    }
                                    title='Rack'
                                    required="true"
                                />
                            </FormField>


                            <FormField name="rackU" label="RackU">


                                <TextInput name="rackU" placeholder="eg. 9" onChange={this.handleChange}
                                    value={this.state.rackU} required="true" />
                            </FormField>


                            <FormField name="owner" label="Owner">

                                <TextInput name="owner"
                                    placeholder="Optional"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({ ...oldState, owner: value }))
                                        assetutils.getSuggestedOwners(value, results => this.setState(oldState => ({
                                            ...oldState,
                                            ownerSuggestions: results
                                        })))
                                    }}
                                    onSelect={e => {
                                        this.setState(oldState => ({ ...oldState, owner: e.suggestion }))
                                    }}
                                    value={this.state.owner}
                                    suggestions={this.state.ownerSuggestions}
                                    onClick={() => assetutils.getSuggestedOwners(this.state.owner, results => this.setState(oldState => ({
                                        ...oldState,
                                        ownerSuggestions: results
                                    })))}
                                    title='Owner'
                                />
                            </FormField>

                            <Accordion>
                                <AccordionPanel label="MAC Addresses">
                                    <AssetMACForm

                                        model={this.state.model}
                                        fieldCallback={this.handleDisplayMACFields}
                                        

                                    />

                                </AccordionPanel>

                            </Accordion>

                            <Accordion>
                                <AccordionPanel label="Power Port Connections">
                                    <AssetPowerPortsForm

                                        powerConnections={this.state.powerConnections}

                                    />

                                    <Button
                                        onClick={this.addPowerConnection}
                                        margin={{ horizontal: 'medium', vertical: 'small' }}

                                        label="Add a power connection" />


                                </AccordionPanel>

                            </Accordion>

                            <Accordion>
                                <AccordionPanel label="Network Port Connections">
                                    <AssetNetworkPortsForm

                                        model={this.state.model}
                                        networkConnections={this.state.networkConnections}

                                    />

                                    <Button
                                        onClick={this.addNetworkConnection}
                                        margin={{ horizontal: 'medium', vertical: 'small' }}

                                        label="Add a network connection" />

                                    {/* TODO: add a toast success on adding a connection/ Otherwise, error pops up */}
                                    {/* The connect is confusing...how will the user know to connect each connection? Or enter everything then press ito nce? */}
                                    {/* <Button onClick={this.handleConnect}
                                        margin={{ horizontal: 'medium', vertical: 'small' }}
                                        label="Validate Connections" /> */}

                                </AccordionPanel>

                            </Accordion>



                            <FormField name="asset_id" label="Override Asset ID">
                                <TextInput name="asset_id" placeholder="If left blank, will auto-generate" onChange={this.handleChange}
                                    value={this.state.asset_id}
                                />
                            </FormField>

                            {/* NEW FIELDS END HERE ============================================================================================*/}

                            <FormField name="comment" label="Comment">

                                <TextInput name="comment" placeholder="Optional" onChange={this.handleChange}
                                    value={this.state.comment} />
                            </FormField>

                            <Box direction={"row"}>

                                <Button
                                    margin="small"
                                    type="submit"
                                    primary label="Submit"
                                />
                                <Button
                                    margin="small"
                                    label="Cancel"
                                    onClick={() => this.props.cancelCallback()}
                                />
                            </Box>
                        </Box>

                    </Form>
                </Box>


                <ToastsContainer store={ToastsStore} />
            </Grommet>


        )


    }

}
;