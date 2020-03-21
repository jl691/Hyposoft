import React from "react";
import * as changeplanutils from "../utils/changeplanutils";
import * as userutils from "../utils/userutils";
import * as decommissionutils from "../utils/decommissionutils";
import * as firebaseutils from "../utils/firebaseutils";
import {Box, Button, Grommet, Heading, Text, DataTable, Layer} from "grommet";
import theme from "../theme";
import AppBar from "../components/AppBar";
import HomeButton from "../components/HomeButton";
import UserMenu from "../components/UserMenu";
import {ToastsContainer, ToastsStore} from "react-toasts";
import {Add, Checkmark, Close, Edit, Print, Trash} from "grommet-icons";
import {Redirect} from "react-router-dom";
import BackButton from "../components/BackButton";
import DeleteChangePlanForm from "../components/DeleteChangePlanForm";
import DeleteChangeForm from "../components/DeleteChangeForm";
import ExecuteChangePlanForm from "../components/ExecuteChangePlanForm";
import EditDecommissionChangeForm from "../components/EditDecommissionChangeForm";
import EditAssetForm from "../components/EditAssetForm";
import * as assetmacutils from "../utils/assetmacutils";
import * as assetnetworkportutils from "../utils/assetnetworkportutils";
import AddAssetForm from "../components/AddAssetForm";

class DetailedChangePlanScreen extends React.Component {

    startAfter = null;
    changePlanID;

    constructor(props) {
        super(props);
        this.state = {
            changes: [],
            initialLoaded: false,
            popupType: "",
            name: "",
            assetsLoaded: false
        }

        this.componentDidMount = this.componentDidMount.bind(this);
    }

    componentDidMount() {
        this.changePlanID = this.props.match.params.changePlanID;
        firebaseutils.changeplansRef.doc(this.changePlanID).get().then(documentSnapshot => {
           if(documentSnapshot.exists){
               this.setState({
                   name: documentSnapshot.data().name,
                   executed: documentSnapshot.data().executed,
                   timestamp: documentSnapshot.data().timestamp
               })
           }
        });
        this.forceRefresh()
    }

    forceRefresh() {
        this.startAfter = null;
        this.setState({
            changes: [],
            initialLoaded: false,
            popupType: "",
        });
        changeplanutils.getChanges(this.props.match.params.changePlanID, userutils.getLoggedInUserUsername(), (newStart, changes, empty) => {
            if(empty){
                this.setState({
                    initialLoaded: true
                });
            } else if(newStart) {
                this.startAfter = newStart;
                this.setState({
                    changes: changes,
                    initialLoaded: true
                });
            }
        });
    }

    cancelPopup = (data) => {
        this.setState({
            popupType: ""
        })
    };

    callbackFunction = (data) => {
        this.forceRefresh();
    };

    AdminTools() {
        if (userutils.isLoggedInUserAdmin()) {
            if (!this.state.executed) {
                return (
                    <Box
                        width='medium'
                        align='center'
                        margin={{left: 'medium', right: 'medium'}}
                        justify='start'>
                        <Box style={{
                            borderRadius: 10,
                            borderColor: '#EDEDED'
                        }}
                             direction='row'
                             alignSelf='stretch'
                             background='#FFFFFF'
                             width={'medium'}
                             margin={{top: 'medium', left: 'medium', right: 'medium'}}
                             pad='small'>
                            <Box flex
                                 margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                 direction='column' justify='start'>
                                <Heading level='4' margin='none'>Add change</Heading>
                                <p>Add a new change.</p>
                                <Box direction='column' flex alignSelf='stretch'>
                                    <Button primary icon={<Add/>} label="Add" onClick={() => {
                                        this.props.history.push('/changeplans/' + this.changePlanID + '/add')
                                    }}/>
                                </Box>
                            </Box>
                        </Box>
                        <Box style={{
                            borderRadius: 10,
                            borderColor: '#EDEDED'
                        }}
                             direction='row'
                             alignSelf='stretch'
                             background='#FFFFFF'
                             width={'medium'}
                             margin={{top: 'medium', left: 'medium', right: 'medium'}}
                             pad='small'>
                            <Box flex
                                 margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                 direction='column' justify='start'>
                                <Heading level='4' margin='none'>Execute change plan</Heading>
                                <p>Execute this change plan.</p>
                                <Box direction='column' flex alignSelf='stretch'>
                                    <Button primary icon={<Checkmark/>} label="Execute" onClick={() => {
                                        this.setState({popupType: "Execute"})
                                    }}/>
                                </Box>
                            </Box>
                        </Box>
                        <Box style={{
                            borderRadius: 10,
                            borderColor: '#EDEDED'
                        }}
                             direction='row'
                             alignSelf='stretch'
                             background='#FFFFFF'
                             width={'medium'}
                             margin={{top: 'medium', left: 'medium', right: 'medium'}}
                             pad='small'>
                            <Box flex
                                 margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                 direction='column' justify='start'>
                                <Heading level='4' margin='none'>Work order</Heading>
                                <p>Generate a work order for this change plan.</p>
                                <Box direction='column' flex alignSelf='stretch'>
                                    <Button primary icon={<Print/>} label="Generate" onClick={() => {
                                        this.props.history.push('/changeplans/' + this.changePlanID + '/workorder')
                                    }}/>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                );
            } else {
                return (
                    <Box
                        width='medium'
                        align='center'
                        margin={{left: 'medium', right: 'medium'}}
                        justify='start'>
                        <Box style={{
                            borderRadius: 10,
                            borderColor: '#EDEDED'
                        }}
                             direction='row'
                             alignSelf='stretch'
                             background='#FFFFFF'
                             width={'medium'}
                             margin={{top: 'medium', left: 'medium', right: 'medium'}}
                             pad='small'>
                            <Box flex
                                 margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                 direction='column' justify='start'>
                                <Heading level='4' margin='none'>Work order</Heading>
                                <p>Generate a work order for this change plan.</p>
                                <Box direction='column' flex alignSelf='stretch'>
                                    <Button primary icon={<Print/>} label="Generate" onClick={() => {
                                        this.props.history.push('/changeplans/' + this.changePlanID + '/workorder')
                                    }}/>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )
            }
        }
    }

