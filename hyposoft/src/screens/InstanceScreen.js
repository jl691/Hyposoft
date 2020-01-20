import React, { Component } from 'react'

import {
    Heading,
    Grommet } from 'grommet'

import theme from '../theme'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import FilterBarInstances from '../components/FilterBarInstances'
import SearchInstances from '../components/SearchInstances'
import AddInstanceButton from '../components/AddInstanceButton'
import InstanceTable from '../components/InstanceTable'

class InstanceScreen extends Component {

    render() {
        return (
            <Grommet theme={theme} full className='fade'>
                <AppBar>
                    <HomeButton alignSelf='start' this={this} />
                    <Heading alignSelf='center' level='4' margin={{
                        top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                    }} >Instances</Heading>
                    <UserMenu alignSelf='end' this={this} />
                </AppBar>
                <FilterBarInstances>
                    <SearchInstances/>
                    {/* <AddInstanceButton/> */}

                </FilterBarInstances>
                
                <InstanceTable>
                  
                </InstanceTable>

      
            </Grommet>
           
        )
    }
}



export default InstanceScreen
