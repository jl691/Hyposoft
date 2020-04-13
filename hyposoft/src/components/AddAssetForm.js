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
    CheckBox, Text, TextArea,

} from 'grommet'
import { SketchPicker } from 'react-color'


import { ToastsContainer, ToastsStore } from 'react-toasts';
import errorStrings from '../res/errorMessages.json'
import * as assetutils from '../utils/assetutils'
import * as bladeutils from '../utils/bladeutils'
import * as assetpowerportutils from '../utils/assetpowerportutils'
import * as assetmacutils from '../utils/assetmacutils'
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
    addFunction = null
    isNonBlade = true
    previousModel = null

    constructor(props) {
        super(props);
        this.state = {
            asset_id: this.props.updateAssetIDFromParent,
            model: this.props.updateModelFromParent,
            hostname: this.props.updateHostnameFromParent,
            rack: this.props.updateRackFromParent,
            rackU: this.props.updateRackUFromParent,
            owner: this.props.updateOwnerFromParent,
            comment: this.props.updateCommentFromParent,
            datacenter: this.props.updateDatacenterFromParent,
            macAddresses: this.props.updateMacAddressesFromParent, //trace back up to see where it starts to be undefined
            powerConnections: this.props.updatePowerConnectionsFromParent,
            networkConnections: this.props.updateNetworkConnectionsFromParent,
            editDeletedNetworkConnections: [],
            showPowerConnections: this.props.updatePowerConnectionsFromParent.length ? true : false,

            assetVariance: this.props.updateDisplayColorFromParent !== "" || this.props.updateCpuFromParent !== "" || this.props.updateMemoryFromParent !== "" || this.props.updateStorageFromParent !== "" ? true : false,
            displayColor: this.props.updateDisplayColorFromParent,
            cpu: this.props.updateCpuFromParent,
            memory: this.props.updateMemoryFromParent,
            storage: this.props.updateStorageFromParent

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
        this.resetAssetVariance = this.resetAssetVariance.bind(this)
    }

    componentDidMount() {
        // console.log(this.props.updateMacAddressesFromParent);
        let panel = document.getElementById("powerPortConnectionsPanel");
        panel.style.display = this.props.updatePowerConnectionsFromParent.length ? "block" : "none";
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

    resetAssetVariance() {
        this.setState(prevState => ({
            displayColor: "",
            cpu: "",
            memory: "",
            storage: ""
        }));
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

    determineAddForm(callback) {
        modelutils.getModelByModelname(this.state.model, doc => {
            if (doc) {
                switch (doc.data().mount) {
                    case 'chassis':
                        this.addFunction = bladeutils.addChassis
                        this.isNonBlade = true
                        break
                    case 'blade':
                        this.addFunction = bladeutils.addServer
                        this.isNonBlade = false
                        break
                    default:
                        this.addFunction = assetutils.addAsset
                        this.isNonBlade = true
                }
            } else {
                this.addFunction = assetutils.addAsset
                this.isNonBlade = true
            }
            callback()
        })
    }

    handleSubmit(event) {

        if (event.target.name === "addInst") {
            if (!this.state.model || !this.state.rack || !this.state.rackU || !this.state.datacenter) {
                //not all required fields filled out
                ToastsStore.error("Please fill out all required fields.");
            } else if (this.state.hostname && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/.test(this.state.hostname)) {
                //not a valid hostname
                ToastsStore.error("Invalid hostname. It must start with a letter or number, contain only letters, numbers, or hyphens, and end with a letter or number. It must be 63 characters or less.");
            } else if (this.isNonBlade && !/[A-Z]\d+/.test(this.state.rack)) {
                //not a valid rack
                ToastsStore.error("Invalid rack.");
            } else if (!parseInt(this.state.rackU)) {
                //invalid number
                ToastsStore.error((this.isNonBlade ? "Rack U" : "Slot") + " must be a number.");
            } else if (!formvalidationutils.checkPositive(this.state.rackU)) {
                ToastsStore.error((this.isNonBlade ? "Rack U" : "Slot") + " must be positive.");

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
                                                ToastsStore.info('Please wait...', 750);
                                                console.log(fixedAddr)
                                                this.addFunction(
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
                                                    this.state.displayColor,
                                                    (this.state.memory),
                                                    this.state.storage,
                                                    this.state.cpu,

                                                    errorMessage => {
                                                        if (errorMessage) {
                                                            ToastsStore.error(errorMessage, 10000)
                                                        } else {
                                                            this.props.parentCallback(true);
                                                            ToastsStore.success('Successfully added asset!');
                                                        }
                                                    }, this.props.changePlanID ? this.props.changePlanID : null, this.props.changeDocID ? this.props.changeDocID : null
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
                                    ToastsStore.info('Please wait...', 750);
                                    this.addFunction(
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
                                        this.state.displayColor,
                                        (this.state.memory),
                                        this.state.storage,
                                        this.state.cpu,

                                        errorMessage => {
                                            if (errorMessage) {
                                                ToastsStore.error(errorMessage, 10000)
                                            } else {
                                                this.props.parentCallback(true);
                                                ToastsStore.success('Successfully added asset!');
                                            }
                                        }, this.props.changePlanID ? this.props.changePlanID : null, this.props.changeDocID ? this.props.changeDocID : null
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
    }

    render() {

        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }
        //console.log(this.state)
        if (this.state.model !== this.previousModel) {
            this.previousModel = this.state.model
            // force render to be called again after updating variables
            this.determineAddForm(() => this.setState(oldState => ({ ...oldState })))
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
                            {this.props.changePlanID && (<Box style={{
                                borderRadius: 10
                            }} width={"large"} background={"status-warning"} align={"center"} alignSelf={"center"}
                                margin={{ top: "medium" }}>
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
                            <CheckBox checked={this.state.assetVariance} label={"Customize asset's model?"}
                                toggle={true} onChange={(e) => {
                                    let display = !this.state.assetVariance;
                                    this.resetAssetVariance()
                                    this.setState({
                                        assetVariance: display
                                    })
                                }} />

                            {this.state.assetVariance &&
                                <div >
                                    {/* make it obvious that you are changing the model */}
                                    <Box background={{
                                        "color": "status-warning",
                                        "opacity": "45",

                                    }}>
                                        <Heading level = "4" margin={{ top: 'medium' }}>Modifying the model of this asset. If fields are left blank, no modifications will be made.</Heading>
                                        <Text margin={{ top: 'medium' }}>Display color</Text>
                                        <Box align="center">
                                            <SketchPicker disableAlpha
                                                color={this.state.displayColor}
                                                onChange={color => {
                                                    this.setState(oldState => ({ ...oldState, displayColor: color.hex }))
                                                }} />

                                        </Box>

                                        <FormField name="cpu" label="CPU">
                                            <TextInput padding="medium" name="cpu" placeholder="eg. HP 755396-B21"
                                                onChange={this.handleChange}
                                                value={this.state.cpu} />

                                        </FormField>
                                        <FormField name="memory" label="Memory">
                                            <TextInput padding="medium" name="memory" placeholder="in GB"
                                                onChange={this.handleChange}
                                                value={this.state.memory} />

                                        </FormField>
                                        <FormField name="storage" label="Storage">
                                            <TextInput padding="medium" name="storage" placeholder="in GB"
                                                onChange={this.handleChange}
                                                value={this.state.storage} />

                                        </FormField>
                                        <Box margin="small">
                                            <Button
                                                onClick={this.resetAssetVariance}
                                                margin={{ horizontal: 'medium', vertical: 'small' }}

                                                label="Reset to Model Defaults" />


                                        </Box>
                                    </Box>
                                </div>
                            }

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
                            {(this.isNonBlade
                              ?
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
                              :
                              <FormField name="rack" label="Chassis Hostname">

                                  <TextInput name="rack" placeholder="eg. chassis1"
                                      onChange={e => {
                                          const value = e.target.value
                                          this.setState(oldState => ({ ...oldState, rack: value }))
                                          bladeutils.getSuggestedChassis(this.state.datacenter, value, results => this.setState(oldState => ({
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
                                              bladeutils.getSuggestedChassis(this.state.datacenter, this.state.rack, results => this.setState(oldState => ({
                                                  ...oldState,
                                                  rackSuggestions: results
                                              })))
                                          }
                                      }}
                                      title='Chassis Hostname'
                                      required={true}
                                    />
                                </FormField>
                            )}

                            {(this.isNonBlade
                                ?
                                <FormField name="rackU" label="RackU">


                                  <TextInput name="rackU" placeholder="eg. 9" onChange={this.handleChange}
                                      value={this.state.rackU} required={true} />
                              </FormField>
                              :
                              <FormField name="rackU" label="Slot">
                                      <TextInput name="rackU" placeholder="eg. 5"
                                          onChange={e => {
                                              const value = e.target.value
                                              this.setState(oldState => ({ ...oldState, rackU: value }))
                                              bladeutils.getSuggestedSlots(this.state.rack, value, results => this.setState(oldState => ({
                                                  ...oldState,
                                                  slotSuggestions: results
                                              })))
                                          }}
                                          onSelect={e => {
                                              this.setState(oldState => ({ ...oldState, rackU: (e.suggestion.split(' '))[1].trim() }))
                                          }}
                                          value={this.state.rackU}
                                          suggestions={this.state.slotSuggestions}
                                          onClick={() => {
                                              if (this.state.rack) {
                                                  bladeutils.getSuggestedSlots(this.state.rack, this.state.rackU, results => this.setState(oldState => ({
                                                      ...oldState,
                                                      slotSuggestions: results
                                                  })))
                                              }
                                          }}
                                          title='Slot'
                                          required={true}
                                        />
                              </FormField>
                            )}

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

                            {(this.isNonBlade
                                ?
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
                                :
                                <Box></Box>
                            )}

                            {(this.isNonBlade
                                ?
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
                                            popupMode={this.props.popupMode}


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

                                    </AccordionPanel>
                                </Accordion>
                                :
                                <Box></Box>
                            )}

                            <FormField name="asset_id" label="Override Asset ID">
                                <TextInput name="asset_id" placeholder="If left blank, will auto-generate"
                                    onChange={this.handleChange}
                                    value={this.state.asset_id}
                                />
                            </FormField>

                            {/* NEW FIELDS END HERE ============================================================================================*/}

                            <FormField name="comment" label="Comment">

                                <TextArea name="comment" placeholder="Optional" onChange={this.handleChange}
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
            </Grommet >


        )


    }

}
;
