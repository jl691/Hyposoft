import React from "react";
import theme from "../theme";
import {Box, Grommet, Text} from "grommet";
import cytoscape from "cytoscape";

class NetworkNeighborhood extends React.Component {

    componentDidMount() {
        let cy = cytoscape({
            container: document.getElementById("network"),
            elements: [ // list of graph elements to start with
                {
                    data: { id: 'rtp-dfm-sv1' }
                },
                {
                    data: { id: 'rtp-dfm-sw1' }
                },
                {
                    data: { id: 'rtp-dfm-sw2' }
                },
                {
                    data: { id: 'rtp-dfm-m1' }
                },
                {
                    data: { id: 'rtp-dfm-m2' }
                },
                {
                    data: { id: 'rtp-dfm-sv2' }
                },
                {
                    data: { id: 'rtp-dfm-sv3' }
                },
                {
                    data: { id: 'rtp-dfm-sv4' }
                },
                {
                    data: { id: 'rtp-dfm-sv5' }
                },
                {
                    data: { id: 'rtp-dfm-sv6' }
                },
                {
                    data: { id: 'rtp-dfm-sv7' }
                },
                {
                    data: { source: 'rtp-dfm-sv1', target: 'rtp-dfm-sw1' }
                },
                {
                    data: { source: 'rtp-dfm-sv1', target: 'rtp-dfm-sw2' }
                },
                {
                    data: { source: 'rtp-dfm-sw1', target: 'rtp-dfm-sw2' }
                },
                {
                    data: { source: 'rtp-dfm-sw1', target: 'rtp-dfm-m1' }
                },
                {
                    data: { source: 'rtp-dfm-sw1', target: 'rtp-dfm-m2' }
                },
                {
                    data: { source: 'rtp-dfm-sw1', target: 'rtp-dfm-sv2' }
                },
                {
                    data: { source: 'rtp-dfm-sw1', target: 'rtp-dfm-sv3' }
                },
                {
                    data: { source: 'rtp-dfm-sw1', target: 'rtp-dfm-sv4' }
                },
                {
                    data: { source: 'rtp-dfm-sw1', target: 'rtp-dfm-sv5' }
                },
                {
                    data: { source: 'rtp-dfm-sw1', target: 'rtp-dfm-sv6' }
                },
                {
                    data: { source: 'rtp-dfm-sw1', target: 'rtp-dfm-sv7' }
                },
                {
                    data: { source: 'rtp-dfm-sw2', target: 'rtp-dfm-sv2' }
                },
                {
                    data: { source: 'rtp-dfm-sw2', target: 'rtp-dfm-sv3' }
                },
                {
                    data: { source: 'rtp-dfm-sw2', target: 'rtp-dfm-sv4' }
                },
                {
                    data: { source: 'rtp-dfm-sw2', target: 'rtp-dfm-sv5' }
                },
                {
                    data: { source: 'rtp-dfm-sw2', target: 'rtp-dfm-sv6' }
                },
                {
                    data: { source: 'rtp-dfm-sw2', target: 'rtp-dfm-sv7' }
                },
            ],

            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'label': 'data(id)'
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
                name: 'circle'
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