import React from "react";
import {fabric} from "fabric";
import {generateRackDiagram} from "../utils/rackutils";

class SingleRackElevation extends React.Component {

    getContrastYIQ(hexcolor) {
        //hexcolor = hexcolor.replace("#", "");
        let r = parseInt(hexcolor.substr(0, 2), 16);
        let g = parseInt(hexcolor.substr(2, 2), 16);
        let b = parseInt(hexcolor.substr(4, 2), 16);
        let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    componentDidMount() {
        this.drawDiagram(this.props.rackID);
    }

    drawDiagram(rackID) {
        const canvas = new fabric.Canvas(this.props.rackID);

        // left banner
        let rect = new fabric.Rect({
            left: 0,
            top: 0,
            fill: 'black',
            width: 30,
            height: 900,
            selectable: false
        });

        // right banner
        let rect2 = new fabric.Rect({
            left: 320,
            top: 0,
            fill: 'black',
            width: 30,
            height: 900,
            selectable: false
        });

        //top banner
        let rect3 = new fabric.Rect({
            left: 0,
            top: 0,
            fill: 'black',
            width: 350,
            height: 30,
            selectable: false
        });

        //bottom banner
        let rect4 = new fabric.Rect({
            left: 0,
            top: 870,
            fill: 'black',
            width: 350,
            height: 30,
            selectable: false
        });

        canvas.add(rect, rect2, rect3, rect4);

        generateRackDiagram(rackID, (letter, number, result) => {
            if (result) {
                let header = new fabric.Text(letter + number, {
                    fill: 'white',
                    fontFamily: 'Arial',
                    fontSize: 20,
                    top: 5,
                    selectable: false
                    //left: 400*x + (350-Math.round(header.getScaledWidth()))/2
                });
                header.set({
                    left: (350 - Math.round(header.getScaledWidth())) / 2
                });
                canvas.add(header);
                console.log("added the header")
                //header.centerH();
                result.forEach(asset => {
                    let assetBox
                        = new fabric.Rect({
                        left: 30,
                        top: 50 + (20 * (42 - asset.position)) - (20 * asset.height),
                        fill: asset.color,
                        width: 290,
                        height: (20 * asset.height),
                        stroke: 'black',
                        strokeWidth: 1,
                        selectable: false
                    });

                    let assetText = new fabric.Text(asset.model.substr(0, 20), {
                        fill: this.getContrastYIQ(asset.color),
                        fontFamily: 'Arial',
                        fontSize: 15,
                        top: 30 + (20 * (42 - asset.position)),
                        left: 35,
                        selectable: false
                    });

                    let assetHostname = new fabric.Text(asset.hostname.substr(0, 15), {
                        fill: this.getContrastYIQ(asset.color),
                        fontFamily: 'Arial',
                        fontSize: 15,
                        top: 30 + (20 * (42 - asset.position)),
                        left: 200,
                        selectable: false
                    });

                    canvas.add(assetBox, assetText, assetHostname);

                    assetBox.on("mousedown", function (options) {
                        window.location.href = "/assets/" + asset.id;
                    })
                })
            } else {
                console.log("error");
            }
        })
    }

    render() {
        return (
            <canvas id={this.props.rackID} width="350" height="900"></canvas>
        );
    }
}

export default SingleRackElevation