import React, { Component } from 'react'
import {
    Button,
    Grommet,
    Form,
    FormField,
    Heading,
    TextInput,
    Box,
    Accordion,
    AccordionPanel,
    CheckBox, Text
} from 'grommet'


import { ToastsContainer, ToastsStore } from 'react-toasts';
import errorStrings from '../res/errorMessages.json'
import * as assetutils from '../utils/assetutils'
import * as assetpowerportutils from '../utils/assetpowerportutils'
import * as assetmacutils from '../utils/assetmacutils'
import * as changeplanconflictutils from '../utils/changeplanconflictutils'
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
            showPowerConnections: false,
            macAddresses: [],
            networkConnections: [],
            powerConnections: [
                //     {
                //     pduSide: "",
                //     port: ""
                // }
            ],


        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.addNetworkConnection = this.addNetworkConnection.bind(this);
        this.addPowerConnection = this.addPowerConnection.bind(this);
        this.defaultPDUFields = this.defaultPDUFields.bind(this)
        this.handleMacAddressFixAndSet = this.handleMacAddressFixAndSet.bind(this)
        this.fixMACAddress = this.fixMACAddress.bind(this)
        this.deleteNetworkConnection = this.deleteNetworkConnection.bind(this)
        this.deletePowerConnection = this.deletePowerConnection.bind(this);
    }


    defaultPDUFields(model, rack, datacenter) {
        //if the model has 2 or more ports, need to do these default fields
        //find the first available spot
        let numPorts = 0;
        //instead of going into modelsRef, use a backend method
        try {
            modelutils.getModelByModelname(model, status => {

                if (status) {
                    //test with model lenovo foobar
                    numPorts = status.data().powerPorts

                    if (numPorts >= 2) {
                        assetpowerportutils.getFirstFreePort(rack, datacenter, returnedPort => {
                            console.log("In AddAssetForm. returned power port: " + returnedPort)
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


        } catch (error) {
            console.log(error)
        }

    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
        //catchall for default power port fields
        if (event.target.name === "rackU") {
            //console.log(this.state)
            // console.log(this.state.datacenter)
            this.defaultPDUFields(this.state.model, this.state.rack, this.state.datacenter)
        }
    }

    handleDisplayMACFields(macTextFields) {
        // this.setState(prevState => ({
        //     macAddresses: [...prevState.macAddresses, {networkPort: "", macAddress: ""}]
        // }));
        // this.state.macAddresses = []
        // macTextFields.forEach(() => {
        //   this.state.macAddresses.push({networkPort: "",macAddress: ""})
        // });
    }


    addNetworkConnection(event) {
        this.setState(prevState => ({
            networkConnections: [...prevState.networkConnections, { otherAssetID: "", otherPort: "", thisPort: "" }]
        }), function () {
            console.log(this.state.networkConnections)
        });
    }

    deleteNetworkConnection(event, idx) {
        console.log("removing element " + idx)
        let networkConnectionsCopy = [...this.state.networkConnections];
        networkConnectionsCopy.splice(idx, 1);
        this.setState(prevState => ({
            networkConnections: networkConnectionsCopy
        }));


    }

    deletePowerConnection(event, idx) {
        console.log("removing element " + idx)
        let powerConnectionsCopy = [...this.state.powerConnections];
        powerConnectionsCopy.splice(idx, 1);
        this.setState(prevState => ({
            powerConnections: powerConnectionsCopy
        }));
    }

    addPowerConnection(event) {
        //Bletsch said to expect no more than 8 power ports on an asset

        this.setState((prevState) => ({
            powerConnections: [...prevState.powerConnections, { pduSide: "", port: "" }],
        }));


    }
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

    //toLowercase, to colon
    handleMacAddressFixAndSet(macAddresses) {
        //need to loop through macAddresses and specfically get the macAddress field
        console.log(macAddresses)
        macAddresses.forEach(function fixMAC(obj) {
            let address = obj.macAddress
            console.log(address)

            if (address && !/^([0-9a-f]{2}[:]){5}([0-9a-f]{2})$/.test(address)) {
                //let fixedMAC = fixMACAddress(address);
                let noSepMac;
                if (address.charAt(2) == "-") {
                    noSepMac = address.split("-").join("");

                } else if (address.charAt(2) == "_") {
                    noSepMac = address.split("_").join("");
                }
                else {//if the admin put in a mac address with no separators
                    noSepMac = address;
                }

                let canonicalMAC = noSepMac.substr(0, 2).toLowerCase() + ":" + noSepMac.substr(2, 2).toLowerCase() + ":" + noSepMac.substr(4, 2).toLowerCase() + ":" + noSepMac.substr(6, 2).toLowerCase() + ":" + noSepMac.substr(8, 2).toLowerCase() + ":" + noSepMac.substr(10, 2).toLowerCase();
                console.log("Canonical MAC: " + canonicalMAC)


                this.setState({ macAddress: canonicalMAC })

                console.log("MAC address passed to database: " + canonicalMAC)
                console.log(this.state)

            } else if (address) {
                let fixedMAC = address;
                this.setState({ macAddress: fixedMAC })

                console.log("MAC address passed to database: " + fixedMAC)

            }

        })

    }

    checkNetworkPortUniqueness(networkPorts, callback) {
        if (!networkPorts.length) {
            callback(true);
        } else {
            let thisPortArray = [];
            let otherIDPortArray = [];
            let count = 0;
            networkPorts.forEach(networkConnection => {
                let otherIDPortTemp = networkConnection.otherAssetID + networkConnection.otherPort;
                if (thisPortArray.includes(networkConnection.thisPort) || otherIDPortArray.includes(otherIDPortTemp)) {
                    callback(null);
                } else {
                    thisPortArray.push(networkConnection.thisPort);
                    otherIDPortArray.push(otherIDPortTemp);
                    count++;
                    if (count === networkPorts.length) {
                        callback(true);
                    }
                }
            })
        }
    }

    async handleSubmit(event) {
        //flawed logic: want to move first if statement out, also not always doing a change plan
       // await changeplanconflictutils.addAssetChangePlanPackage("VwC1BMKipvuuvmR1LrYR").then(() => {

            console.log("Inside the add asset change plan package .then()")
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
                }
                else {
                    if (this.state.showPowerConnections) {
                        let existingPowerConnections = [];
                        Object.keys(this.state.powerConnections).forEach(connection => {
                            let thisKey = this.state.powerConnections[connection].pduSide + this.state.powerConnections[connection].port;
                            if (existingPowerConnections.includes(thisKey)) {
                                ToastsStore.error("Power connections must be unique.");
                            } else {
                                existingPowerConnections.push(this.state.powerConnections[connection].pduSide + this.state.powerConnections[connection].port);
                                if (existingPowerConnections.length === Object.keys(this.state.powerConnections).length) {
                                    //TODO: fix this in assetmacutils
                                    this.checkNetworkPortUniqueness(this.state.networkConnections, result => {
                                        if (result) {
                                            assetmacutils.handleMacAddressFixAndSet(this.state.macAddresses, (fixedAddr, macError) => {

                                                if (fixedAddr) {
                                                    console.log(fixedAddr)
                                                    assetutils.addAsset(
                                                        this.state.asset_id,
                                                        this.state.model,
                                                        this.state.hostname,
                                                        this.state.rack,
                                                        parseInt(this.state.rackU),
                                                        this.state.owner,
                                                        this.state.comment,
                                                        this.state.datacenter,
                                                        fixedAddr,
                                                        this.state.networkConnections,
                                                        this.state.showPowerConnections ? this.state.powerConnections : [],
                                                        errorMessage => {
                                                            if (errorMessage) {
                                                                ToastsStore.error(errorMessage, 10000)
                                                            } else {
                                                                this.props.parentCallback(true);
                                                                ToastsStore.success('Successfully added asset!');
                                                            }
                                                        }, this.props.changePlanID ? this.props.changePlanID : null
                                                    );
                                                }
                                                else {
                                                    ToastsStore.error(macError)
                                                }
                                            });

                                        } else {
                                            ToastsStore.error("Network connections must be unique.")
                                        }
                                    })
                                }
                            }
                        })
                    } else {

                        this.checkNetworkPortUniqueness(this.state.networkConnections, result => {
                            if (result) {
                                assetmacutils.handleMacAddressFixAndSet(this.state.macAddresses, (fixedAddr, macError) => {

                                    if (fixedAddr) {
                                        console.log(fixedAddr)
                                        assetutils.addAsset(
                                            this.state.asset_id,
                                            this.state.model,
                                            this.state.hostname,
                                            this.state.rack,
                                            parseInt(this.state.rackU),
                                            this.state.owner,
                                            this.state.comment,
                                            this.state.datacenter,
                                            fixedAddr,
                                            this.state.networkConnections,
                                            this.state.showPowerConnections ? this.state.powerConnections : [],

                                            errorMessage => {
                                                if (errorMessage) {
                                                    ToastsStore.error(errorMessage, 10000)
                                                } else {
                                                    this.props.parentCallback(true);
                                                    ToastsStore.success('Successfully added asset!');
                                                }
                                            }, this.props.changePlanID ? this.props.changePlanID : null
                                        );


                                    }
                                    else {
                                        ToastsStore.error(macError)
                                    }
                                });
                            } else {
                                ToastsStore.error("Network connections must be unique.")
                            }
                        })
                    }


                }

            }
      // })
    }

    render() {

        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }
        //console.log(this.state)


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
                            {this.props.changePlanID && (<Box style={{
                                borderRadius: 10
                            }} width={"large"} background={"status-warning"} align={"center"} alignSelf={"center"}
                                 margin={{top: "medium"}}>
                                <Heading level={"3"} margin={"small"}>Warning</Heading>
                                <Box>This asset will only be added within the change plan.</Box>
                            </Box>)}
                            <FormField name="model" label="Model">

                                <TextInput name="model" required={true}
                                    placeholder="eg. Dell R710"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({ ...oldState, model: value }))
                                        assetutils.getSuggestedModels(value, results => this.setState(oldState => ({
                                            ...oldState,
                                            modelSuggestions: results
                                        })))
                                        //Update the default power port fields
                                        //this.defaultPDUFields(e.suggestion, this.state.rack, this.state.datacenter)
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
                                        //Update the default power port fields
                                        //this.defaultPDUFields(this.state.model, this.state.rack, e.suggestion)
                                    }}
                                    onSelect={e => {
                                        this.setState(oldState => ({ ...oldState, datacenter: e.suggestion }))
                                    }}
                                    value={this.state.datacenter}
                                    suggestions={this.state.datacenterSuggestions}
                                    onClick={() => {
                                        assetutils.getSuggestedDatacenters(this.state.datacenter, results => {
                                            //console.log(results);
                                            this.setState(oldState => ({
                                                ...oldState,
                                                datacenterSuggestions: results
                                            }))
                                        })
                                    }}
                                    title='Datacenter'
                                    required={true}
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
                                        //Update the default power port fields
                                        //this.defaultPDUFields(this.state.model, e.suggestion, this.state.datacenter)
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
                                    required={true}
                                />
                            </FormField>


                            <FormField name="rackU" label="RackU">


                                <TextInput name="rackU" placeholder="eg. 9" onChange={this.handleChange}
                                    value={this.state.rackU} required={true} />
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


                            <CheckBox checked={this.state.showPowerConnections} label={"Add power connections?"}
                                toggle={true} onChange={(e) => {
                                    let panel = document.getElementById("powerPortConnectionsPanel");
                                    let display = !this.state.showPowerConnections;
                                    this.setState({
                                        showPowerConnections: display
                                    }, function () {
                                        panel.style.display = display ? "block" : "none";
                                    })
                                }} />

                            <Accordion>
                                <div id={"powerPortConnectionsPanel"} style={{ display: "none" }}>

                                    <AccordionPanel label="Power Port Connections">
                                        <AssetPowerPortsForm

                                            powerConnections={this.state.powerConnections}
                                            deletePowerConnectionCallbackFromParent={this.deletePowerConnection}

                                        />

                                        <Button
                                            onClick={this.addPowerConnection}
                                            margin={{ horizontal: 'medium', vertical: 'small' }}

                                            label="Add a power connection" />


                                    </AccordionPanel>
                                </div>
                                <AccordionPanel label="MAC Addresses">
                                    <AssetMACForm

                                        fieldCallback={this.handleDisplayMACFields}
                                        model={this.state.model}
                                        macAddresses={this.state.macAddresses}


                                    />

                                </AccordionPanel>


                                <AccordionPanel label="Network Port Connections">
                                    <AssetNetworkPortsForm

                                        model={this.state.model}
                                        datacenter={this.state.datacenter}
                                        networkConnections={this.state.networkConnections}
                                        deleteNetworkConnectionCallbackFromParent={this.deleteNetworkConnection}

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
                                <TextInput name="asset_id" placeholder="If left blank, will auto-generate"
                                    onChange={this.handleChange}
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