    DataTable() {
        if (!this.state.initialLoaded) {
            return (
                <Text>Please wait...</Text>
            )
        } else {
            return (
                <DataTable step={25}
                           onMore={() => {
                               if (this.startAfter) {
                                   changeplanutils.getChanges(this.changePlanID, userutils.getLoggedInUserUsername(), (newStart, changes, empty) => {
                                       if(!empty && newStart){
                                           this.startAfter = newStart;
                                           this.setState({
                                               changes: changes,
                                           });
                                       }
                                   }, this.startAfter);
                               }
                           }}
                           onClickRow={({datum}) => {
                               this.props.history.push('/changeplans/' + this.changePlanID + '/' + datum.id)
                           }}
                           columns={this.generateColumns()} data={this.state.changes} size={"large"}/>
            )
        }
    }

    generateColumns() {
        let cols = [
            {
                property: "step",
                header: <Text size={"small"}>Step</Text>,
                primary: true,
                render: datum => (<Text size={"small"}>{datum.id}</Text>)
            },
            {
                property: "assetID",
                header: <Text size='small'>Asset ID</Text>,
                render: datum => (
                    <Text size='small'>{datum.assetID ? datum.assetID : "TBD"}</Text>)
            },
            {
                property: "change",
                header: <Text size='small'>Change</Text>,
                render: datum => (
                    <Text size='small'>{datum.change}</Text>)
            },
            {
                property: "edit",
                header: <Text size='small'>Edit</Text>,
                render: datum => (
                    !this.state.executed && <Edit onClick={(e) => {
                        e.persist();
                        e.nativeEvent.stopImmediatePropagation();
                        e.stopPropagation();
                        if(datum.change === "edit") {
                            changeplanutils.getMergedAssetAndChange(this.changePlanID, datum.id, mergedAsset => {
                                if(mergedAsset){
                                    this.setState({
                                        popupType: "Edit" + datum.change,
                                        stepID: datum.id,
                                        currentChange: mergedAsset
                                    });
                                }
                            });
                        } else if(datum.change === "add") {
                            changeplanutils.getAssetFromAddAsset(this.changePlanID, datum.id, asset => {
                                if(asset){
                                    this.setState({
                                        popupType: "Edit" + datum.change,
                                        stepID: datum.id,
                                        currentChange: asset
                                    });
                                }
                            })
                        } else if(datum.change === "decommission") {
                            this.setState({
                                popupType: "Edit" + datum.change,
                                stepID: datum.id,
                            });
                        }

                    }}/>)
            },
            {
                property: "delete",
                header: <Text size='small'>Delete</Text>,
                render: datum => (
                    !this.state.executed && <Trash onClick={(e) => {
                        e.persist();
                        e.nativeEvent.stopImmediatePropagation();
                        e.stopPropagation();
                        this.setState({
                            deleteStepNumber: datum.id,
                            popupType: "Delete"
                        })
                    }}/>)
            }
        ];
        return cols;
    }

    cancelPopup = (data) => {
        this.setState({
            popupType: ""
        })
    }

    successfulExecution = (data) => {
        this.setState({
            popupType: ""
        });
        ToastsStore.success("Successfully executed the change plan.")
    }

    successfulEdit = (data) => {
        this.setState({
            popupType: ""
        });
        this.forceRefresh();
        ToastsStore.success(data);
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/'/>
        }

        const {popupType} = this.state;
        let popup;

