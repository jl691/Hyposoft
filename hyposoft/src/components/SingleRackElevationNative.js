import React from "react";
import {generateRackDiagram} from "../utils/rackutils";
import {Box, Grommet} from "grommet";
import * as firebaseutils from '../utils/firebaseutils';
// import html2canvas from 'html2canvas';

class SingleRackElevationNative extends React.Component {
    state = {
        letter: this.props.letter || null,
        number: this.props.number || null,
        rows: undefined
    }

    idToRowNum = {}

    getContrastYIQ(hexcolor) {
        //hexcolor = hexcolor.replace("#", "");
        let r = parseInt(hexcolor.substr(0, 2), 16);
        let g = parseInt(hexcolor.substr(2, 2), 16);
        let b = parseInt(hexcolor.substr(4, 2), 16);
        let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    componentDidMount() {
        if (!this.props.rackID)
            return
        generateRackDiagram(this.props.rackID, (letter, number, result) => {
            this.setState({
                letter: letter,
                number: number
            })
            if (letter) {

                let count = 0;
                if(this.props.sendPNG && !result.length){
                    // Empty rack
                    this.sendPNGToParent(letter, number);
                    return
                }

                let rows = [...Array(42).keys()].map(i => <tr><td class="reRackNumber">{42-i}</td><td></td><td class="reRackNumber">{42-i}</td></tr>)

                result.forEach(asset => {
                    this.idToRowNum[asset.id] = 42-asset.position
                    rows[42-parseInt(asset.position)] = <tr class="reClickableRow" onClick={() => window.location.href = "/assets/" + asset.id}><td class="reRackNumber">{asset.position}</td><td style={{backgroundColor: asset.color, color: this.getContrastYIQ(asset.color), fontSize: 12}}>{asset.model} {'\u00b7'} {asset.hostname}</td><td class="reRackNumber">{asset.position}</td></tr>

                    Array.from(Array(asset.height-1).keys()).forEach(i => {
                        rows[42-(parseInt(asset.position)+i+1)] = <tr class="reClickableRow"><td class="reRackNumber">{parseInt(asset.position)+i+1}</td><td style={{backgroundColor: asset.color}}></td><td class="reRackNumber">{parseInt(asset.position)+i+1}</td></tr>
                    })
                    count++;
                    if(count === result.length){
                        this.setState(oldState => ({...oldState, rows: rows}))
                        if (this.props.sendPNG)
                            this.sendPNGToParent(letter, number);
                    }

                    firebaseutils.db.collection('bladeInfo').where('chassisId','==',asset.id).get().then(qs => {
                        if (qs.size > 0) {
                            let rows = [...this.state.rows]
                            rows[this.idToRowNum[qs.docs[0].data().chassisId]] = <tr class="reClickableRow" onClick={() => window.location.href = "/assets/" + asset.id}><td class="reRackNumber">{asset.position}</td><td style={{backgroundColor: asset.color, color: this.getContrastYIQ(asset.color), fontSize: 12}}>{asset.model} {'\u00b7'} {asset.hostname} {'\u00b7 ' + qs.size + ' blades online'}</td><td class="reRackNumber">{asset.position}</td></tr>
                            this.setState(oldState => ({...oldState, rows: rows}))
                        }
                    })
                });
            } else {
                console.log("error");
            }
        })
    }

    sendPNGToParent(row, number) {
        //let png = canvas.toDataURL();
        // const table = document.getElementById(this.props.rackID+'RackElevationTable')
        // html2canvas(table)
        //   .then((canvas) => {
        //     const imgData = canvas.toDataURL('image/png');
        //     this.props.sendPNG(imgData, row+number);
        //   })
    }

    render() {
        return (
            <Grommet>
                <Box>
                    <table class={this.props.small ? 'rackElevationSmall' : 'rackElevation'} id={this.props.rackID+'RackElevationTable'}>
                        <tr><td class="reRackNumber"></td><td class="reHeader">{this.props.letter+this.props.number}</td><td class="reRackNumber"></td></tr>
                        {this.state.rows || [...Array(42).keys()].map(i => <tr><td class="reRackNumber">{42-i}</td><td></td><td class="reRackNumber">{42-i}</td></tr>)}
                        <tr><td class="reRackNumber"></td><td class="reHeader"></td><td class="reRackNumber"></td></tr>
                    </table>
                </Box>
            </Grommet>
        );
    }
}

export default SingleRackElevationNative
