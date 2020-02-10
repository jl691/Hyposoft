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
import * as instutils from "../utils/instanceutils";
import { ToastsContainer, ToastsStore } from "react-toasts";

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '89a91cdfab76a8541fe5d2da46765377')
const index = client.initIndex('instances')

class InstanceScreen extends Component {

    rangeStart;
    rangeEnd;
    rackSort;
    rackUSort;

    constructor(props) {
        super(props);
        this.state = {
            instances: [],
            sortedInstances:[],
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
            rackSortChoice: "asc",//by default, will be ascending
            rackUSortChoice: "asc",
            searchQuery: ""

        }

        this.handleCancelPopupChange = this.handleCancelPopupChange.bind(this);
        this.handleCancelRefreshPopupChange = this.handleCancelRefreshPopupChange.bind(this);
        this.handleDeleteButton = this.handleDeleteButton.bind(this);
        this.handleUpdateButton = this.handleUpdateButton.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeRange = this.handleChangeRange.bind(this);
        this.handleRadioButtonChange = this.handleRadioButtonChange.bind(this);
        this.handleCombinedSort = this.handleCombinedSort.bind(this);
        this.handleSearch = this.handleSearch.bind(this);


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
    handleRadioButtonChange(event) {
        if (event.target.name === "rackSortChoice") {
            console.log(event.target.value)
            this.rackSort = event.target.value;
            this.state.rackSortChoice = event.target.value

        }
        else if (event.target.name === "rackUSortChoice") {
            console.log(event.target.value)
            this.rackUSort = event.target.value;
            this.state.rackUSortChoice = event.target.value
        }
    }

    handleCombinedSort(event) {
        let rackBool=this.state.rackSortChoice === "asc"? true : false;
        let rackUBool=this.state.rackUSortChoice === "asc"? true : false;

        instutils.sortInstancesByRackAndRackU(rackBool, rackUBool, sortedInst => {
            console.log("Will be sorting racks: " + this.state.rackSortChoice)
            console.log("Will be sorting rackU: " + this.state.rackUSortChoice)

            if(sortedInst){
                this.state.sortedInstances=sortedInst;
                console.log(this.state.sortedInstances)
                this.instanceTable.current.handleRackRackUSort(sortedInst)
            }
            else{
                console.log("Done goofed somehow trying to sort")

            }

        })
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

    componentDidMount() {
        ToastsStore.info("Tip: Click on a column name to sort by it", 10000)
    }

    handleSearch () {
        if (this.state.searchQuery.trim() !== "") {
            index.search(this.state.searchQuery)
            .then(({ hits }) => {
                var results = []
                var itemNo = 1
                for (var i = 0; i < hits.length; i++) {
                    results = [...results, {...hits[i], id: hits[i].objectID, itemNo: itemNo++, instance_id: hits[i].objectID}]
                }
                console.log(results)
                this.setState(oldState => ({
                    ...oldState,
                    searchResults: results
                }))
            })
        } else {
            // reset
            this.setState(oldState => ({
                ...oldState,
                searchResults: undefined
            }))
        }
    }

    render() {
        const { popupType } = this.state;
        let popup;
        if (localStorage.getItem('tipShown') !== 'yes') {
            ToastsStore.info("Tip: Click on column headers to sort", 3000, 'burntToast')
            localStorage.setItem('tipShown', 'yes')
        }

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
                                        >
                                        <Box direction='row' justify='center' >
                                            <Box direction='row' justify='center' >
                                                <Box width='large' direction='column' align='stretch' justify='start' >
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

                                                        pad='small' >
                                                        <Box margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column'
                                                            justify='start' alignSelf='stretch' flex >
                                                            <Box align="center" >
                                                                <InstanceTable
                                                                    deleteButtonCallbackFromParent={this.handleDeleteButton}

                                                                    UpdateButtonCallbackFromParent={this.handleUpdateButton}
                                                                    searchResults={this.state.searchResults}
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
                                                            <SearchInstances parent={this} />
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


                                                {/* Box for Combined Rack and Rack U sort */}
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
                                                                        name="rackSortChoice"
                                                                        value={this.state.rackSortChoice}

                                                                        options={[
                                                                            { label: "Ascending", value: "asc" },
                                                                            { label: "Descending", value: "desc" },

                                                                        ]}

                                                                        onClick={e => {

                                                                            this.value = e.target.value
                                                                            this.setState(oldState => ({ ...oldState, rackSortChoice: this.value }))
                                                                            this.handleRadioButtonChange(e)

                                                                        }}

                                                                    />

                                                                </Box>
                                                                <Text size='small'><b>Rack U</b></Text>
                                                                <Box direction="row" justify="start" margin="small">
                                                                    <RadioButtonGroup
                                                                        label="Rack"
                                                                        name="rackUSortChoice"
                                                                        value={this.state.rackUSortChoice}

                                                                        options={[
                                                                            { label: "Ascending", value: "asc" },
                                                                            { label: "Descending", value: "desc" },

                                                                        ]}

                                                                        onClick={e => {

                                                                            this.value = e.target.value
                                                                            this.setState(oldState => ({ ...oldState, rackUSortChoice: this.value }))
                                                                            this.handleRadioButtonChange(e)

                                                                        }}

                                                                    />

                                                                </Box>
                                                                <Box margin="17px" direction="column" justify="center">
                                                                    <Button label={<Text size="small"> Apply sort</Text>} onClick={this.handleCombinedSort}/>
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



export default InstanceScreen
