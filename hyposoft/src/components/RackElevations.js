import React from "react";
import {Box, Button, Grid, Grommet, Heading, Text} from "grommet";
import SingleRackElevation from "./SingleRackElevation";
import * as jsPDF from 'jspdf';
import * as rackutils from "../utils/rackutils";
import theme from "../theme";
import HomeButton from "./HomeButton";
import UserMenu from "./UserMenu";
import AppBar from "./AppBar";

var doc, count, totalRacks;
var images = new Map();

class RackElevations extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            racks: []
        };
    }

    componentDidMount() {
        count = 0;
        this.getRackIDs();
        doc = new jsPDF({
            format: 'letter',
            orientation: 'landscape',
            unit: 'in'
        });
    }

    getRackIDs() {
        let startRow = this.props.location.state.startRow;
        let endRow = this.props.location.state.endRow;
        let startNumber = parseInt(this.props.location.state.startNumber);
        let endNumber = parseInt(this.props.location.state.endNumber);

        let rowStartNumber = startRow.charCodeAt(0);
        let rowEndNumber = endRow.charCodeAt(0);

        let racks = [];
        totalRacks = (rowEndNumber - rowStartNumber + 1) * (endNumber - startNumber + 1);

        for (let i = rowStartNumber; i <= rowEndNumber; i++) {
            let currLetter = String.fromCharCode(i);
            for (let j = parseInt(startNumber); j <= parseInt(endNumber); j++) {
                rackutils.getRackID(currLetter, j, result => {
                    if (result) {
                        racks.push(result);
                        if (racks.length === totalRacks) {
                            this.setState({
                                racks: racks
                            })
                        }
                    }
                })
            }
        }
    }

    getPNGFromChild = (imageData, position) => {
        console.log("callback from child!");
        console.log(imageData);
        images.set(position, imageData);
        if (images.size === totalRacks) {
            //sort
            const sortAlphaNum = (a, b) => a.toString().localeCompare(b, 'en', {numeric: true});
            let sortedMap = new Map([...images.entries()].sort(sortAlphaNum));
            sortedMap.forEach(function (data, position) {
                console.log(position + " boop ")
                //window.open(data)
                doc.addImage(data, "PNG", (0.2 * (count + 1) + 2.5 * count), 1.04, 2.5, 6.43);
                count++;
                if (count % 4 === 0) {
                    doc.addPage("letter", "landscape");
                    count = 0;
                }
            })
        }
    }

    render() {

        if (!this.state.racks.length) {
            return (
                <Grommet theme={theme}>
                    <Box fill background={"light-2"}>
                        <AppBar>
                            <HomeButton alignSelf='start' this={this}/>
                            <Heading alignSelf='center' level='4' margin={{
                                top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                            }}>Racks</Heading>
                            <UserMenu alignSelf='end' this={this}/>
                        </AppBar>
                        <Text>Please wait...</Text>
                    </Box>
                </Grommet>
            );
        }

        const items = [];
        this.state.racks.forEach(rackID => {
            console.log(rackID)
            items.push(<SingleRackElevation rackID={rackID} sendPNG={this.getPNGFromChild}/>);
            console.log(items);
        })

        return (
            <Grommet theme={theme}>
                <Box fill background={"light-2"}>
                    <AppBar>
                        <HomeButton alignSelf='start' this={this}/>
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }}>Racks</Heading>
                        <UserMenu alignSelf='end' this={this}/>
                    </AppBar>
                    <Grid columns={{
                        count: 4,
                        size: "auto"
                    }} gap="small" alignContent={"center"}>
                        {items}
                    </Grid>
                    <Button label={"PDF"} onClick={() => {

                        //doc.output('dataurlnewwindow');
                        window.open(URL.createObjectURL(doc.output("blob")))
                    }}/>
                </Box>
            </Grommet>
        )
    }
}

export default RackElevations