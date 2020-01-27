import React from "react";
import theme from "../theme";
import { fabric } from "fabric";
import {Grommet} from "grommet";
import * as rackutils from "../utils/rackutils";

class RackDiagram extends React.Component {
    generateDiagrams() {
        const canvas = new fabric.StaticCanvas('canvas');
        let currX = 0;
        let currY = 0;
        let rowStartNumber = this.props.location.state.letterStart.charCodeAt(0);
        let rowEndNumber = this.props.location.state.letterEnd.charCodeAt(0);
        for(let i=rowStartNumber;i<=rowEndNumber;i++){
            let currLetter = String.fromCharCode(i);
            console.log("current letter is " + currLetter)
            console.log(this.props.location.state.numberStart);
            console.log(this.props.location.state.numberEnd)
            for(let j=parseInt(this.props.location.state.numberStart); j<=parseInt(this.props.location.state.numberEnd); j++){
                console.log("current number is " + j)
                rackutils.getRackID(currLetter, j, result => {
                    console.log(result)
                    if(result){
                        this.generateBorders(currX, currY, canvas);
                        this.generateRackFill(currX, currY, canvas, result);
                        if(currX === 2){
                            currX = 0;
                            currY++;
                        } else {
                            currX++;
                        }
                    }
                })
            }
        }
    }

    //  TODO: CITE https://stackoverflow.com/questions/11867545/change-text-color-based-on-brightness-of-the-covered-background-area
    getContrastYIQ(hexcolor){
        //hexcolor = hexcolor.replace("#", "");
        let r = parseInt(hexcolor.substr(0,2),16);
        let g = parseInt(hexcolor.substr(2,2),16);
        let b = parseInt(hexcolor.substr(4,2),16);
        let yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    generateRackFill(x, y, canvas, rackID){
        rackutils.generateRackDiagram(rackID, (letter, number, result) => {
            if(result) {
                let header = new fabric.Text(letter + number, {
                    fill: 'white',
                    fontFamily: 'Arial',
                    fontSize: 20,
                    top: (1113*y)+5,
                    left: 400*x
                });
                canvas.add(header);
                //header.centerH();
                result.forEach(instance => {
                    canvas.add(new fabric.Rect({
                        left: (400*x)+30,
                        top: (1113*y) + 10 + (20*(42-instance.position)),
                        fill: '#' + instance.color,
                        width: 290,
                        height: (20*instance.height),
                        stroke: 'black',
                        strokeWidth: 1
                    }));
                    canvas.add(new fabric.Text(instance.model, {
                        fill: this.getContrastYIQ(instance.color),
                        fontFamily: 'Arial',
                        fontSize: 15,
                        top: (1113*y) + 10 + (20*(42-instance.position)) + (20*(instance.height-1)),
                        left: (400*x) + 35
                    }));
                    canvas.add(new fabric.Text(instance.hostname, {
                        fill: this.getContrastYIQ(instance.color),
                        fontFamily: 'Arial',
                        fontSize: 15,
                        top: (1113*y) + 10 + (20*(42-instance.position)) + (20*(instance.height-1)),
                        left: (400*x) + 200
                    }));
                })
            } else {
                console.log("error");
            }
        })
    }

    generateBorders(x, y, canvas){
        // left banner
        const rect = new fabric.Rect({
            left: 400*x,
            top: 1113*y,
            fill: 'black',
            width: 30,
            height: 900
        });

        // right banner
        const rect2 = new fabric.Rect({
            left: (400*x)+320,
            top: 1113*y,
            fill: 'black',
            width: 30,
            height: 900
        });

        //top banner
        const rect3 = new fabric.Rect({
            left: 400*x,
            top: 1113*y,
            fill: 'black',
            width: 350,
            height: 30
        });

        //bottom banner
        const rect4 = new fabric.Rect({
            left: 400*x,
            top: (1113*y)+870,
            fill: 'black',
            width: 350,
            height: 30
        });

        canvas.add(rect, rect2, rect3, rect4);

        let count;
        for(count = 1; count < 43; count++){
            canvas.add(
                new fabric.Text((43-count).toString(), {
                    fill: 'white',
                    fontFamily: 'Arial',
                    fontSize: 15,
                    top: (1113*y) + 10 + (20*count),
                    left: (400*x) + 5
                }));
            canvas.add(
                new fabric.Text((43-count).toString(), {
                    fill: 'white',
                    fontFamily: 'Arial',
                    fontSize: 15,
                    top: (1113*y) + 10 + (20*count),
                    left: (400*x)+325
                }));
        }
    }

    componentDidMount() {
        /*const canvas = new fabric.StaticCanvas('canvas');
        //TODO: CHANGE AS PROP
        const rackID = "09ZXdZyFzu7TQY0GCGN3";

        // left banner
        const rect = new fabric.Rect({
            left: 0,
            top: 0,
            fill: 'black',
            width: 30,
            height: 1000
        });

        // right banner
        const rect2 = new fabric.Rect({
            left: 320,
            top: 0,
            fill: 'black',
            width: 30,
            height: 1000
        });

        //top banner
        const rect3 = new fabric.Rect({
            left: 0,
            top: 0,
            fill: 'black',
            width: 350,
            height: 30
        });

        //bottom banner
        const rect4 = new fabric.Rect({
            left: 0,
            top: 870,
            fill: 'black',
            width: 350,
            height: 30
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
                    left: 5
                }));
            canvas.add(
                new fabric.Text((43-count).toString(), {
                    fill: 'white',
                    fontFamily: 'Arial',
                    fontSize: 15,
                    top: 10 + (20*count),
                    left: 325
                }));
        }

        rackutils.generateRackDiagram(rackID, (letter, number, result) => {
            if(result) {
                let header = new fabric.Text(letter + number, {
                    fill: 'white',
                    fontFamily: 'Arial',
                    fontSize: 20,
                    top: 5
                });
                canvas.add(header);
                header.centerH();
                result.forEach(instance => {
                    canvas.add(new fabric.Rect({
                        left: 30,
                        top: 10 + (20*(42-instance.position)),
                        fill: '#' + instance.color,
                        width: 290,
                        height: (20*instance.height),
                        stroke: 'black',
                        strokeWidth: 1
                    }));
                    canvas.add(new fabric.Text(instance.model, {
                        fill: this.getContrastYIQ(instance.color),
                        fontFamily: 'Arial',
                        fontSize: 15,
                        top: 10 + (20*(42-instance.position)) + (20*(instance.height-1)),
                        left: 35
                    }));
                    canvas.add(new fabric.Text(instance.hostname, {
                        fill: this.getContrastYIQ(instance.color),
                        fontFamily: 'Arial',
                        fontSize: 15,
                        top: 10 + (20*(42-instance.position)) + (20*(instance.height-1)),
                        left: 200
                    }));
                })
            } else {
                console.log("error");
            }
        })*/
        console.log(this.props.location.state)
        this.generateDiagrams();
    }

    render() {
        return (
            <Grommet theme={theme}>
                <canvas id="canvas" width="1500" height="10000"></canvas>
            </Grommet>
        )
    }
}

export default RackDiagram