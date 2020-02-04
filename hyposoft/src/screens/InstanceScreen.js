import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import { Text, Button, Layer, Grommet, Heading, Box, TextInput, RadioButtonGroup, Stack } from 'grommet'
import { Add } from 'grommet-icons'
import AddInstanceForm from '../components/AddInstanceForm'
import DeleteInstancePopup from '../components/DeleteInstancePopup'
import EditInstanceForm from '../components/EditInstanceForm'

import theme from '../theme'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import FilterBarInstances from '../components/FilterBarInstances'
import SearchInstances from '../components/SearchInstances'
import InstanceTable from '../components/InstanceTable'
import * as userutils from "../utils/userutils";
import { ToastsContainer, ToastsStore } from "react-toasts";

class InstanceScreen extends Component {

    rangeStart;
    rangeEnd;
    rackSort;
    rackUSort;

    constructor(props) {
        super(props);
        this.state = {
            instances: [],
            popupType: "",
            deleteID: "",
            deleteModel: "",
            deleteHostname: "",
            updateID: "",
            initialLoaded: false,
            updateModel: "",
            updateHostname: "",
            updateRack: "",
            updateRackU: "",
            updateOwner: "",
            updateComment: "",
            rangeNumberStart: "",
            rangeNumberEnd: "",

        }

        this.handleCancelPopupChange = this.handleCancelPopupChange.bind(this);
        this.handleCancelRefreshPopupChange = this.handleCancelRefreshPopupChange.bind(this);
        this.handleDeleteButton = this.handleDeleteButton.bind(this);
        this.handleUpdateButton = this.handleUpdateButton.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeRange = this.handleChangeRange.bind(this);


        this.instanceTable = React.createRef();
    }
    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    handleChangeRange(event) {
        if (event.target.name === "rangeNumberStart") {
            console.log("start")
            this.rangeStart = event.target.value;
        } else if (event.target.name === "rangeNumberEnd") {
            console.log("end")
            this.rangeEnd = event.target.value;
        }
        if (/[A-Z]\d+/.test(this.rangeStart) && /[A-Z]\d+/.test(this.rangeEnd)) {
            this.instanceTable.current.handleFilter(this.rangeStart, this.rangeEnd);
        } else {
            this.instanceTable.current.restoreDefault();
        }
    }

    handleCancelRefreshPopupChange() {
        this.setState({
            popupType: ""
        });
        //TODO: READ https://stackoverflow.com/questions/37949981/call-child-method-from-parent
        this.instanceTable.current.forceRefresh();
    }

    handleCancelPopupChange() {
        this.setState({
            popupType: ""
        });
    }

    handleDeleteButton = (datum) => {
        console.log(datum.model);
        this.setState({
            popupType: 'Delete',
            deleteID: datum.instance_id,
            deleteModel: datum.model,
            deleteHostname: datum.hostname
        });
    }
    handleUpdateButton = (datumID, datumModel, datumHostname, datumRack, datumRackU, datumOwner, datumComment) => {
        this.setState({
            popupType: 'Update',
            updateID: datumID,
            updateModel: datumModel,
            updateHostname: datumHostname,
            updateRack: datumRack,
            updateRackU: datumRackU,
            updateOwner: datumOwner,
            updateComment: datumComment,


        });

    }

    addButton() {
        if (userutils.isLoggedInUserAdmin()) {
            return (<Button
                icon={<Add />}
                label={
                    <Text>
                        Add Instance
                    </Text>
                }

                onClick={() => this.setState({ popupType: "Add" })}
            />);
        }
    }

    combinedSortAscButton() {
        return (<Button
            margin="medium"
            label={
                <Text>
                    Ascending
                </Text>
            }

            onClick={() => this.handleAscSort}
        />);


    }
    handleAscSort() {
        //instutils.

    }

    componentDidMount() {
        ToastsStore.info("Tip: Click on a column name to sort by it", 10000)
    }

