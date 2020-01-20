import React from 'react'
import { Button } from 'grommet'

const IconButton = (props) => (
    <Button margin={{left: 'small'}} icon={props.icon} onClick={props.onClick} />
)
export default IconButton
