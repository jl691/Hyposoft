import React from 'react'
import { LinkPrevious } from 'grommet-icons'
import IconButton from './IconButton'

const BackButton = props => <IconButton icon={<LinkPrevious size='medium' />} onClick={() => props.this.props.history.goBack()} />
export default BackButton
