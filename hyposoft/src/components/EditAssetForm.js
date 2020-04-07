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
    CheckBox,
    TextArea
} from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as assetutils from '../utils/assetutils'
import * as bladeutils from '../utils/bladeutils'
import * as assetmacutils from '../utils/assetmacutils'
import * as formvalidationutils from "../utils/formvalidationutils";
import * as assetpowerportutils from '../utils/assetpowerportutils'
import * as assetnetworkportutils from '../utils/assetnetworkportutils'
import * as modelutils from '../utils/modelutils'
import * as userutils from "../utils/userutils";
import { Redirect } from "react-router-dom";
import theme from "../theme";

import AssetPowerPortsForm from './AssetPowerPortsForm'
import AssetNetworkPortsForm from './AssetNetworkPortsForm';
import AssetMACForm from './AssetMACForm';


//Instance table has a layer, that holds the button to add instance and the form

export default class EditAssetForm extends Component {
    updateFunction = null
    isNonBlade = true
    previousModel = null
    originalRackRackU = null

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
            showPowerConnections: this.props.updatePowerConnectionsFromParent.length ? true : false

        }
        this.handleUpdate = this.handleUpdate.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.addNetworkConnection = this.addNetworkConnection.bind(this);
        this.addPowerConnection = this.addPowerConnection.bind(this);
        //this.defaultPDUFields = this.defaultPDUFields.bind(this);
        this.deleteNetworkConnection = this.deleteNetworkConnection.bind(this)
        this.deletePowerConnection = this.deletePowerConnection.bind(this);

        this.originalRackRackU = {rack: this.state.rack, rackU: this.state.rackU}
    }

    componentDidMount() {
        console.log(this.state.powerConnections)
        console.log(this.props.updatePowerConnectionsFromParent ? "block" : "none");
        let panel = document.getElementById("powerPortConnectionsPanel");
        panel.style.display = this.props.updatePowerConnectionsFromParent.length ? "block" : "none";
    }

    //TODO: use this method properly
    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
        // if (event.target.name === "rackU") {
        //     //console.log(this.state)
        //     // console.log(this.state.datacenter)
        //     this.defaultPDUFields(this.state.model, this.state.rack, this.state.datacenter)
        // }
    }

    // defaultPDUFields(model, rack, datacenter) {
    //     //if the model has 2 or more ports, need to do these default fields
    //     //find the first available spot
    //     let numPorts = 0;
    //     //instead of going into modelsRef, use a backend method
    //     try {
    //         modelutils.getModelByModelname(model, status => {

    //             if (status) {
    //                 //test with model lenovo foobar
    //                 numPorts = status.data().powerPorts

    //                 if (numPorts >= 2) {
    //                     assetpowerportutils.getFirstFreePort(rack, datacenter, returnedPort => {
    //                         console.log("In AddAssetForm. returned power port: " + returnedPort)
    //                         if (returnedPort) {

    //                             this.setState(oldState => ({
    //                                 ...oldState,
    //                                 powerConnections: [{
    //                                     pduSide: "Left",
    //                                     port: returnedPort.toString()
    //                                 },
    //                                 {
    //                                     pduSide: "Right",
    //                                     port: returnedPort.toString()
    //                                 },

    //                                 ]
    //                             }))

    //                             console.log(this.state.powerConnections)
    //                         }


    //                     });


    //                 }
    //             }
    //         })


    //     } catch (error) {
    //         console.log(error)
    //     }

    // }


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

    deleteNetworkConnection(event, idx) {

        //this is so we can call symmetricSingleDelete in assetutils updateAsset()
        let packedVals=this.state.networkConnections[idx]['thisPort']+ ":"+this.state.networkConnections[idx]['otherAssetID']+ ":"+this.state.networkConnections[idx]['otherPort']
        this.state.editDeletedNetworkConnections.push(packedVals)
        this.setState(prevState => ({

            editDeletedNetworkConnections: [...prevState.editDeletedNetworkConnections]

        }));
        console.log(this.state.editDeletedNetworkConnections)


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

    checkNetworkPortUniqueness(networkPorts, callback){
        if(!networkPorts.length){
            callback(true);
        } else {
            let thisPortArray = [];
            let otherIDPortArray = [];
            let count = 0;
            networkPorts.forEach(networkConnection =>{
                let otherIDPortTemp = networkConnection.otherAssetID + networkConnection.otherPort;
                if(thisPortArray.includes(networkConnection.thisPort) || otherIDPortArray.includes(otherIDPortTemp)){
                    callback(null);
                } else {
                    thisPortArray.push(networkConnection.thisPort);
                    otherIDPortArray.push(otherIDPortTemp);
                    count++;
                    if(count === networkPorts.length){
                        callback(true);
                    }
                }
            })
        }
    }

    determineUpdateForm(callback) {
       modelutils.getModelByModelname(this.state.model, doc => {
           if (doc) {
               switch (doc.data().mount) {
                 case 'chassis':
                   this.updateFunction = bladeutils.updateChassis
                   this.isNonBlade = true
                   break
                 case 'blade':
                   this.updateFunction = bladeutils.updateServer
                   this.isNonBlade = false
                   break
                 default:
                   this.updateFunction = assetutils.updateAsset
                   this.isNonBlade = true
               }
           } else {
               this.updateFunction = assetutils.updateAsset
               this.isNonBlade = true
           }
           if (!this.isNonBlade) {
              bladeutils.getBladeInfo(this.state.asset_id,data => {
                  if (data) {
                      // purposefully not using setState so render is not called!!!
                      this.state.rack = data.rack
                      this.state.rackU = data.rackU
                  }
                  callback()
              })
           } else {
              // purposefully not using setState so render is not called!!!
              this.state.rack = this.originalRackRackU.rack
              this.state.rackU = this.originalRackRackU.rackU
              callback()
           }
       })
    }

    handleUpdate(event) {

        if (event.target.name === "updateInst") {
            //this is where you pass in props updateData from AssetScreen . Want to keep old unchanged data, ow

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
                ToastsStore.error("Rack U must be a number.");
            } else if (!formvalidationutils.checkPositive(this.state.rackU)) {
                ToastsStore.error("Rack U must be positive.");
            }
            else {

                if (this.state.showPowerConnections) {
                    let existingConnections = [];
                    Object.keys(this.state.powerConnections).forEach(connection => {
                        let thisKey = this.state.powerConnections[connection].pduSide + this.state.powerConnections[connection].port;
                        if (existingConnections.includes(thisKey)) {
                            ToastsStore.error("Power connections must be unique.");
                        } else {
                            existingConnections.push(this.state.powerConnections[connection].pduSide + this.state.powerConnections[connection].port);
                            if (existingConnections.length === Object.keys(this.state.powerConnections).length) {
                                //TODO: fix this in assetmacutils

                                this.checkNetworkPortUniqueness(this.state.networkConnections, result => {
                                    if(result) {
                                        assetmacutils.handleMacAddressFixAndSet(this.state.macAddresses, (fixedAddr, macError) => {


                                            if (fixedAddr) {
                                                console.log(fixedAddr)
                                                console.log(this.props.changeDocID)
                                                ToastsStore.info('Please wait...', 750);

                                                this.updateFunction(
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
                                                    this.state.editDeletedNetworkConnections,
                                                    this.state.showPowerConnections ? this.state.powerConnections : [],

                                                    errorMsg => {
                                                        if (errorMsg) {
                                                            ToastsStore.error(errorMsg, 10000)
                                                        } else {
                                                            this.props.parentCallback(true);
                                                            ToastsStore.success('Successfully updated asset!');
                                                        }
                                                    }, this.props.changePlanID ? this.props.changePlanID : null, this.props.changeDocID ? this.props.changeDocID : null
                                                );
                                            }
                                            else {
                                                ToastsStore.error(macError)
                                            }
                                        });
                                    } else {
                                        ToastsStore.error("Network connections must be unique");
                                    }
                                })
                            }
                        }
                    })
                } else {

                    this.checkNetworkPortUniqueness(this.state.networkConnections, result => {
                        if(result) {
                            assetmacutils.handleMacAddressFixAndSet(this.state.macAddresses, (fixedAddr, macError) => {

                                if (fixedAddr) {
                                    console.log(fixedAddr)
                                    ToastsStore.info('Please wait...', 750);
                                    this.updateFunction(
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
                                        this.state.editDeletedNetworkConnections,
                                        this.state.showPowerConnections ? this.state.powerConnections : [],

                                        errorMessage => {
                                            if (errorMessage) {
                                                ToastsStore.error(errorMessage, 10000)
                                            } else {
                                                this.props.parentCallback(true);
                                                ToastsStore.success('Successfully updated asset!');
                                            }
                                        }, this.props.changePlanID ? this.props.changePlanID : null, this.props.changeDocID ? this.props.changeDocID : null
                                    );


                                }
                                else {
                                    ToastsStore.error(macError)
                                }

                            });
                        } else {
                            ToastsStore.error("Network connections must be unique");
                        }
                    })
                }

            }
        }

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

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }
        //console.log(this.state.macAddresses)
        if (this.state.model !== this.previousModel) {
            this.previousModel = this.state.model
            // force render to be called again after updating variables
            this.determineUpdateForm(() => this.setState(oldState => ({ ...oldState})))
        }

        return (

            <Grommet theme={theme}>
                <Box height="575px" width="400px" pad="medium" gap="xxsmall" overflow="auto">
                    <Heading
                        size="small"
                        margin="small"
                        level="4"
                    >Update Asset</Heading>

                    <Form onSubmit={this.handleUpdate} name="updateInst" >
                        {this.props.changePlanID && (<Box style={{
                            borderRadius: 10
                        }} width={"large"} background={"status-warning"} align={"center"} alignSelf={"center"}
                                                          margin={{top: "medium"}}>
                            <Heading level={"3"} margin={"small"}>Warning</Heading>
                            <Box>This asset will only be edited within the change plan.</Box>
                        </Box>)}
                        <FormField name="model" label="Model">
                            {/* change placeholders to what the original values were? */}
                            <TextInput name="model" placeholder="Update Model"
                                onChange={e => {
                                    const value = e.target.value
                                    this.setState(oldState => ({ ...oldState, model: value }))
                                    assetutils.getSuggestedModels(value, results => this.setState(oldState => ({ ...oldState, modelSuggestions: results })))
                                }}
                                onSelect={e => {
                                    this.setState(oldState => ({ ...oldState, model: e.suggestion }))
                                }}
                                value={this.state.model}
                                suggestions={this.state.modelSuggestions}
                                onClick={() => assetutils.getSuggestedModels(this.state.model, results => this.setState(oldState => ({ ...oldState, modelSuggestions: results })))}
                                title='Model'
                            />
                            {/* or value can be */}
                            {/* this.props.updateModelFromParent */}
                        </FormField>

                        <FormField name="hostname" label="Hostname" >

                            <TextInput padding="medium" name="hostname" placeholder="Update Hostname" onChange={this.handleChange}
                                value={this.state.hostname} />
                        </FormField>

                        <FormField name="datacenter" label="Datacenter">
                            <TextInput name="datacenter"
                                placeholder="Update Datacenter"
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
                                onClick={() => assetutils.getSuggestedDatacenters(this.state.datacenter, results => this.setState(oldState => ({
                                    ...oldState,
                                    datacenterSuggestions: results
                                })))}
                                title='Datacenter'
                                required="true"
                            />
                        </FormField>

                        {(this.isNonBlade
                          ?
                          <FormField name="rack" label="Rack" >

                              <TextInput name="rack"
                                  placeholder="Update Rack"
                                  onChange={e => {
                                      const value = e.target.value
                                      this.setState(oldState => ({ ...oldState, rack: value }))
                                      assetutils.getSuggestedRacks(this.state.datacenter, value, results => this.setState(oldState => ({ ...oldState, rackSuggestions: results })))
                                  }}
                                  onSelect={e => {
                                      this.setState(oldState => ({ ...oldState, rack: e.suggestion }))
                                  }}
                                  value={this.state.rack}
                                  suggestions={this.state.rackSuggestions}
                                  onClick={() => assetutils.getSuggestedRacks(this.state.datacenter, this.state.rack, results => this.setState(oldState => ({ ...oldState, rackSuggestions: results })))}
                                  title='Rack'
                              />
                          </FormField>
                          :
                          <FormField name="rack" label="Chassis Hostname" >

                              <TextInput name="rack"
                                  placeholder="Update Chassis Hostname"
                                  onChange={e => {
                                      const value = e.target.value
                                      this.setState(oldState => ({ ...oldState, rack: value }))
                                      assetutils.getSuggestedChassis(this.state.datacenter, value, results => this.setState(oldState => ({ ...oldState, rackSuggestions: results })))
                                  }}
                                  onSelect={e => {
                                      this.setState(oldState => ({ ...oldState, rack: e.suggestion }))
                                  }}
                                  value={this.state.rack}
                                  suggestions={this.state.rackSuggestions}
                                  onClick={() => assetutils.getSuggestedChassis(this.state.datacenter, this.state.rack, results => this.setState(oldState => ({ ...oldState, rackSuggestions: results })))}
                                  title='Chassis Hostname'
                              />
                          </FormField>
                        )}

                        {(this.isNonBlade
                          ?
                          <FormField name="rackU" label="RackU" >

                              <TextInput name="rackU" placeholder="Update RackU" onChange={this.handleChange}
                                  value={this.state.rackU} required="true" />
                          </FormField>
                          :
                          <FormField name="rackU" label="Slot" >

                              <TextInput name="rackU" placeholder="Update Slot" onChange={this.handleChange}
                                  value={this.state.rackU} required="true" />
                          </FormField>
                        )}

                        <FormField name="owner" label="Owner" >

                            <TextInput name="owner"
                                placeholder="Update Owner"
                                onChange={e => {
                                    const value = e.target.value
                                    this.setState(oldState => ({ ...oldState, owner: value }))
                                    assetutils.getSuggestedOwners(value, results => this.setState(oldState => ({ ...oldState, ownerSuggestions: results })))
                                }}
                                onSelect={e => {
                                    this.setState(oldState => ({ ...oldState, owner: e.suggestion }))
                                }}
                                value={this.state.owner}
                                suggestions={this.state.ownerSuggestions}
                                onClick={() => assetutils.getSuggestedOwners(this.state.owner, results => this.setState(oldState => ({ ...oldState, ownerSuggestions: results })))}
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
                          <Accordion >

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
                                      popupMode={this.props.popupMode}
                                      model={this.state.model}
                                      macAddresses={this.state.macAddresses}


                                  />

                              </AccordionPanel>

                              <AccordionPanel label="Network Port Connections">
                                  <AssetNetworkPortsForm

                                      model={this.state.model}
                                      datacenter={this.state.datacenter}
                                      currentId={this.state.asset_id}
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
                          :
                          <Box></Box>
                        )}

                        <FormField name="asset_id" label="Override Asset ID">
                            <TextInput name="asset_id" placeholder="Update Asset ID" onChange={this.handleChange}
                                value={this.state.asset_id} disabled={true}
                            />
                        </FormField>


                        <FormField name="comment" label="Comment" >

                            <TextArea name="comment" placeholder="Update Comment" onChange={this.handleChange}
                                value={this.state.comment} />
                        </FormField>


                        <Box direction={"row"}>
                            <Button
                                margin="small"
                                type="submit"
                                primary label="Update"
                            />
                            <Button
                                margin="small"
                                label="Cancel"
                                onClick={() => this.props.cancelCallback()}
                            />
                        </Box>

                    </Form >
                </Box>


                <ToastsContainer store={ToastsStore} />
            </Grommet>


        )



    }

}
