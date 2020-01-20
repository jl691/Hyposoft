import React from 'react'
import { Add } from 'grommet-icons'
import { Button } from 'grommet'



const AddModelButton = props => 
<Button
    label="Add Model" 
    icon={<Add />} 
    // TODO: Correct functionality here
    onClick={() => props.this.props.history.push('/dashboard')} 
/>

export default AddModelButton
