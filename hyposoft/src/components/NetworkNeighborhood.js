import React from "react";
import theme from "../theme";
import {Box, Grommet, Heading} from "grommet";
import cytoscape from "cytoscape";
import * as assetnetworkportutils from '../utils/assetnetworkportutils'
import * as decomutils from '../utils/decommissionutils'
import BackButton from "./BackButton";
import UserMenu from "./UserMenu";
import AppBar from "./AppBar";

class NetworkNeighborhood extends React.Component {

    componentDidMount() {
        console.log("here")
        decomutils.getAssetDetails(this.props.match.params.assetID, asset => {
            if (asset && asset.graph) {
                this.buildGraph(asset.graph,false)
                return
            }
            assetnetworkportutils.getNetworkPortConnections(this.props.match.params.assetID, result => {
                console.log(result)
                this.buildGraph(result,true)
            });
        })
    }

    buildGraph(result,deployed) {
      let data;
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
                          'label': 'data(display)',
                          "font-size": "8px",
                          "text-wrap": "wrap"
                      }
                  },
                  {
                      selector: '.second',
                      style: {
                          'background-color': '#395E66',
                          'label': 'data(display)',
                          "font-size": "8px",
                          "text-wrap": "wrap"
                      }
                  },
                  {
                      selector: '.third',
                      style: {
                          'background-color': '#B8C4BB',
                          'label': 'data(display)',
                          "font-size": "8px",
                          "text-wrap": "wrap"
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
          if (deployed) {
            cy.on('tap', 'node', function(){
                try { // your browser may block popups
                    window.open( "/assets/" + this.data('id') );
                } catch(e){ // fall back on url change
                    window.location.href = "/assets/" + this.data('id');
                }
            });
          }
      } else {
          document.getElementById("network").innerHTML = "No network connections."
      }
    }

    render() {
        let divStyle = {
            width: '100%',
            height: '94%',
            position: 'absolute',
            top: '6%',
            left: '0px'
        };

        return (
            <Grommet theme={theme}>
                <Box fill background='light-2'>
                    <AppBar>
                        <BackButton alignSelf='start' this={this} />
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }} >Network Neighborhood for {this.props.match.params.assetID}</Heading>
                        <UserMenu alignSelf='end' this={this} />
                    </AppBar>
                    <Box>
                        <div id="network" style={divStyle}></div>
                    </Box>
                </Box>
            </Grommet>
        )
    }
}

export default NetworkNeighborhood
