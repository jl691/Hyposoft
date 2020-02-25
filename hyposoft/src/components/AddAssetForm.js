import React, { Component } from 'react'
import {
    Button,
    Grommet,
    Form,
    FormField,
    Heading,
    TextInput,
    Box,
    Layer,
    Accordion,
    AccordionPanel,
    CheckBox
} from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as assetutils from '../utils/assetutils'
import * as formvalidationutils from "../utils/formvalidationutils";
import * as userutils from "../utils/userutils";
import { Redirect } from "react-router-dom";
import theme from "../theme";

import AssetPowerPortsForm from './AssetPowerPortsForm'
import AssetNetworkPortsForm from './AssetNetworkPortsForm';


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
            macAddress: "",
            datacenterName: "",
            datacenterAbbrev: "",
            showPowerConnections: false,
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
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    //Puts the MAC address into canonical form: lower case and colon-delimited
    fixMACAddress(mac) {
        let noSepMac;
        if (mac.charAt(2) == "-") {
            noSepMac = mac.split("-").join("");

        } else if (mac.charAt(2) == "_") {
            noSepMac = mac.split("_").join("");
        }
        else {//if the admin put in a mac address with no separators
            noSepMac = mac;
        }

        let canonicalMAC = noSepMac.substr(0, 2).toLowerCase() + ":" + noSepMac.substr(2, 2).toLowerCase() + ":" + noSepMac.substr(4, 2).toLowerCase() + ":" + noSepMac.substr(6, 2).toLowerCase() + ":" + noSepMac.substr(8, 2).toLowerCase() + ":" + noSepMac.substr(10, 2).toLowerCase();

        console.log("Canonical MAC: " + canonicalMAC)
        return canonicalMAC;


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

        } else if (this.state.macAddress) {
            fixedMAC = this.state.macAddress;
        }
        //RACE CONDITION: i think it's not setting the state before calling this.state.macAddress in addAsset()
        this.setState({ macAddress: fixedMAC })

        console.log("MAC address passed to database: " + fixedMAC)
        console.log(this.state.networkConnections)


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

                this.handleMacAddressFixAndSet();

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
                    this.state.showPowerConnections ? this.state.powerConnections : [{

                        pduSide: "",
                        port: ""
                    }],

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

                            {/* NEW FIELDS HERE> TODO: change the values/integrate with the backend, move datacenter stuff up the form========= */}

                            <FormField name="macAddress" label="MAC Address">
                                <TextInput name="macAddress" placeholder="eg. 11-ab-cd-79-aa-c9" onChange={this.handleChange}
                                    value={this.state.macAddress}
                                />
                            </FormField>

                            <CheckBox checked={this.state.showPowerConnections} label={"Add power connections?"} toggle={true} onChange={(e) => {
                                let panel = document.getElementById("powerPortConnectionsPanel");
                                let display = !this.state.showPowerConnections;
                                this.setState({
                                    showPowerConnections: display
                                }, function () {
                                    panel.style.display = display ? "block" : "none";
                                })
                            }}/>

                        <Accordion>
                            <div id={"powerPortConnectionsPanel"} style={{display: "none"}}>
                                <AccordionPanel label="Power Port Connections">
                                    <AssetPowerPortsForm
                                        powerConnections={this.state.powerConnections}
                                    />

                                    <Button
                                        onClick={this.addPowerConnection}
                                        margin={{ horizontal: 'medium', vertical: 'small' }}

                                        label="Add a power connection" />

                                    {/* TODO: add a toast success on adding a connection/ Otherwise, error pops up */}
                                    {/* The connect is confusing...how will the user know to connect each connection? Or enter everything then press ito nce? */}
                                    {/* <Button onClick={this.handleConnect}
                                        margin={{ horizontal: 'medium', vertical: 'small' }}
                                        label="Validate Connections" /> */}

                                </AccordionPanel>
                            </div>

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