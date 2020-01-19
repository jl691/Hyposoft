import React from 'react'
import { Box, Heading } from 'grommet'

const ClassInfoCard = props => (
    <Box style={styles.boxStyle}
        direction='row'
        alignSelf='stretch'
        background='#FFFFFF'
        width={'medium'}
        margin={{top: 'medium', left: 'medium'}}
        pad='small' >
        <Box flex margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}} direction='column' justify='start'>
            <Heading level='4' margin='none'>{props.title}</Heading>
            <p>{props.desc}</p>
        </Box>
    </Box>
)

const styles = {
    boxStyle: {
        borderRadius: 10,
        borderColor: '#EDEDED'
    }
}

export default ClassInfoCard
