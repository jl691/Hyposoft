import React from "react";
import * as datacenterutils from "../utils/datacenterutils";
import {Box, Button, Grommet, Heading, Text, DataTable, Layer} from "grommet";
import theme from "../theme";
import AppBar from "../components/AppBar";
import HomeMenu from "../components/HomeMenu";
import UserMenu from "../components/UserMenu";
import {ToastsContainer, ToastsStore} from "react-toasts";
import * as userutils from "../utils/userutils";
import {Add, Close, Edit, FormEdit, Trash} from "grommet-icons";
import {Redirect} from "react-router-dom";
import AddDatacenterForm from "../components/AddDatacenterForm";
import DeleteDatacenterForm from "../components/DeleteDatacenterForm";
import EditDatacenterForm from "../components/EditDatacenterForm";

class DatacenterScreen extends React.Component {

    startAfter = null;
    itemCount = 1;
    colors={};

    constructor(props) {
        super(props);
        this.state = {
            datacenters: [],
            initialLoaded: false,
            popupType: "",
            editName: "",
            editAbbrev: "",
            deleteName: "",
            deleteAbbrev: ""
        }
    }

    componentDidMount() {
        this.forceRefresh()
    }

    forceRefresh() {
        this.startAfter = null;
        this.setState({
            datacenters: [],
            initialLoaded: false,
            popupType: "",
            editName: "",
            editAbbrev: "",
            deleteName: "",
            deleteAbbrev: ""
        });
        datacenterutils.getDatacenters(this.itemCount, (newItemCount, newStart, datacenters, empty) => {
            console.log("got a callback!")
            console.log("yeeters 1", newStart)
            console.log("yeeters 2", datacenters)
            if (empty) {
                console.log("empty")
                this.setState({initialLoaded: true});
            } else if (newStart && datacenters) {
                console.log("made it yeeeet")
                this.startAfter = newStart;
                this.setState({
                    datacenters: datacenters,
                    initialLoaded: true
                })
                this.itemCount = newItemCount;
            }
        })
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
                            <Heading level='4' margin='none'>Add datacenter</Heading>
                            <p>Add a new datacenter.</p>
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
                                   datacenterutils.getDatacenters(this.itemCount, (newItemCount, newStartAfter, newDatacenters, empty) => {
                                       if (!empty) {
                                           this.startAfter = newStartAfter
                                           this.setState({datacenters: this.state.datacenters.concat(newDatacenters)})
                                           this.itemCount = newItemCount;
                                       }
                                   }, this.startAfter);
                               }
                           }}
                           columns={this.generateColumns()} data={this.state.datacenters} size={"large"}/>
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
                property: "abbreviation",
                header: <Text size='small'>Abbreviation</Text>,
                render: datum => (
                    <Text size='small'>{datum.abbreviation}</Text>)
            },
            {
                property: "rackCount",
                header: <Text size='small'>Racks</Text>,
                render: datum => (
                    <Text size='small'>{datum.rackCount}</Text>)
            }
        ];
        if (userutils.isLoggedInUserAdmin()) {
            cols.push({
                    property: "delete",
                    header: <Text size='small'>Delete</Text>,
                    render: datum =>
                        <Trash onClick={() => {
                            this.setState({
                                deleteName: datum.name,
                                deleteAbbrev: datum.abbreviation,
                                popupType: "Delete"
                            })
                        }}
                               style={{cursor: 'pointer', backgroundColor: this.colors[datum.count+'_edit_color']}}
                               onMouseOver={e => this.colors[datum.count+'_edit_color']='#dddddd'}
                               onMouseLeave={e => this.colors[datum.count+'_edit_color']=''}/>
                },
                {
                    property: "edit",
                    header: <Text size='small'>Edit</Text>,
                    render: datum =>
                        <Edit onClick={() => {
                            this.setState({
                                editName: datum.name,
                                editAbbrev: datum.abbreviation,
                                popupType: "Edit"
                            })
                        }}
                              style={{cursor: 'pointer', backgroundColor: this.colors[datum.count+'_edit_color']}}
                              onMouseOver={e => this.colors[datum.count+'_edit_color']='#dddddd'}
                              onMouseLeave={e => this.colors[datum.count+'_edit_color']=''}/>
                });
        }
        return cols;
    }

    callbackFunction = (data) => {
        this.forceRefresh();
    };

    cancelPopup = (data) => {
        this.setState({
            popupType: ""
        })
    }

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
                    <AddDatacenterForm parentCallback={this.callbackFunction}/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if(popupType === 'Delete'){
            popup = (
                <DeleteDatacenterForm cancelPopup={this.cancelPopup} forceRefresh={this.callbackFunction}
                                      name={this.state.deleteName} abbreviation={this.state.deleteAbbrev}/>
            )
        } else if (popupType === 'Edit') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <EditDatacenterForm parentCallback={this.callbackFunction} name={this.state.editName} abbreviation={this.state.editAbbrev}/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        }

        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill background='light-2'>
                    <AppBar>
                        <HomeMenu alignSelf='start' this={this}/>
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }}>Datacenters</Heading>
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

export default DatacenterScreen
