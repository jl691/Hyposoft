import React from "react";
import {fabric} from "fabric";
import {generateRackDiagram} from "../utils/rackutils";
import {Box, Grommet} from "grommet";
import * as jsPDF from 'jspdf'

class SingleRackElevation extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            letter: "",
            number: ""
        };
    }

    getContrastYIQ(hexcolor) {
        //hexcolor = hexcolor.replace("#", "");
        let r = parseInt(hexcolor.substr(0, 2), 16);
        let g = parseInt(hexcolor.substr(2, 2), 16);
        let b = parseInt(hexcolor.substr(4, 2), 16);
        let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    componentDidMount() {
        let canvas = new fabric.Canvas(this.props.rackID);
        this.drawDiagram(this.props.rackID, canvas);
        //this.sendPNGToParent(canvas, this.state.letter, this.state.number);
    }

    canvasToPNG(canvas){
        //return canvas.toDataURL();
        return "";
    }

    cloneCanvas(oldCanvas) {

        //create a new canvas
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;

        //apply the old canvas to the new one
        context.drawImage(oldCanvas, 0, 0);

        //return the new canvas
        return newCanvas;
    }

    sendPNGToParent(image, row, number) {
        //let png = canvas.toDataURL();

        this.props.sendPNG(image, row+number);
    }

    canvasToPDF(){
        let doc = new jsPDF({
            format: 'letter',
            orientation: 'landscape',
            unit: 'in'
        });
        doc.addImage(this.canvasToPNG(), "PNG", 0.2, 1.04, 2.5, 6.43);
        doc.addImage(this.canvasToPNG(), "PNG", 2.9, 1.04, 2.5, 6.43);
        doc.addImage(this.canvasToPNG(), "PNG", 5.6, 1.04, 2.5, 6.43);
        doc.addImage(this.canvasToPNG(), "PNG", 8.3, 1.04, 2.5, 6.43);
        doc.output('dataurlnewwindow');

        //doc.save('a4.pdf')
    }

    drawDiagram(rackID, canvas) {
        console.log("Drawdiagram being called for " + rackID)

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

        let count;
        for(count = 1; count < 43; count++){
            canvas.add(
                new fabric.Text((43-count).toString(), {
                    fill: 'white',
                    fontFamily: 'Arial',
                    fontSize: 15,
                    top: 10 + (20*count),
                    left: 5,
                    selectable: false
                }));
            canvas.add(
                new fabric.Text((43-count).toString(), {
                    fill: 'white',
                    fontFamily: 'Arial',
                    fontSize: 15,
                    top: 10 + (20*count),
                    left: 325,
                    selectable: false
                }));
        }
        console.log("generating for rackid of " + rackID)

        generateRackDiagram(rackID, (letter, number, result) => {
            console.log("the result is ", result)
            console.log("letter and number are " + letter + number)
            this.setState({
                letter: letter,
                number: number
            })
            if (letter) {
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
                let count = 0;
                if(this.props.sendPNG && !result.length){
                    console.log("sending for empty rack")
                    this.sendPNGToParent(canvas.toDataURL(), letter, number);
                    canvas.renderAll();
                    console.log("callbackkk")
                }
                console.log("mde it here")
                result.forEach(asset => {
                    console.log(asset.color)
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

                    count++;
                    if(this.props.sendPNG && count === result.length){
                        console.log("sending a rack with instance to parent " + count)
                        //let png = canvas.toDataURL();
                        this.sendPNGToParent(canvas.toDataURL(), letter, number);
                        canvas.renderAll();
                        //this.sendPNGToParent(canvas.toDataURL(), letter, number);
                    }
                });
            } else {
                console.log("error");
            }
        })
    }

    render() {
        return (
            <Grommet>
                <Box>
                    <canvas id={this.props.rackID} width="350" height="900"></canvas>
                </Box>
 {/*               <Box>
                    <Button label={"PNG"} onClick={() => {
                        window.open(this.canvasToPNG());
                    }}/>
                    <Button label={"PDF"} onClick={() => { this.canvasToPDF();
                    }}/>
                </Box>*/}
            </Grommet>
        );
    }
}

export default SingleRackElevation