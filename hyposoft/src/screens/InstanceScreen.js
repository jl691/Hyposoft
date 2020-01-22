import React, { Component } from 'react'
import { Text, Button, Layer, Grommet, Heading, Box } from 'grommet'
import { Close, Add } from 'grommet-icons'
import AddInstanceForm from '../components/AddInstanceForm'

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
            deleteID: ""
        }

        this.handleCancelPopupChange = this.handleCancelPopupChange.bind(this);
    }


    handleCancelPopupChange(event) {
        console.log(this.state)
        this.setState({
            popupType: ""
        });
   
    }

    render() {

        const { popupType } = this.state;
        let popup;


        if (popupType === 'Add') {
            console.log(this.state)
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>
                        
                    <AddInstanceForm cancelCallbackFromParent={this.handleCancelPopupChange}
                    
                    />

                </Layer>
            )
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
                                <strong>Add Instance</strong>
                            </Text>
                        }

                        onClick={() => this.setState({ popupType: "Add" })}
                    />


                </FilterBarInstances>

                <InstanceTable>

                </InstanceTable>


            </Grommet>

        )
    }
}



export default InstanceScreen
