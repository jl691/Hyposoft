// import React, { Component } from 'react'
// import { Grommet, Box, Text, FormField, TextInput } from 'grommet'
// import * as assetmacutils from '../utils/assetmacutils'
// import * as assetutils from '../utils/assetutils'
// import * as modelutils from '../utils/modelutils'
// import theme from "../theme";

// //Instead of validate connections, upon all fields for one set of inputs, have a toast that pops up with error message
// //If the connection is not valid


// export default class AssetMACForm extends Component {
//     state = {
//         macTextFields: []
//     }


//     constructor(props) {

//         super(props);

//         this.handleChange = this.handleChange.bind(this);
//         this.createForm = this.createForm.bind(this);
//         //This was an anonymous function, but this.setState was not working. Give name to anon function, move out of the method it was in (so it gets a class scope) and htne bind
//         this.createFormCallback = this.createFormCallback.bind(this);



//     }
//     //Form validation/error catching: ???

//     //Need to handle change: pass state back up
//     handleChange(e, idx) {
//         //You are either typing into an output
//         if (e.target.name === "macAddress" || e.target.name === "networkPort") {

//             let macAddresses = [...this.props.macAddresses]
//             macAddresses[idx][e.target.name] = e.target.value

//             this.setState({ macAddress: e.target.value })

//         } else {

//             this.setState({ [e.target.name]: e.target.value})
//         }
//     }


//     createFormCallback(status) {

//         //create a bunch of new macAddress objects {}
//         const fields = status.map((port, idx) => {
//             // let macAddresses = [...this.props.macAddresses]
//             // macAddresses.push({ networkPort: "", macAddress:"" })
//             console.log(idx)
//             this.props.addMACAddrCallback()
//             return (

//                 // TODO Masked input grommet component
//                 < FormField key={idx}
//                     margin={{ horizontal: 'medium', vertical: 'xsmall' }}
//                     size="small" name="macAddress" label={`Network Port Name: ${port}`} >
//                     <TextInput name="macAddress"
//                         value={this.props.macAddresses.macAddress}
//                         size="small"

//                         onChange={e => {

//                             this.handleChange(e, idx, port);
//                         }}
//                     />
//                 </FormField >
//             )
//         })

//         // this.setState(oldState => ({
//         //     ...oldState, macTextFields: fields
//         // }))

//     }

//     createForm(model) {
//         console.log("here")

//         assetmacutils.getNetworkPortLabels(model, status => this.createFormCallback(status))

//     }

//     render() {
//         let { macAddresses } = this.props.macAddresses
//         // console.log(networkConnections)
//         return (
//             macAddresses.map((val, idx) => {
//                 return (
//                     <Grommet key={idx} theme={theme}>

//                         <Box direction="column" gap="small" overflow="auto" background="light-2">

//                             <Text>{idx + 1}</Text>

                         

//                             {/* TODO: AUTOCOMPLETE/PICKLIST */}
//                             <FormField
//                                 margin={{ horizontal: 'medium', vertical: 'xsmall' }}
//                                 size="small" name="macAddress" label="MAC Address">
//                                 <TextInput name="macAddress"
//                                     //value={this.props.networkConnections.port}

//                                     size="small"

//                                     onChange={e => {
//                                         this.handleChange(e, idx)
//                                         assetutils.getSuggestedAssetIds(e.target.value, results => this.setState(oldState => ({
//                                             ...oldState,
//                                             assetIdSuggestions: results
//                                         })))
//                                     }}
//                                     onSelect={e => {
//                                         this.handleSuggestion(e, idx)
//                                     }}
//                                     value={this.props.macAddresses[idx]['otherAssetID']}
//                                     suggestions={this.state.assetIdSuggestions}
//                                     onClick={() => {
//                                       assetutils.getSuggestedAssetIds(this.props.networkConnections[idx]['otherAssetID'], results => this.setState(oldState => ({
//                                         ...oldState,
//                                         assetIdSuggestions: results
//                                     })))}}
//                                 />
//                             </FormField>

//                             {/* TODO: AUTOCOMPLETE/PICKLIST */}
//                             <FormField
//                                 margin={{ horizontal: 'medium', vertical: 'xsmall' }}
//                                 size="small" name="otherPort" label="Other Asset Port">
//                                 <TextInput name="otherPort"
//                                     //value={this.props.networkConnections.port}

//                                     size="small"

//                                     onChange={e => {
//                                         this.handleChange(e, idx)
//                                         assetutils.getSuggestedOtherAssetPorts(this.props.macAddresses[idx]['otherAssetID'],e.target.value, results => this.setState(oldState => ({
//                                             ...oldState,
//                                             otherAssetPortSuggestions: results
//                                         })))
//                                     }}
//                                     onSelect={e => {
//                                         this.handleSuggestion(e, idx)
//                                     }}
//                                     value={this.props.macAddresses[idx]['otherPort']}
//                                     suggestions={this.state.otherAssetPortSuggestions}
//                                     onClick={() => {
//                                       assetutils.getSuggestedOtherAssetPorts(this.props.macAddresses[idx]['otherAssetID'],this.props.macAddresses[idx]['otherPort'], results => this.setState(oldState => ({
//                                         ...oldState,
//                                         otherAssetPortSuggestions: results
//                                     })))}}
//                                 />

//                             </FormField>




//                         </Box>

//                     </Grommet >


//                 )
//             })
//         )
//     }


// }
