import React from "react";
import {fabric} from "fabric";
import {generateRackDiagram} from "../utils/rackutils";
import {Box, Grommet} from "grommet";

class BladeChassisView extends React.Component {
    width = 620
    height = 275
    banner = 30
    bladeWidth = 40
    numSlots = 14
    fontSize = 15
    grey = '#D3D3D3'
    highlight = '#CCFF00'

    constructor(props) {
        super(props);
    }

    getContrastYIQ(hexcolor) {
        let r = parseInt(hexcolor.substr(0, 2), 16);
        let g = parseInt(hexcolor.substr(2, 2), 16);
        let b = parseInt(hexcolor.substr(4, 2), 16);
        let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    componentDidMount() {
        let canvas = new fabric.Canvas(this.props.chassisId);
        this.drawDiagram(this.props.chassisId, canvas);
    }

    drawDiagram(chassisId, canvas) {
        console.log("Drawdiagram being called for " + chassisId)

        // left banner
        let rect = new fabric.Rect({
            left: 0,
            top: 0,
            fill: 'black',
            width: this.banner,
            height: this.height,
            selectable: false
        });

        // right banner
        let rect2 = new fabric.Rect({
            left: this.width-this.banner,
            top: 0,
            fill: 'black',
            width: this.banner,
            height: this.height,
            selectable: false
        });

        //top banner
        let rect3 = new fabric.Rect({
            left: 0,
            top: 0,
            fill: 'black',
            width: this.width,
            height: this.banner,
            selectable: false
        });

        //bottom banner
        let rect4 = new fabric.Rect({
            left: 0,
            top: this.height-this.banner,
            fill: 'black',
            width: this.width,
            height: this.banner,
            selectable: false
        });

        canvas.add(rect, rect2, rect3, rect4);

        if (!this.props.notClickable) {
          rect.on("mousedown", function (options) {
              window.location.href = "/assets/" + chassisId;
          })

          rect2.on("mousedown", function (options) {
              window.location.href = "/assets/" + chassisId;
          })

          rect3.on("mousedown", function (options) {
              window.location.href = "/assets/" + chassisId;
          })

          rect4.on("mousedown", function (options) {
              window.location.href = "/assets/" + chassisId;
          })
        }

        let header = new fabric.Text(this.props.chassisHostname, {
            fill: 'white',
            fontFamily: 'Arial',
            fontSize: 20,
            top: 5,
            selectable: false
        })
        header.set({
            left: (this.width - Math.round(header.getScaledWidth())) / 2
        })
        canvas.add(header)
        if (!this.props.notClickable) {
          header.on("mousedown", function (options) {
              window.location.href = "/assets/" + chassisId;
          })
        }

        for(var count = 1; count < this.numSlots+1; count++){
            // add side numbers
            let number = new fabric.Text(count.toString(), {
                fill: 'white',
                fontFamily: 'Arial',
                fontSize: this.fontSize,
                top: this.height-this.banner+5,
                selectable: false
            })
            number.set({
                left: (this.bladeWidth*count-(this.bladeWidth-this.banner))
                       +((this.bladeWidth - Math.round(number.getScaledWidth())) / 2)
            })
            canvas.add(number);
            if (!this.props.notClickable) {
              number.on("mousedown", function (options) {
                  window.location.href = "/assets/" + chassisId;
              })
            }
        }
        console.log("generating for chassisId of " + chassisId)

        console.log("mde it here")
        this.props.chassisSlots.forEach(asset => {
            let assetBox
                = new fabric.Rect({
                top: this.banner,
                left: this.banner + this.bladeWidth*(asset.slot-1),
                fill: asset.slot == this.props.slot ? this.highlight : this.grey,
                height: this.height-(2*this.banner),
                width: this.bladeWidth,
                stroke: 'black',
                strokeWidth: 1,
                selectable: false
            });
            canvas.add(assetBox);

            // let assetText = new fabric.Text(asset.model.substr(0, 20), {
            //     fill: this.getContrastYIQ(this.grey),
            //     fontFamily: 'Arial',
            //     fontSize: this.fontSize,
            //     top: 30 + (20 * (this.numSlots - asset.position)),
            //     left: 35,
            //     selectable: false
            // });
            //
            // let assetHostname = new fabric.Text(asset.hostname.substr(0, 15), {
            //     fill: this.getContrastYIQ(this.grey),
            //     fontFamily: 'Arial',
            //     fontSize: this.fontSize,
            //     top: 30 + (20 * (this.numSlots - asset.position)),
            //     left: 200,
            //     selectable: false
            // });

            // canvas.add(assetBox, assetText, assetHostname);
            // canvas.add(assetBox);
            if (!this.props.notClickable) {
              assetBox.on("mousedown", function (options) {
                  window.location.href = "/assets/" + asset.id;
              })
            }
        });
    }

    render() {
        return (
            <Grommet>
                <Box>
                    <canvas id={this.props.chassisId} width={this.width.toString()} height={this.height.toString()}></canvas>
                </Box>
            </Grommet>
        );
    }
}

export default BladeChassisView
