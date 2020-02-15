import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom'
import { DataTable, Button, Text, Box } from 'grommet'
import {  FormEdit, FormTrash, FormFolder } from "grommet-icons"
import * as assetutils from '../utils/assetutils'
import DetailedAssetScreen from '../screens/DetailedAssetScreen'

import * as userutils from "../utils/userutils";


export default class AssetTable extends Component {

    defaultAssets = [];
    startAfter = null;
    columns = [
        {
            property: 'assetID',
            header: <Text size='small'> Asset ID</Text>,
            primary: true,
            render: datum => <Text size='small'>
                {datum.asset_id}
            </Text>,

        },
        {
            property: 'model',
            header: <Text size='small'>Model</Text>,
           // align:"start",
            render: datum => <Text size='small'>{datum.model}</Text>,

        },
        {
            property: 'hostname',
            header: <Text size='small'>Hostname</Text>,
           // align:"start",
            render: datum => <Text size='small'>{datum.hostname}</Text>,
            //TODO: Take out primary here
            primary: true
        },
        {
            property: 'rack',
            header: <Text size='small'>Rack</Text>,
            //align:"end",
            render: datum => <Text size='small'>{datum.rack}</Text>,

        },
        {
            property: 'rackU',
            header: <Text size='small'>Rack U</Text>,
            render: datum => <Text size='small'>{datum.rackU}</Text>,

        },
        {
            property: 'owner',
            header: <Text size='small'> Owner</Text>,
            render: datum => <Text size='small'>{datum.owner}</Text>,

        },
        // {
        //     property: 'datacenterName',
        //     header: <Text size='small'> Datacenter Name</Text>,
        //     render: datum => <Text size='small'>
        //         {/* {datum.owner} */}
        //     </Text>,

        // },
        {
            property: 'datacenterAbbrev',
            header: <Text size='small'> Datacenter Abbrev.</Text>,
            render: datum => <Text size='small'>
                {/* {datum.owner} */}
            </Text>,

        },
        // {
        //     property: 'powerConnections',
        //     header: <Text size='small'> Power Connections</Text>,
        //     render: datum => <Text size='small'>
        //         {/* {datum.owner} */}
        //     </Text>,

        // },
    ];

    constructor(props) {
        super(props);
        this.state = {
            assets: [],
            initialLoaded: false,

        }

        this.handleFilter = this.handleFilter.bind(this);
        this.restoreDefault = this.restoreDefault.bind(this);
        this.handleRackRackUSort = this.handleRackRackUSort.bind(this);
    }

    componentDidMount() {
        assetutils.getAsset((newStartAfter, assetdb) => {
            if (!(newStartAfter === null) && !(assetdb === null)) {
                this.startAfter = newStartAfter;
                this.defaultAssets = assetdb;
                this.setState({ assets: assetdb, initialLoaded: true })
            }
        })
        this.adminButtons();       
    }



    adminButtons() {
        if (userutils.isLoggedInUserAdmin()) {
            this.columns.push({
                property: "delete",
                header: <Text size='small'>Delete</Text>,
                sortable: false,
                align: 'center',

                render: datum => (
                    <FormTrash
                        style={{cursor: 'pointer'}}
                        onClick={(e) => {
                            console.log(datum)
                            e.persist()
                            e.nativeEvent.stopImmediatePropagation()
                            e.stopPropagation()
                            this.props.deleteButtonCallbackFromParent(datum)
                        }} />
                )
            });
            this.columns.push({
                property: "update",
                header: <Text size='small'>Update</Text>,
                sortable: false,
                align: 'center',
                render: data => (
                    <FormEdit
                        style={{cursor: 'pointer'}}
                        onClick={(e) => {
                            e.persist()
                            e.nativeEvent.stopImmediatePropagation()
                            e.stopPropagation()
                            this.props.UpdateButtonCallbackFromParent(
                                data.asset_id,
                                data.model,
                                data.hostname,
                                data.rack,
                                data.rackU,
                                data.owner,
                                data.comment,
                                data.datacenter,
                            )
                            console.log(data)

                        }} />
                )
            })
        }
    }

    forceRefresh() {
        this.startAfter = null;
        this.setState({
            assets: [],
            initialLoaded: false
        });
        assetutils.getAsset((newStartAfter, assetdb) => {
            if (newStartAfter && assetdb) {
                this.startAfter = newStartAfter;
                this.setState({ assets: assetdb, initialLoaded: true })
            }
        })
    }

