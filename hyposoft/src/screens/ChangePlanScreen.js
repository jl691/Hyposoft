import React from "react";
import * as changeplanutils from "../utils/changeplanutils";
import * as userutils from "../utils/userutils";
import {Box, Button, Grommet, Heading, Text, DataTable, Layer} from "grommet";
import theme from "../theme";
import AppBar from "../components/AppBar";
import HomeButton from "../components/HomeButton";
import UserMenu from "../components/UserMenu";
import {ToastsContainer, ToastsStore} from "react-toasts";
import {Add, Checkmark, Close, Edit, Print, Trash} from "grommet-icons";
import {Redirect} from "react-router-dom";
import AddDatacenterForm from "../components/AddDatacenterForm";
import AddChangePlanForm from "../components/AddChangePlanForm";
import DeleteDatacenterForm from "../components/DeleteDatacenterForm";
import DeleteChangePlanForm from "../components/DeleteChangePlanForm";
import EditDatacenterForm from "../components/EditDatacenterForm";
import EditChangePlanForm from "../components/EditChangePlanForm";

class ChangePlanScreen extends React.Component {

    startAfter = null;
    itemCount = 1;

    constructor(props) {
        super(props);
        this.state = {
            changePlans: [],
            initialLoaded: false,
            popupType: ""
        }
    }

    componentDidMount() {
        this.forceRefresh()
    }

    forceRefresh() {
        this.itemCount = 1;
        this.startAfter = null;
        this.setState({
            changePlans: [],
            initialLoaded: false,
            popupType: "",
        });
        changeplanutils.getChangePlans(this.itemCount, userutils.getLoggedInUserUsername(), (newItemCount, newStart, changePlans, empty) => {
            if(empty){
                this.setState({
                    initialLoaded: true
                });
            } else if(newItemCount) {
                this.itemCount = newItemCount;
                this.startAfter = newStart;
                this.setState({
                    changePlans: changePlans,
                    initialLoaded: true
                });
            }
        });
    }

    AdminTools() {
        if (userutils.isLoggedInUserAdmin()) {
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
                            <Heading level='4' margin='none'>Add change plan</Heading>
                            <p>Add a new change plan.</p>
                            <Box direction='column' flex alignSelf='stretch'>
                                <Button primary icon={<Add/>} label="Add" onClick={() => {
                                    this.setState({popupType: "Add"})
                                }}/>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            );
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
                                   changeplanutils.getChangePlans(this.itemCount, userutils.getLoggedInUserUsername(), (newItemCount, newStart, changePlans, empty) => {
                                       if(!empty && newItemCount){
                                           this.itemCount = newItemCount;
                                           this.startAfter = newStart;
                                           this.setState({
                                               changePlans: changePlans,
                                           });
                                       }
                                   }, this.startAfter);
                               }
                           }}
                           onClickRow={({datum}) => {
                               this.props.history.push('/changeplans/' + datum.id)
                           }}
                           columns={this.generateColumns()} data={this.state.changePlans} size={"large"}/>
            )
        }
    }

    generateColumns() {
        let cols = [
            {
                property: "count",
                header: <Text size={"small"}>ID</Text>,
                primary: true,
                render: datum => (<Text size={"small"}>{datum.count}</Text>)
            },
            {
                property: "name",
                header: <Text size='small'>Name</Text>,
                render: datum => (
                    <Text size='small'>{datum.name}</Text>)
            },
            {
                property: "owner",
                header: <Text size='small'>Owner</Text>,
                render: datum => (
                    <Text size='small'>{datum.owner}</Text>)
            },
            {
                property: "executed",
                header: <Text size='small'>Executed</Text>,
                render: datum => (
                    <Text size='small'>{datum.executed.toString()}</Text>)
            },
            {
                property: "Edit",
                header: <Text size='small'>Edit</Text>,
                render: datum => (
                    <Edit onClick={(e) => {
                        e.persist();
                        e.nativeEvent.stopImmediatePropagation();
                        e.stopPropagation();
                        this.setState({
                            editName: datum.name,
                            editID: datum.id,
                            popupType: "Edit"
                        })
                    }}/>)
            },
            {
                property: "execute",
                header: <Text size='small'>Execute</Text>,
                render: datum => (
                    <Checkmark/>)
            },
            {
                property: "delete",
                header: <Text size='small'>Delete</Text>,
                render: datum => (
                    <Trash onClick={(e) => {
                        e.persist();
                        e.nativeEvent.stopImmediatePropagation();
                        e.stopPropagation();
                        this.setState({
                            deleteName: datum.name,
                            deleteID: datum.id,
                            popupType: "Delete"
                        })
                    }}/>)
            },
            {
                property: "workorder",
                header: <Text size='small'>Work Order</Text>,
                render: datum => (
                    <Print onClick={(e) => {
                        e.persist();
                        e.nativeEvent.stopImmediatePropagation();
                        e.stopPropagation();
                        this.props.history.push('/changeplans/' + datum.id + '/workorder')
                    }}/>)
            }
        ];
        return cols;
    }

    cancelPopup = (data) => {
        this.setState({
            popupType: ""
        })
    };

    callbackFunction = (data) => {
        this.forceRefresh();
    };

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/'/>
        }

        const {popupType} = this.state;
        let popup;

        if (popupType === 'Add') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <AddChangePlanForm parentCallback={this.callbackFunction}/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if(popupType === 'Delete'){
            popup = (
                <DeleteChangePlanForm cancelPopup={this.cancelPopup} forceRefresh={this.callbackFunction}
                                      name={this.state.deleteName} id={this.state.deleteID}/>
            )
        } else if(popupType === 'Edit'){
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <EditChangePlanForm parentCallback={this.callbackFunction} name={this.state.editName} id={this.state.editID}/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        }

        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill background='light-2'>
                    <AppBar>
                        <HomeButton alignSelf='start' this={this}/>
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }}>Change Plans</Heading>
                        <UserMenu alignSelf='end' this={this}/>
                    </AppBar>
                    <Box direction='row'
                         justify='center'
                         wrap={true}>
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

export default ChangePlanScreen