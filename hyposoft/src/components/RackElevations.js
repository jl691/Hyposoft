import React from "react";
import {Box, Grid, Grommet} from "grommet";
import SingleRackElevation from "./SingleRackElevation";

class RackElevations extends React.Component {
    render() {
        return (
            <Grommet>
                <Grid gap="none" columns={{
                    count: 4,
                    size: "auto"
                }}>
                    <Box>
                        <SingleRackElevation rackID={"EKRRNRRxDy7HNkbUwAkm"}/>
                    </Box>
                    <Box>
                        <SingleRackElevation rackID={"2S7GvTuxCnUe4wnKXOkE"}/>
                    </Box>
                    <Box>
                        <SingleRackElevation rackID={"7jODQZC9EMocuvk5apLE"}/>
                    </Box>
                    <Box>
                        <SingleRackElevation rackID={"u7JEN1YmRKY8xHHI4JRa"}/>
                    </Box>
                </Grid>
            </Grommet>
        )
    }
}

export default RackElevations