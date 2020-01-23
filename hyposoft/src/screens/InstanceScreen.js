import React, { Component } from 'react'
import { Text, Button, Layer, Grommet, Heading} from 'grommet'
import { Add } from 'grommet-icons'
import AddInstanceForm from '../components/AddInstanceForm'
import DeleteInstancePopup from '../components/DeleteInstancePopup'

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
            initialLoaded: false
        }

        this.handleCancelPopupChange = this.handleCancelPopupChange.bind(this);
        this.handleDeleteButton = this.handleDeleteButton.bind(this);


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
            deleteID: datumID

           
        });
    }


    render() {

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

            console.log(this.state)

        }


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
                    passDeleteIDCallbackFromParent={this.passDeleteID}
                   
                />


            </Grommet>

        )
    }
}



export default InstanceScreen
