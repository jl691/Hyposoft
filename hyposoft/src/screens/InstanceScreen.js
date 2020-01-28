import React, { Component } from 'react'
import { Text, Button, Layer, Grommet, Heading, Box, TextInput, Select } from 'grommet'
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

    constructor(props) {
        super(props);
        this.state = {
            instances: [],
            popupType: "",
            deleteID: "",
            updateID:"",
            initialLoaded: false,
            updateModel:"",
            updateHostname:"",
            updateRack:"",
            updateRackU:"",
            updateOwner:"",
            updateComment:""
            
        }

        this.handleCancelPopupChange = this.handleCancelPopupChange.bind(this);
        this.handleDeleteButton = this.handleDeleteButton.bind(this);
        this.handleUpdateButton = this.handleUpdateButton.bind(this);


    }
    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }


    handleCancelPopupChange(event) {
        this.setState({
            popupType: ""
        });

    }
    //This handles the delete screen popping up from pressing on the trash can, not the actual backend of what happens when the delete is confirmed
    handleDeleteButton = (datumID) => {
        this.setState({
            popupType: 'Delete',
            deleteID: datumID,
     


        });
    }


    handleUpdateButton = (datumID, datumModel, datumHostname, datumRack, datumRackU, datumOwner, datumComment) => {
        //then go into editInstanceForm to make sure you pass in correct data to child for backend method
       
        this.setState({
            popupType: 'Update',
            updateID: datumID,
            updateModel:datumModel,
            updateHostname:datumHostname,
            updateRack:datumRack,
            updateRackU:datumRackU,
            updateOwner:datumOwner,
            updateComment:datumComment
           
        });

      
    }



    render() {
        //  const [value, setValue] = React.useState('medium');
        const { popupType } = this.state;
        let popup;

        if (popupType === 'Add') {

            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>

                    <AddInstanceForm
                        cancelCallbackFromParent={this.handleCancelPopupChange}
                    //TODO: need to pass info amongst siblings: AddInstanceForm to InstanceScreen to InstanceTable
                    // parentCallbackRefresh={this.callbackFunctionRefresh}
                    />

                </Layer>
            )
        }
        else if (popupType === 'Delete') {

            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>

                    <DeleteInstancePopup
                        cancelCallbackFromParent={this.handleCancelPopupChange}

                        deleteIDFromParent={this.state.deleteID}

                    />

                </Layer>
            )


        }

        else if (popupType === 'Update') {
           
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>

                    <EditInstanceForm
                        cancelCallbackFromParent={this.handleCancelPopupChange}

                        //need to pass in all the data though for the update
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
        console.log(this.state.updateModel)


        return (
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
                        <TextInput name="rangeNumberStart" placeholder="eg. B1" onChange={this.handleChange} />
                        to
                        <TextInput name="rangeNumberEnd" placeholder="eg. C21" onChange={this.handleChange} />
                    </Box>

                    <Box gap='small' margin='small'>
                        <Text  > Sort By </Text>
                        <Select
                            //TODO: this allows you to sort by short form fields. Need backend
                            options={['Model', 'Hostname', 'Rack and RackU', 'Owner']}
                        // value={value}
                        //onChange={({ option }) => setValue(option)} //see line 54

                        />

                    </Box>


                    {/* Button to Add an Instance: */}
                    <Button
                        icon={<Add />}
                        label={
                            <Text>
                                Add Instance
                            </Text>
                        }

                        onClick={() => this.setState({ popupType: "Add" })}
                    />
                </FilterBarInstances>

                <InstanceTable
                    deleteButtonCallbackFromParent={this.handleDeleteButton}

                    UpdateButtonCallbackFromParent={this.handleUpdateButton}
                

                />


            </Grommet>

        )
    }
}



export default InstanceScreen
