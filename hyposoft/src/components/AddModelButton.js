import React from 'react'
import { Add } from 'grommet-icons'
import IconButton from './IconButton'



const AddModelButton = props => 
<IconButton 
    icon={<Add />} 
    label= "Add Model" 
    // TODO: Correct functionality here
    onClick={() => props.this.props.history.push('/dashboard')} 
/>

export default AddModelButton
