import React, {Component} from 'react'
import {Button, Grommet, Form, FormField, Heading, TextInput, Box, Layer} from 'grommet'
import {ToastsContainer, ToastsStore} from 'react-toasts';
import * as assetutils from '../utils/assetutils'
import * as formvalidationutils from "../utils/formvalidationutils";
import * as userutils from "../utils/userutils";
import {Redirect} from "react-router-dom";
import theme from "../theme";


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

        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    handleSubmit(event) {
        if (event.target.name === "addInst") {
            if (!this.state.model || !this.state.rack || !this.state.rackU) {
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
            } else if (this.state.macAddress && !/^([0-9a-f]{2}[:-]){5}([0-9a-f]{2})$/.test(this.state.macAddress)) {
                ToastsStore.error("Invalid MAC address. Ensure it is colon-delimited and all lowercase.");
            } else {
                assetutils.addAsset(
                    this.state.asset_id,
                    this.state.model,
                    this.state.hostname,
                    this.state.rack,
                    parseInt(this.state.rackU),
                    this.state.owner,
                    this.state.comment,
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
            return <Redirect to='/'/>
        }


        return (
            <Grommet theme={theme}>
                <Box height="medium" width="medium" pad="medium" gap="xxsmall" overflow="auto">
                    <Heading
                        size="small"
                        margin="small"
                        level="4"
                    >Add Asset</Heading>
                    <Form onSubmit={this.handleSubmit} name="addInst">

                        <FormField name="model" label="Model">


                            <TextInput name="model" required="true"
                                       placeholder="eg. Dell R710"
                                       onChange={e => {
                                           const value = e.target.value
                                           this.setState(oldState => ({...oldState, model: value}))
                                           assetutils.getSuggestedModels(value, results => this.setState(oldState => ({
                                               ...oldState,
                                               modelSuggestions: results
                                           })))
                                       }}
                                       onSelect={e => {
                                           this.setState(oldState => ({...oldState, model: e.suggestion}))
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
                                       value={this.state.hostname}/>
                        </FormField>


                        <FormField name="rack" label="Rack">


                            <TextInput name="rack"
                                       placeholder="eg. B12"
                                       onChange={e => {
                                           const value = e.target.value
                                           this.setState(oldState => ({...oldState, rack: value}))
                                           assetutils.getSuggestedRacks(value, results => this.setState(oldState => ({
                                               ...oldState,
                                               rackSuggestions: results
                                           })))
                                       }}
                                       onSelect={e => {
                                           this.setState(oldState => ({...oldState, rack: e.suggestion}))
                                       }}
                                       value={this.state.rack}
                                       suggestions={this.state.rackSuggestions}
                                       onClick={() => assetutils.getSuggestedRacks(this.state.rack, results => this.setState(oldState => ({
                                           ...oldState,
                                           rackSuggestions: results
                                       })))}
                                       title='Rack'
                                       required="true"
                            />
                        </FormField>


                        <FormField name="rackU" label="RackU">


                            <TextInput name="rackU" placeholder="eg. 9" onChange={this.handleChange}
                                       value={this.state.rackU} required="true"/>
                        </FormField>


                        <FormField name="owner" label="Owner">

                            <TextInput name="owner"
                                       placeholder="Optional"
                                       onChange={e => {
                                           const value = e.target.value
                                           this.setState(oldState => ({...oldState, owner: value}))
                                           assetutils.getSuggestedOwners(value, results => this.setState(oldState => ({
                                               ...oldState,
                                               ownerSuggestions: results
                                           })))
                                       }}
                                       onSelect={e => {
                                           this.setState(oldState => ({...oldState, owner: e.suggestion}))
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
                        {/* <FormField name="datacenterName" label="Datacenter name">
                            <TextInput name="datacenterName" placeholder="eg. Research Triangle Park 1" onChange={this.handleChange}
                                       //value={this.state.rackU} 
                                       required="true"/>
                        </FormField>

                        <FormField name="datacenterAbbrev" label="Datacenter Abbreviation">
                            <TextInput name="datacenterAbbrev" placeholder="eg. RTP1" onChange={this.handleChange}
                                       //value={this.state.rackU} 
                                       required="true"/>
                        </FormField> */}

                        <FormField name="macAddress" label="MAC Address">
                            <TextInput name="macAddress" placeholder="eg. 11:ab:cd:79:aa:c9"
                                       onChange={this.handleChange}
                                       value={this.state.macAddress}
                            />
                        </FormField>

                        {/* For these last two, need to think carefully about UI since they are 'multistep' to add */}

                        <FormField name="networkPortConns" label="Network Port Connections">
                            <TextInput name="networkPortConns" placeholder="WORK IN PROGRESS"
                                       onChange={this.handleChange}
                                //value={this.state.rackU}
                            />
                        </FormField>

                        <FormField name="powerConns" label="Power Connections">
                            <TextInput name="powerConns" placeholder="WORK IN PROGRESS" onChange={this.handleChange}
                                //value={this.state.rackU}
                            />
                        </FormField>
                        <FormField name="asset_id" label="Override Asset ID">
                            <TextInput name="asset_id" placeholder="If left blank, will auto-generate"
                                       onChange={this.handleChange}
                                       value={this.state.asset_id}
                            />
                        </FormField>

                        {/* NEW FIELDS END HERE ============================================================================================*/}

                        <FormField name="comment" label="Comment">

                            <TextInput name="comment" placeholder="Optional" onChange={this.handleChange}
                                       value={this.state.comment}/>
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
                </Box>


                <ToastsContainer store={ToastsStore}/>
            </Grommet>


        )


    }

}