        if(popupType === 'Delete'){
            popup = (
                <DeleteChangeForm cancelPopup={this.cancelPopup} forceRefresh={this.callbackFunction}
                                      changePlanID={this.changePlanID} stepNumber={this.state.deleteStepNumber}/>
            )
        } else if(popupType === 'Execute'){
            console.log(this.changePlanID)
            popup = (
                <ExecuteChangePlanForm cancelPopup={this.cancelPopup} successfulExecution={this.successfulExecution}
                                  id={this.changePlanID} name={this.state.name}/>
            )
        } else if(popupType === 'Editdecommission'){
            console.log(this.changePlanID)
            popup = (
                <EditDecommissionChangeForm cancelPopup={this.cancelPopup} stepID={this.state.stepID}
                changePlanID={this.changePlanID} successfulEdit={this.successfulEdit}/>
            )
        } else if(popupType === 'Editedit'){
            console.log(this.state.currentChange)
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    <EditAssetForm
                        parentCallback={this.cancelPopup}
                        cancelCallback={this.cancelPopup}
                        changePlanID={this.changePlanID}
                        popupMode={'Update'}
                        changeDocID={this.state.currentChange.changeDocID}
                        updateModelFromParent={this.state.currentChange.model}
                        updateHostnameFromParent={this.state.currentChange.hostname}
                        updateRackFromParent={this.state.currentChange.rack}
                        updateRackUFromParent={this.state.currentChange.rackU}
                        updateOwnerFromParent={this.state.currentChange.owner}
                        updateCommentFromParent={this.state.currentChange.comment}
                        updateDatacenterFromParent={this.state.currentChange.datacenter}
                        updateAssetIDFromParent={this.state.currentChange.assetId}
                        updateMacAddressesFromParent={assetmacutils.unfixMacAddressesForMACForm(this.state.currentChange.macAddresses)}
                        updatePowerConnectionsFromParent={this.state.currentChange.powerConnections}
                        updateNetworkConnectionsFromParent={assetnetworkportutils.networkConnectionsToArray(this.state.currentChange.networkConnections)}
                    />
                </Layer>
            )
        } else if(popupType === 'Editadd'){
            console.log(this.state.currentChange.macAddresses, this.state.currentChange, assetmacutils.unfixMacAddressesForMACForm(this.state.currentChange.macAddresses))
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>

                    <AddAssetForm
                        parentCallback={this.cancelPopup}
                        cancelCallback={this.cancelPopup}
                        changePlanID={this.changePlanID}
                        popupMode={"Update"}
                        changeDocID={this.state.currentChange.changeDocID}
                        updateMacAddressesFromParent={assetmacutils.unfixMacAddressesForMACForm(this.state.currentChange.macAddresses)}
                        updatePowerConnectionsFromParent={this.state.currentChange.powerConnections}
                        updateNetworkConnectionsFromParent={assetnetworkportutils.networkConnectionsToArray(this.state.currentChange.networkConnections)}

                        updateModelFromParent={this.state.currentChange.model}
                        updateHostnameFromParent={this.state.currentChange.hostname}
                        updateRackFromParent={this.state.currentChange.rack}
                        updateRackUFromParent={this.state.currentChange.rackU}
                        updateOwnerFromParent={this.state.currentChange.owner}
                        updateCommentFromParent={this.state.currentChange.comment}
                        updateDatacenterFromParent={this.state.currentChange.datacenter}
                        updateAssetIDFromParent={this.state.currentChange.assetId ? this.state.currentChange.assetId : ""}
                    />
                </Layer>
            )
        }

        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill background='light-2'>
                    <AppBar>
                        <BackButton alignSelf='start' this={this}/>
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }}>Change Plan: {this.state.name}</Heading>
                        <UserMenu alignSelf='end' this={this}/>
                    </AppBar>
                    <Box direction='row'
                         justify='center'
                         wrap={true}>
                        {this.state.executed && <Box style={{
                            borderRadius: 10
                        }} width={"large"} background={"status-ok"} align={"center"} alignSelf={"center"}
                                                     margin={{top: "medium"}}>
                            <Heading level={"3"} margin={"small"}>Change Plan Executed</Heading>
                            <Box>This change plan was executed on {decommissionutils.getDate(this.state.timestamp)}. Thus, no further changes can be made.</Box>
                        </Box>}
                        <Box direction='row' justify='center' overflow={{horizontal: 'hidden'}}>
                            <Box direction='row' justify='center'>
                                <Box width='large' direction='column' align='stretch' justify='start'>
                                    <Box style={{
                                        borderRadius: 10,
                                        borderColor: '#EDEDED'
                                    }}
                                         id='containerBox'
                                         direction='row'
                                         background='#FFFFFF'
                                         margin={{top: 'medium', bottom: 'medium'}}
                                         flex={{
                                             grow: 0,
                                             shrink: 0
                                         }}
                                         pad='small'>
                                        <Box margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                             direction='column'
                                             justify='start' alignSelf='stretch' height={"810px"} flex>
                                            <Box align="center">

                                                {this.DataTable()}

                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                                {this.AdminTools()}
                            </Box>
                        </Box>
                    </Box>
                </Box>
                {popup}
                <ToastsContainer store={ToastsStore}/>
            </Grommet>
        )
    }

}

export default DetailedChangePlanScreen