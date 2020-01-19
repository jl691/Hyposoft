import React from "react";
import theme from "../theme";
import {Box, Heading, Grommet, Button, DataTable, Meter} from "grommet";
import {Add, Trash} from "grommet-icons";
import * as userutils from "../utils/userutils";
import * as rackutils from "../utils/rackutils";

function AdminTools() {
    if (userutils.isLoggedInUserAdmin()) {
        return (
            <Box direction={"row"}>
                <Button icon={<Add/>} label={"Add"} style={{width: '150px'}} onClick={() => {
                }}/>
                <Button icon={<Trash/>} label={"Remove"} style={{width: '150px'}} onClick={() => {
                }}/>
            </Box>
        );
    }
}

class RackView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            racks: []
        }
    }

    componentDidMount() {
        rackutils.getRacks(racksdb => {
            console.log(racksdb);
            this.setState({racks: racksdb});
        })
    }

    render() {
        return (
            <Grommet theme={theme}>
                <Box border={{color: 'brand', size: 'medium'}} pad={"medium"}>
                    <Heading margin={"none"}>Racks</Heading>
                    <AdminTools/>
                    <DataTable columns={
                        [
                            {
                                property: "letter",
                                header: "Row",
                                primary: true
                            },
                            {
                                property: "number",
                                header: "Position"
                            },
                            {
                                property: "height",
                                header: "Occupied",
                                render: datum => (
                                    <Box pad={{vertical: 'xsmall'}}>
                                        <Meter
                                            values={[{value: datum.instances / 42 * 100}]}
                                            thickness="small"
                                            size="small"
                                        />
                                    </Box>
                                )
                            },
                            {

                                property: "instances",
                                header: "Instances"
                            }
                        ]
                    } data={this.state.racks}/>
                </Box>
            </Grommet>
        )
    }
}

export default RackView