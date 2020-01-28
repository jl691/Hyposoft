import React from "react";
import theme from "../theme";
import {grommet, Box, Text, Grommet, Meter, DataTable} from "grommet";
import * as rackutils from "../utils/rackutils";

class RackUsageReport extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            initialLoaded: false,
            count: 0,
            total: 0,
            vendor: new Map(),
            model: new Map(),
            owner: new Map()
        }
    }

    componentDidMount() {
        rackutils.generateRackUsageReport(this.props.rack, (count, total, vendor, model, owner) => {
            this.setState({
                initialLoaded: true,
                count: count,
                total: total,
                vendor: vendor,
                model: model,
                owner: owner
            })
        })
    }

    convertMapToData(map, name){
        let arr = [];
        map.forEach((key, value) => {
             arr.push({
                 [name]: value,
                 used: key
             })
        })
        return arr;
    }

    render() {
        if (!this.state.initialLoaded) {
            return (<Text>Please wait...</Text>);
        }
        return (
            <Grommet theme={theme}>
                <Box width={"medium"} align={"center"}>
                    <Text>Total usage: {this.state.count}/{this.state.total}</Text>
                    <Meter values={
                        [
                            {
                                value: [this.state.count]/[this.state.total]*100
                            }
                        ]
                    } type={"circle"} size={"small"}/>
                    <Text>Usage by vendor:</Text>
                    <DataTable columns={[
                        {
                            property: "vendor",
                            header: "Vendor",
                            primary: true
                        },
                        {
                            property: "used",
                            header: "Used"
                        }
                    ]} data={this.convertMapToData(this.state.vendor, "vendor")}/>
                    <Text>Usage by model:</Text>
                    <DataTable columns={[
                        {
                            property: "model",
                            header: "Model",
                            primary: true
                        },
                        {
                            property: "used",
                            header: "Used"
                        }
                    ]} data={this.convertMapToData(this.state.model, "model")}/>
                    <Text>Usage by owner:</Text>
                    <DataTable columns={[
                        {
                            property: "owner",
                            header: "Owner",
                            primary: true
                        },
                        {
                            property: "used",
                            header: "Used"
                        }
                    ]} data={this.convertMapToData(this.state.owner, "owner")}/>
                </Box>
            </Grommet>
        );
    }
}

export default RackUsageReport