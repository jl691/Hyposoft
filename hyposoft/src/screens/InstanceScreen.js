import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import {Text, Button, Layer, Grommet, Heading, Box, TextInput, RangeSelector} from 'grommet'
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

class InstanceScreen extends Component {

    rangeStart;
    rangeEnd;

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
        /*        console.log("big booty" + event.target.name)
                this.setState({
                    [event.target.name]: event.target.value
                });
                if(event.target.name === "rangeNumberStart"){
                    console.log("start")
                    if (/[A-Z]\d+/.test(event.target.value) && /[A-Z]\d+/.test(this.state.rangeNumberEnd)) {
                        this.instanceTable.current.handleFilter(event.target.value, this.state.rangeNumberEnd);
                    }
                } else if(event.target.name === "rangeNumberEnd"){
                    console.log("end")
                    if (/[A-Z]\d+/.test(this.state.rangeNumberStart) && /[A-Z]\d+/.test(event.target.value)) {
                        this.instanceTable.current.handleFilter(this.state.rangeLetterStart, event.target.value);
                    }
                }
                this.setState({
                    [event.target.name]: event.target.value
                });
                console.log(this.state.rangeNumberStart + " yeeters " + this.state.rangeNumberEnd)*/
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
            updateComment: datumComment

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
                        deleteModel = {this.state.deleteModel}
                        deleteHostname = {this.state.deleteHostname}

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
                                {popup}
                                <AppBar>

                                    <HomeButton alignSelf='start' this={this} />
                                    <Heading alignSelf='center' level='4' margin={{
                                        top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                                    }} >Instances</Heading>
                                    <UserMenu alignSelf='end' this={this} />
                                </AppBar>
                                <FilterBarInstances>
                                    <SearchInstances />

                                    <Box gap='small' direction="column" margin='small'>
                                        <Text> Range of Racks </Text>
                                        <TextInput name="rangeNumberStart" placeholder="eg. B1" onChange={this.handleChangeRange}/>
                                        to
                                        <TextInput name="rangeNumberEnd" placeholder="eg. C21" onChange={this.handleChangeRange} />
                                    </Box>
                                    

                                    
                                    {/* Button to Add an Instance: */}
                                    {this.addButton()}
                                </FilterBarInstances>

                                <InstanceTable
                                    deleteButtonCallbackFromParent={this.handleDeleteButton}

                                    UpdateButtonCallbackFromParent={this.handleUpdateButton}

                                    ref={this.instanceTable}

                                />
                            </Grommet>

                        </React.Fragment>

                    )}

                />

            </Router>
        )
    }
}



export default InstanceScreen
