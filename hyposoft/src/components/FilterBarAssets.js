import React from 'react'
import { Box, Stack, Text } from 'grommet'


// TODO: add functionality, and UI components for filter, range, add Model, etc
// Might be a better idea to make each of these its own component, then come to this class to put all those
//components together. But that is a later me problem

const FilterBarAssets = (props) => (
    <Box
        width='medium'
        align='center'
        margin={{ left: 'medium', right: 'medium' }}
        justify='start' >
        <Box style={{
            borderRadius: 10,
            borderColor: '#EDEDED'
        }}
            direction='row'
            alignSelf='stretch'
            background='#FFFFFF'
            width={'medium'}
            margin={{ top: 'medium', left: 'medium', right: 'medium' }}
            pad='small' >
            <Box flex margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column' justify='start'>

                {/* {props.children} */}

                <Text size='small'><b>Height range</b></Text>
                <Stack margin={{ top: 'small' }}>
                    <Box background="light-4" height="10px" direction="row" round="large" />
                    <Text>Henlo</Text>
                </Stack>
            </Box>
        </Box>
    </Box>


)

export default FilterBarAssets
