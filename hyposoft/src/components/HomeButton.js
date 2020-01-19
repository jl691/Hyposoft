import React from 'react'
import { Home } from 'grommet-icons'
import IconButton from './IconButton'

const HomeButton = props => <IconButton icon={<Home size='medium' />} onClick={() => props.this.props.history.push('/')} />
export default HomeButton
