import React from "react";
import * as offlinestorageutils from "../utils/offlinestorageutils";
import {Box, Button, Form, FormField, Grommet, Heading, Menu, Select, Text, TextInput} from "grommet";
import * as changeplanutils from "../utils/changeplanutils";
import * as assetutils from "../utils/assetutils";
import theme from "../theme";
import {ToastsContainer, ToastsStore} from "react-toasts";
import * as formvalidationutils from "../utils/formvalidationutils";
import * as modelutils from "../utils/modelutils";
import * as bladeutils from "../utils/bladeutils";

class MoveAssetForm extends React.Component {
    //if in offline storage => choose datacenter, rack, rack U
    //if on rack => choose offline storage
    moveFunction = null;

    constructor(props) {
        super(props);
        this.state = {
            initialLoaded: false,
            storageSite: this.props.editStorageSite ? this.props.editStorageSite : "",
            assetType: "",
            datacenter: this.props.editDatacenter ? this.props.editDatacenter : "",
            rack: this.props.editRack ? this.props.editRack : "",
            rackU: this.props.editRackU ? this.props.editRackU : "",
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        this.determineFunction(() => {
            if(this.props.location === "rack"){
                offlinestorageutils.getAllStorageSiteNames(result => {
                    console.log(result)
                    let storageSites = [];
                    if(result.length){
                        storageSites = result;
                        this.setState({
                            storageSiteNames: storageSites,
                            initialLoaded: true
                        })
                    } else {
                        storageSites.push("No offline storage sites exist.");
                        this.setState({
                            storageSiteNames: storageSites,
                            initialLoaded: true
                        })
                    }
                })
            } else {
                this.setState({
                    initialLoaded: true
                })
            }
        });
    }

    handleSubmit(event) {
        if (!/[A-Z]\d+/.test(this.state.rack) && !this.state.assetType === "blade") {
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
            if(this.props.changePlanID){
                changeplanutils.moveAssetChange(this.props.assetID, this.props.changePlanID, this.state.datacenter, this.state.rack, this.state.rackU, null, (result, errorMessage) => {
                    if(result){
                        this.props.success(true);
                    } else {
                        if(errorMessage){
                            ToastsStore.error(errorMessage);
                        } else {
                            ToastsStore.error("Error moving the asset. Please try again later.");
                        }
                    }
                }, this.props.stepID ? this.props.stepID : null)
            } else {
                offlinestorageutils.moveAssetFromOfflineStorage(this.props.assetID, this.state.datacenter, this.state.rack, this.state.rackU, result => {
                    if(!result){
                        this.props.success(true);
                    } else {
                        ToastsStore.error(result);
                    }
                }, this.moveFunction);
            }
        }
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    determineFunction(callback) {
        modelutils.getModelByModelname(this.props.model, doc => {
            if (doc) {
                switch (doc.data().mount) {
                    case 'chassis':
                        this.moveFunction = this.props.location === "rack" ? bladeutils.deleteChassis : bladeutils.addChassis;
                        this.setState({
                            assetType: "chassis"
                        });
                        break;
                    case 'blade':
                        this.moveFunction = this.props.location === "rack" ? bladeutils.deleteServer : bladeutils.addServer;
                        this.setState({
                            assetType: "blade"
                        });
                        break;
                    default:
                        this.moveFunction = this.props.location === "rack" ? assetutils.deleteAsset : assetutils.addAsset;
                        this.setState({
                            assetType: "asset"
                        });
                }
            } else {
                this.moveFunction = this.props.location === "rack" ? assetutils.deleteAsset : assetutils.addAsset;
                this.setState({
                    assetType: "asset"
                });
            }
            callback();
        })
    }

    generateContent(){
        if(this.props.location === "rack"){
            return !this.state.initialLoaded ?
                (
                    <Menu label="Please wait..."/>
                ) :
                (
                    <Box><Select
                    placeholder="Select one..."
                    options={this.state.storageSiteNames}
                    value={this.state.storageSite}
                    onChange={(option) => {
                        if(this.props.changePlanID){
                            changeplanutils.moveAssetChange(this.props.assetID, this.props.changePlanID, null, null, null, option.value, result => {
                                if(result){
                                    this.props.success();
                                } else {
                                    ToastsStore.error("Error moving asset - please try again later.")
                                }
                            })
                        } else {
                            offlinestorageutils.moveAssetToOfflineStorage(this.props.assetID, option.value, (result, abbrev) => {
                                if(result){
                                    this.props.success(abbrev);
                                } else {
                                    ToastsStore.error("Error moving asset - please try again later.")
                                }
                            }, this.moveFunction)
                        }
                    }}/><Button
                        margin="small"
                        label="Cancel"
                        onClick={() => this.props.cancelCallback()}
                    /></Box>
            );
        } else {
            if(!this.state.initialLoaded){
                return (<Text>Please wait...</Text>)
            } else if(this.state.assetType === "blade"){
                return (
                <Form onSubmit={this.handleSubmit} name="move">

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
                </Form>)
            } else {
                return (
                    <Form onSubmit={this.handleSubmit} name="move">

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
                                           assetutils.getSuggestedDatacenters(this.state.datacenter, results => {
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
                    </Form>
                )
            }
        }
    }

    render() {
        return (
            <Grommet theme={theme}>
                <Box pad="medium" background="light-2" width={"medium"}>
                    <Heading level="3" margin="none">Move asset</Heading>
                    <Text>Move asset #{this.props.assetID} from {this.props.currentLocation} to {this.props.location === "rack" ? "offline storage site" : "datacenter/rack"}:</Text>
                    {this.generateContent()}
                </Box>
                <ToastsContainer store={ToastsStore}/>
            </Grommet>
        )
    }
}

export default MoveAssetForm