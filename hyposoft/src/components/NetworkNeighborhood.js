import React from "react";
import theme from "../theme";
import {Box, Grommet, Text} from "grommet";
import cytoscape from "cytoscape";
import * as assetnetworkportutils from '../utils/assetnetworkportutils'

class NetworkNeighborhood extends React.Component {

    componentDidMount() {
        let data;
        assetnetworkportutils.getNetworkPortConnections("149821", result => {
            if(result){
                console.log(result);
                data = result;
                let cy = cytoscape({
                    container: document.getElementById("network"),
                    elements: data,

                    style: [ // the stylesheet for the graph
                        {
                            selector: '.origin',
                            style: {
                                'background-color': '#4BBD51',
                                'label': 'data(id)',
                                "font-size": "8px"
                            }
                        },
                        {
                            selector: '.second',
                            style: {
                                'background-color': '#395E66',
                                'label': 'data(id)',
                                "font-size": "8px"
                            }
                        },
                        {
                            selector: '.third',
                            style: {
                                'background-color': '#B8C4BB',
                                'label': 'data(id)',
                                "font-size": "8px"
                            }
                        },
                        {
                            selector: 'edge',
                            style: {
                                'width': 3,
                                'line-color': '#ccc',
                                'target-arrow-color': '#ccc',
                                'target-arrow-shape': 'triangle'
                            }
                        }
                    ],

                    layout: {
                        name: 'concentric',
                        concentric: function( node ){
                            console.log(node.data().level)
                            return (3-node.data().level);
                        },
                        fit: true,
                        minNodeSpacing: 30
                    }
                });
                cy.on('tap', 'node', function(){
                    try { // your browser may block popups
                        window.open( "/assets/" + this.data('assetID') );
                    } catch(e){ // fall back on url change
                        window.location.href = "/assets/" + this.data('assetID');
                    }
                });
            }
        });
    }

    render() {
        let divStyle = {
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: '0px',
            left: '0px'
        };

        return (
            <Grommet theme={theme}>
                <div id="network" style={divStyle}></div>
            </Grommet>
        )
    }
}

export default NetworkNeighborhood