import React from "react";
import * as offlinestorageutils from "../utils/offlinestorageutils";
import {Box, Button, Grommet, Heading, Text, DataTable, Layer} from "grommet";
import theme from "../theme";
import AppBar from "../components/AppBar";
import HomeMenu from "../components/HomeMenu";
import UserMenu from "../components/UserMenu";
import {ToastsContainer, ToastsStore} from "react-toasts";
import * as userutils from "../utils/userutils";
import {Add, Close, Edit, Trash} from "grommet-icons";
import {Redirect} from "react-router-dom";
import AddOfflineStorageForm from "../components/AddOfflineStorageForm";
import EditOfflineStorageForm from "../components/EditOfflineStorageForm";
import DeleteOfflineStorageForm from "../components/DeleteOfflineStorageForm";

class OfflineStorageScreen extends React.Component {

    startAfter = null;
    itemCount = 1;
    colors = {};

    constructor(props) {
        super(props);
        this.state = {
            storageSites: [],
            initialLoaded: false,
            popupType: "",
        }

    }

    componentDidMount() {
        this.forceRefresh()
    }

    forceRefresh() {
        this.startAfter = null;
        this.setState({
            storageSites: [],
            initialLoaded: false,
            popupType: "",
        });
        offlinestorageutils.getStorageSites(this.itemCount, (newItemCount, newStart, storageSites, empty) => {
            if (empty) {
                console.log(empty)
                this.setState({initialLoaded: true});
            } else if (newStart && storageSites) {
                console.log(storageSites)
                this.startAfter = newStart;
                this.setState({
                    storageSites: storageSites,
                    initialLoaded: true
                })
                this.itemCount = newItemCount;
            }
        })
    }

    AdminTools() {
        if (userutils.doesLoggedInUserHaveAssetPerm(null) || userutils.isLoggedInUserAdmin()) {
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
                            <Heading level='4' margin='none'>Add storage site</Heading>
                            <p>Add a new offline storage site.</p>
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
                                   offlinestorageutils.getStorageSites(this.itemCount, (newItemCount, newStartAfter, newStorageSites, empty) => {
                                       if (!empty) {
                                           this.startAfter = newStartAfter
                                           this.setState({storageSites: this.state.storageSites.concat(newStorageSites)})
                                           this.itemCount = newItemCount;
                                       }
                                   }, this.startAfter);
                               }
                           }}
                           columns={this.generateColumns()} data={this.state.storageSites} size={"large"}
                           onClickRow={({datum}) => {
                               this.props.history.push('offlinestorage/' + datum.abbreviation)
                           }}/>
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
                    <Text size='small' wordBreak={"break-all"}>{datum.name}</Text>)
            },
            {
                property: "abbreviation",
                header: <Text size='small'>Abbreviation</Text>,
                render: datum => (
                    <Text size='small'>{datum.abbreviation}</Text>)
            },
            {
                property: "assetCount",
                header: <Text size='small'>Assets</Text>,
                render: datum => (
                    <Text size='small'>{datum.assetCount}</Text>)
            }
        ];
        if (userutils.doesLoggedInUserHaveAssetPerm(null) || userutils.isLoggedInUserAdmin()) {
            cols.push({
                    property: "delete",
                    header: <Text size='small'>Delete</Text>,
                    render: datum =>
                        <Trash onClick={() => {
                            if (!datum.assetCount) {
                                this.setState({
                                    deleteName: datum.name,
                                    deleteAbbrev: datum.abbreviation,
                                    popupType: "Delete"
                                })
                            } else {
                                ToastsStore.error("Can't delete storage sites with existing assets.");
                            }
                        }}
                               style={{cursor: 'pointer', backgroundColor: this.colors[datum.count + '_edit_color']}}
                               onMouseOver={e => this.colors[datum.count + '_edit_color'] = '#dddddd'}
                               onMouseLeave={e => this.colors[datum.count + '_edit_color'] = ''}/>
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
                              style={{cursor: 'pointer', backgroundColor: this.colors[datum.count + '_edit_color']}}
                              onMouseOver={e => this.colors[datum.count + '_edit_color'] = '#dddddd'}
                              onMouseLeave={e => this.colors[datum.count + '_edit_color'] = ''}/>
                });
        }
        return cols;
    }

    callbackFunction = (data) => {
        ToastsStore.success(data);
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
                    <AddOfflineStorageForm parentCallback={this.callbackFunction}/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if (popupType === 'Delete') {
            popup = (
                <DeleteOfflineStorageForm cancelPopup={this.cancelPopup} forceRefresh={this.callbackFunction}
                                      name={this.state.deleteName} abbreviation={this.state.deleteAbbrev}/>
            )
        } else if (popupType === 'Edit') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <EditOfflineStorageForm parentCallback={this.callbackFunction} name={this.state.editName}
                                            abbreviation={this.state.editAbbrev}/>
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
                        }}>Offline Storage Sites</Heading>
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

export default OfflineStorageScreen
