import React from "react";
import * as offlinestorageutils from "../utils/offlinestorageutils";
import {Box, Button, Form, FormField, Grommet, Heading, Menu, Select, Text, TextInput} from "grommet";
import * as datacenterutils from "../utils/datacenterutils";
import * as assetutils from "../utils/assetutils";
import theme from "../theme";
import {ToastsContainer, ToastsStore} from "react-toasts";

class MoveAssetForm extends React.Component {
    //if in offline storage => choose datacenter, rack, rack U
    //if on rack => choose offline storage
    constructor(props) {
        super(props);
        this.state = {
            initialLoaded: false,
            storageSite: ""
        }
    }

    componentDidMount() {
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
    }

    generateContent(){
        if(this.props.location === "rack"){
            return !this.state.initialLoaded ?
                (
                    <Menu label="Please wait..."/>
                ) :
                (
                    <Select
                    placeholder="Select one..."
                    options={this.state.storageSiteNames}
                    value={this.state.storageSite}
                    onChange={(option) => {
                        offlinestorageutils.moveAssetToOfflineStorage(this.props.assetID, option.value, result => {
                            if(result){
                                this.props.success(true);
                            } else {
                                ToastsStore.error("Error moving asset - please try again later.")
                            }
                        })
                    }}/>
            );
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
                </Form>
            )
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