    render() {
        const { popupType } = this.state;
        let popup;

        if (popupType === 'Add') {

            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>

                    <AddInstanceForm
                        parentCallback={this.handleCancelRefreshPopupChange}
                        cancelCallback={this.handleCancelPopupChange}
                    />

                </Layer>
            )
        }
        else if (popupType === 'Delete') {

            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>

                    <DeleteInstancePopup
                        parentCallback={this.handleCancelRefreshPopupChange}
                        cancelCallback={this.handleCancelPopupChange}
                        deleteIDFromParent={this.state.deleteID}
                        deleteModel={this.state.deleteModel}
                        deleteHostname={this.state.deleteHostname}

                    />
                </Layer>
            )
        }

        else if (popupType === 'Update') {
            console.log("In parent: updateID is " + this.state.updateID)

            popup = (

                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>

                    <EditInstanceForm
                        parentCallback={this.handleCancelRefreshPopupChange}
                        cancelCallback={this.handleCancelPopupChange}

                        updateIDFromParent={this.state.updateID}
                        updateModelFromParent={this.state.updateModel}
                        updateHostnameFromParent={this.state.updateHostname}
                        updateRackFromParent={this.state.updateRack}
                        updateRackUFromParent={this.state.updateRackU}
                        updateOwnerFromParent={this.state.updateOwner}
                        updateCommentFromParent={this.state.updateComment}
                    />
                </Layer>
            )

        }


        return (

            <Router>

                <Route
                    exact path="/instances" render={props => (
                        <React.Fragment>
                            <Grommet theme={theme} full className='fade'>
                                <Box fill background='light-2'>
                                    {popup}
                                    <AppBar>

                                        <HomeButton alignSelf='start' this={this} />
                                        <Heading alignSelf='center' level='4' margin={{
                                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                        }} >Instances</Heading>
                                        <UserMenu alignSelf='end' this={this} />
                                    </AppBar>


                                    <Box direction='row'
                                        justify='center'
                                        wrap={true}
                                        overflow="scroll">
                                        <Box direction='row' justify='center' overflow="scroll">
                                            <Box direction='row' justify='center' overflow="scroll">
                                                <Box width='large' direction='column' align='stretch' justify='start' overflow="scroll">
                                                    <Box style={{
                                                        borderRadius: 10,
                                                        borderColor: '#EDEDED'
                                                    }}
                                                        id='containerBox'
                                                        direction='row'
                                                        background='#FFFFFF'
                                                        margin={{ top: 'medium', bottom: 'medium' }}
                                                        flex={{
                                                            grow: 0,
                                                            shrink: 0
                                                        }}

                                                        pad='small' overflow="scroll">
                                                        <Box margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column'
                                                            justify='start' alignSelf='stretch' flex overflow="scroll">
                                                            <Box align="center" overflow="scroll">
                                                                <InstanceTable
                                                                    deleteButtonCallbackFromParent={this.handleDeleteButton}

                                                                    UpdateButtonCallbackFromParent={this.handleUpdateButton}

                                                                    ref={this.instanceTable}

                                                                />
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box >

                                            {/* BEGNINNING OF FILTER BAR ==========*/}
                                            <Box
                                                width='medium'
                                                align='center'
                                                margin={{ left: 'medium', right: 'medium' }}
                                                justify='start' >
                                                {/* This box below is for Search */}
                                                <Box style={{
                                                    borderRadius: 10,
                                                    borderColor: '#EDEDED'
                                                }}
                                                    direction='row'
                                                    alignSelf='stretch'
                                                    background='#FFFFFF'
                                                    width={'medium'}
                                                    margin={{ top: 'medium', left: 'medium', right: 'medium' }}
                                                    pad='small' >
                                                    <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column' justify='start'>



                                                        <Text size='small'><b>Search Instances</b></Text>
                                                        <Stack margin={{ top: 'small' }}>
                                                            <SearchInstances />
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                                {/* This box below is for range of racks */}
                                                <Box style={{
                                                    borderRadius: 10,
                                                    borderColor: '#EDEDED'
                                                }}
                                                    direction='row'
                                                    alignSelf='stretch'
                                                    background='#FFFFFF'
                                                    width={'medium'}
                                                    margin={{ top: 'medium', left: 'medium', right: 'medium' }}
                                                    pad='small' >
                                                    <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column' justify='start'>
                                                        <Text size='small'><b>Filter By Rack Range</b></Text>
                                                        <Stack margin={{ top: 'small' }}>
                                                            <Box gap='small' direction="column" margin='small'>

                                                                <TextInput name="rangeNumberStart" placeholder="eg. B1" size="xsmall" onChange={this.handleChangeRange} />
                                                                to
                                                                <TextInput name="rangeNumberEnd" placeholder="eg. C21" size="xsmall" onChange={this.handleChangeRange} />
                                                            </Box>

                                                        </Stack>
                                                    </Box>
                                                </Box>
                                           
                                                {/* Button to Add an Instance: */}
                                                <Box margin="17px" align="center" direction="column" justify="center">
                                                    {this.addButton()}
                                                </Box>
                                                 {/* Button for combined sort: */}
                                                 <Box style={{
                                                    borderRadius: 10,
                                                    borderColor: '#EDEDED'
                                                }}
                                                    direction='row'
                                                    alignSelf='stretch'
                                                    background='#FFFFFF'
                                                    width={'medium'}
                                                    margin={{ top: 'medium', left: 'medium', right: 'medium' }}
                                                    pad='small' >
                                                    <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column' justify='start'>
                                                        <Text size='small'><b>Combined Rack and Rack U Sort</b></Text>
                                                        {this.combinedSortAscButton()}

                                                        
                                                    </Box>
                                                </Box>

                                            </Box>
                                            {/* END OFF FILTER BAR ================= */}


                                        </Box>

                                    </Box>


                                    <ToastsContainer store={ToastsStore} />

                                </Box>


                            </Grommet>

                        </React.Fragment>

                    )}

                />

            </Router>
        )
    }
}



export default InstanceScreen
