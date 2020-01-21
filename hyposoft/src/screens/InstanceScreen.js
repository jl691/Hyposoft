import React, { Component } from 'react'
import { Text, Button, Layer, Grommet, Heading } from 'grommet'
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
    }

    // AdminTools() {
    //     if (userutils.isLoggedInUserAdmin()) {
    //         return (
    //             <Box direction={"row"}>
    //                 <Button icon={<Add/>} label={"Add"} style={{width: '150px'}} onClick={() => this.setState({popupType: "Add"})}/>
    //                 {/* <Button icon={<Trash/>} label={"Remove"} style={{width: '150px'}} onClick={() => this.setState({popupType: "Remove"})}/> */}
    //             </Box>
    //         );
    //     }
    // }

    render() {
        
        const { popupType } = this.state;
        let popup;

        if (popupType === 'Add') {
            popup = (
                <Layer height="small" width="medium" onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>
                    <AddInstanceForm />
                    
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
