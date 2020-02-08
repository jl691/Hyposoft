import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import { Text, Button, Layer, Grommet, Heading, Box, TextInput, RadioButtonGroup, Stack } from 'grommet'
import { Add } from 'grommet-icons'
import AddAssetForm from '../components/AddAssetForm'
import DeleteAssetPopup from '../components/DeleteAssetPopup'
import EditAssetForm from '../components/EditAssetForm'

import theme from '../theme'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import FilterBarAssets from '../components/FilterBarAssets'
import SearchAssets from '../components/SearchAssets'
import AssetTable from '../components/AssetTable'
import * as userutils from "../utils/userutils";
import { ToastsContainer, ToastsStore } from "react-toasts";

class AssetScreen extends Component {

    rangeStart;
    rangeEnd;
    rackSort;
    rackUSort;

    constructor(props) {
        super(props);
        this.state = {
            assets: [],
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


        this.assetTable = React.createRef();
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
            this.assetTable.current.handleFilter(this.rangeStart, this.rangeEnd);
        } else {
            this.assetTable.current.restoreDefault();
        }
    }

    handleCancelRefreshPopupChange() {
        this.setState({
            popupType: ""
        });
        //TODO: READ https://stackoverflow.com/questions/37949981/call-child-method-from-parent
        this.assetTable.current.forceRefresh();
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
            deleteID: datum.asset_id,
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
                        Add Asset
                    </Text>
                }

                onClick={() => this.setState({ popupType: "Add" })}
            />);
        }
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

                    <AddAssetForm
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

                    <DeleteAssetPopup
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

                    <EditAssetForm
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
                    exact path="/assets" render={props => (
                        <React.Fragment>
                            <Grommet theme={theme} full className='fade'>
                                <Box fill background='light-2'>
                                    {popup}
                                    <AppBar>

                                        <HomeButton alignSelf='start' this={this} />
                                        <Heading alignSelf='center' level='4' margin={{
                                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                        }} >Assets</Heading>
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
                                                                <AssetTable
                                                                    deleteButtonCallbackFromParent={this.handleDeleteButton}

                                                                    UpdateButtonCallbackFromParent={this.handleUpdateButton}

                                                                    ref={this.assetTable}

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



                                                        <Text size='small'><b>Search Assets</b></Text>
                                                        <Stack margin={{ top: 'small' }}>
                                                            <SearchAssets />
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
                                                {/* This box is for combined sort on Rack and Rack U */}
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
                                                        <Text size='small'><b>Combined Sort</b></Text>
                                                        <Stack margin={{ top: 'small' }}>
                                                            <Box gap='small' direction="column" margin='small'>
                                                                {/* Put sort buttons here */}
                                                                <Text size='small'><b>Rack</b></Text>
                                                                <Box direction="row" justify="start" margin="small">
                                                                    <RadioButtonGroup
                                                                        label="Rack"
                                                                        name="rack"
                                                                        options={[
                                                                            { label: "Ascending", value: "rackAsc" },
                                                                            { label: "Descending", value: "rackDesc" },

                                                                        ]}
                                                                        //value={this.rackSort}
                                                                        // onChange={this.setState(rackSort= value)}
                                                                        {...props}
                                                                    />

                                                                </Box>
                                                                <Text size='small'><b>Rack U</b></Text>
                                                                <Box direction="row" justify="start" margin="small">
                                                                    <RadioButtonGroup
                                                                        label="Rack U"
                                                                        name="rackU"
                                                                        options={[
                                                                            { label: "Ascending", value: "rackUAsc" },
                                                                            { label: "Descending", value: "rackUDesc" },

                                                                        ]}
                                                                        //value={this.rackSort}
                                                                        // onChange={this.setState(rackSort= value)}
                                                                        {...props}
                                                                    />
                                                                </Box>
                                                                <Box margin="17px"  direction="column" justify="center">
                                                                    <Button label={<Text size="small"> Apply sort</Text>} />
                                                                </Box>


                                                            </Box>

                                                        </Stack>
                                                    </Box>
                                                </Box>
                                                {/* Button to Add an Instance: */}
                                                <Box margin="17px" align="center" direction="column" justify="center">
                                                    {this.addButton()}
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



export default AssetScreen