    restoreDefault() {
        this.setState({ assets: this.defaultAssets });
    }

    handleFilter(start, end) {
        console.log("triggered with " + start + " and " + end)
        let splitRackArrayStart = start.split(/(\d+)/);
        let rackRowStart = splitRackArrayStart[0];
        let rackNumStart = parseInt(splitRackArrayStart[1]);

        let splitRackArrayEnd = end.split(/(\d+)/);
        let rackRowEnd = splitRackArrayEnd[0];
        let rackNumEnd = parseInt(splitRackArrayEnd[1]);

        let newAssets = [];
        let splitRackArrayTemp, rackRowTemp, rackNumTemp;
        this.defaultAssets.forEach(asset => {
            splitRackArrayTemp = asset.rack.split(/(\d+)/);
            rackRowTemp = splitRackArrayTemp[0];
            rackNumTemp = parseInt(splitRackArrayTemp[1]);
            console.log("current asset: " + rackRowTemp.charCodeAt(0) + " " + rackNumTemp)
            console.log("rackRowTemp " + rackRowTemp + " rackNumTemp " + rackNumTemp)
            console.log("rackRowStart " + rackRowStart.charCodeAt(0) + " rackRowEnd " + rackRowEnd.charCodeAt(0) + " rackNumStart " + rackNumStart + " rackNumEnd " + rackNumEnd)
            /*if(rackRowTemp.charCodeAt(0) >= rackRowStart.charCodeAt(0) && rackRowTemp.charCodeAt(0) <= rackRowEnd.charCodeAt(0) && rackNumTemp >= rackNumStart && rackNumTemp <= rackNumEnd){
                console.log("found a match!")
                newInstances.push(asset);
            }*/
            if ((rackRowTemp === rackRowStart && rackNumTemp >= rackNumStart) || (rackRowTemp === rackRowEnd && rackNumTemp <= rackNumEnd) || (rackRowTemp.charCodeAt(0) > rackRowStart.charCodeAt(0) && rackRowTemp.charCodeAt(0) < rackRowEnd.charCodeAt(0))) {
                if (rackRowStart === rackRowEnd && rackRowEnd === rackRowTemp) {
                    if (rackNumTemp >= rackNumStart && rackNumTemp <= rackNumEnd) {
                        console.log("found a match!")
                        newAssets.push(asset);
                    }
                } else {
                    console.log("found a match!")
                    newAssets.push(asset);
                }
            }
        })

        this.setState({ assets: newAssets })
    }

    handleRackRackUSort(sortedAssets){
        this.setState({assets:sortedAssets})

    }


    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        if (!this.state.initialLoaded) {
            return (<Text>Please wait...</Text>);
        }


        return (

            // LIST OF INSTANCES ===============================================
            // <Box direction='row'
            //     justify='center'
            //     wrap={true}>
            //     <Box direction='row' justify='center'>
            //         <Box direction='row' justify='center'>
            //             <Box width='large' direction='column' align='stretch' justify='start'>
            //                 <Box style={{
            //                     borderRadius: 10,
            //                     borderColor: '#EDEDED'
            //                 }}
            //                     id='containerBox'
            //                     direction='row'
            //                     background='#FFFFFF'
            //                     margin={{ top: 'medium', bottom: 'medium' }}
            //                     flex={{
            //                         grow: 0,
            //                         shrink: 0
            //                     }}

            //                     pad='small' >
            //                     <Box margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column'
            //                         justify='start' alignSelf='stretch' flex >
            //                         <Box align="center" >
                                        <DataTable
                                            step={5}
                                            onMore={() => {
                                                if (this.startAfter && !this.props.searchResults) {
                                                    assetutils.getAssetAt(this.startAfter, (newStartAfter, newAssets) => {
                                                        this.startAfter = newStartAfter
                                                        this.setState({ assets: this.state.assets.concat(newAssets) })
                                                    });
                                                }
                                            }}
                                            
                                            columns={this.columns}
                                            size="large"
                                            //pad={{ horizontal: "medium", vertical: "xsmall" }}
                                           
                                            onClickRow={({datum}) => {
                                                this.props.parent.props.history.push('/assets/'+datum.asset_id)
                                            }}

                                            data={this.props.searchResults||this.state.assets}
                                            sortable
                                         

                                        />
            //                         </Box>
            //                     </Box>
            //                 </Box>
            //             </Box>
            //         </Box>
            //     </Box>
            // </Box>




        );

    }
}
