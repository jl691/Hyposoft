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
import BackButton from "../components/BackButton";

class DetailedChangePlanScreen extends React.Component {

    startAfter = null;
    changePlanID;

    constructor(props) {
        super(props);
        this.state = {
            changes: [],
            initialLoaded: false,
            popupType: ""
        }
    }

    componentDidMount() {
        this.changePlanID = this.props.match.params.changePlanID;
        this.forceRefresh()
    }

    forceRefresh() {
        this.startAfter = null;
        this.setState({
            changes: [],
            initialLoaded: false,
            popupType: "",
        });
        changeplanutils.getChanges(this.props.match.params.changePlanID, (newStart, changes, empty) => {
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
                            <Heading level='4' margin='none'>Add change</Heading>
                            <p>Add a new change.</p>
                            <Box direction='column' flex alignSelf='stretch'>
                                <Button primary icon={<Add/>} label="Add" onClick={() => {
                                    this.setState({popupType: "Add"})
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
                                   changeplanutils.getChanges(this.changePlanID, (newStart, changes, empty) => {
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
                    <Text size='small'>{datum.assetID}</Text>)
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
                    <Edit/>)
            },
            {
                property: "delete",
                header: <Text size='small'>Delete</Text>,
                render: datum => (
                    <Trash/>)
            }
        ];
        return cols;
    }

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

        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill background='light-2'>
                    <AppBar>
                        <BackButton alignSelf='start' this={this}/>
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }}>Change Plan: {this.changePlanID}</Heading>
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
                {/*                {popup}*/}
                <ToastsContainer store={ToastsStore}/>
            </Grommet>
        )
    }

}

export default DetailedChangePlanScreen