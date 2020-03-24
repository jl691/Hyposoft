import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'
import {DataTable, Text, Box, Menu} from 'grommet'
import {Checkbox, CheckboxSelected, FormEdit, FormTrash, FormClose, Power, Clear, PowerCycle, FormUp, FormDown} from "grommet-icons"
import * as assetutils from '../utils/assetutils'
import * as assetmacutils from '../utils/assetmacutils'
import * as powerutils from '../utils/powerutils'
import * as userutils from "../utils/userutils";
import * as assetnetworkportutils from '../utils/assetnetworkportutils'

export default class AssetTable extends Component {

    colors={};
    defaultAssets = [];
    startAfter = null;
    selectAll = false;
    previousAssets = [];
    totalWasAdded = false;
    totalAssetIDs = null;

    state = {
        assets: [],
        initialLoaded: false,
        sortField: "",
        sortAscending: "",
        selectedAssets: []
    }

    constructor(props) {
        super(props);

        this.handleFilter = this.handleFilter.bind(this);
        this.restoreDefault = this.restoreDefault.bind(this);
        this.handleRackRackUSort = this.handleRackRackUSort.bind(this);
    }

    setSort(field) {
        let newSort;
        if (this.state.sortField && this.state.sortField === field) {
            //reverse direction
            this.setState({
                sortAscending: !this.state.sortAscending
            });
            newSort = !this.state.sortAscending;
        } else {
            //start with ascending
            this.setState({
                sortField: field,
                sortAscending: true
            });
            newSort = true;
        }

        this.startAfter = null;
        this.setState({
            assets: [],
            initialLoaded: false
        });
        assetutils.getAsset((newStartAfter, assetdb, empty) => {
            if(empty){
                this.setState({
                    initialLoaded: true
                })
            } else if (newStartAfter && assetdb) {
                console.log("new sorted ", assetdb)
                this.startAfter = newStartAfter;
                this.setState({assets: assetdb, initialLoaded: true})
            }
        }, field, newSort, this.state.selectedAssets)
    }

    componentDidMount() {
        assetutils.getAsset((newStartAfter, assetdb, empty) => {
            if ((!(newStartAfter === null) && !(assetdb === null)) || empty) {
                console.log(assetdb)
                this.startAfter = newStartAfter;
                this.defaultAssets = assetdb;
                this.setState({assets: assetdb, initialLoaded: true})
            }
        })
    }

    getAdminColumns() {
        if (userutils.isLoggedInUserAdmin()) {
            return [
            {
                property: "update",
                header: <Text size='small'>Update</Text>,
                sortable: false,
                align: 'center',
                render: data => (
                    <FormEdit
                        style={{cursor: 'pointer', backgroundColor: this.colors[data.asset_id+'_edit_color']}}
                        onClick={(e) => {
                            console.log(data.macAddresses);
                            console.log(assetmacutils.unfixMacAddressesForMACForm(data.macAddresses));
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
                                assetmacutils.unfixMacAddressesForMACForm(data.macAddresses),
                                assetnetworkportutils.networkConnectionsToArray( data.networkConnections),
                                data.powerConnections
                            )
                            console.log("Getting data from AssetTable: " +data.powerConnections)

                        }} onMouseOver={e => this.colors[data.asset_id+'_edit_color']='#dddddd'}
                        onMouseLeave={e => this.colors[data.asset_id+'_edit_color']=''}/>
                )
            },
            {
                property: "delete",
                header: <Text size='small'>Delete</Text>,
                sortable: false,
                align: 'center',

                render: datum => (
                    <FormTrash
                        style={{cursor: 'pointer', backgroundColor: this.colors[datum.asset_id+'_delete_color']}}
                        onClick={(e) => {
                            console.log(datum)
                            e.persist()
                            e.nativeEvent.stopImmediatePropagation()
                            e.stopPropagation()
                            this.props.deleteButtonCallbackFromParent(datum)
                        }} onMouseOver={e => this.colors[datum.asset_id+'_delete_color']='#dddddd'}
                        onMouseLeave={e => this.colors[datum.asset_id+'_delete_color']=''}/>
                )
            },
            {
                property: "decommission",
                header: <Text size='small'>Decommission</Text>,
                sortable: false,
                align: 'center',

                render: datum => (
                    <FormClose
                        style={{cursor: 'pointer', backgroundColor: this.colors[datum.asset_id+'_decommission_color']}}
                        onClick={(e) => {
                            e.persist()
                            e.nativeEvent.stopImmediatePropagation()
                            e.stopPropagation()
                            this.props.decommissionButtonCallbackFromParent(datum)
                        }} onMouseOver={e => this.colors[datum.asset_id+'_decommission_color']='#dddddd'}
                        onMouseLeave={e => this.colors[datum.asset_id+'_decommission_color']=''}/>
                )
            }]
        }
    }

    forceRefresh() {
        this.startAfter = null;
        this.setState({
            assets: [],
            initialLoaded: false
        });
        assetutils.getAsset((newStartAfter, assetdb, empty) => {
            if ((newStartAfter && assetdb) || empty) {
                this.startAfter = newStartAfter;
                this.setState({assets: assetdb, initialLoaded: true})
            }
        }, null, null, this.state.selectedAssets)
    }

    restoreDefault() {
        for(var index = 0; index < this.defaultAssets.length; index++) {
            this.defaultAssets[index].checked = this.state.selectedAssets.includes(this.defaultAssets[index].asset_id)
        }
        this.setState({assets: this.defaultAssets});
    }

    handleFilter(start, end, datacenter) {
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
            // add line to update selected status
            asset.checked = this.state.selectedAssets.includes(asset.asset_id)
            /*if(rackRowTemp.charCodeAt(0) >= rackRowStart.charCodeAt(0) && rackRowTemp.charCodeAt(0) <= rackRowEnd.charCodeAt(0) && rackNumTemp >= rackNumStart && rackNumTemp <= rackNumEnd){
                console.log("found a match!")
                newInstances.push(asset);
            }*/
            if (datacenter === "All datacenters" || asset.datacenter === datacenter) {
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
            }
        })
        // this is already grabbing all the possible assets so select all should reflect that
        this.totalWasAdded = true
        var newAssetsIds = []
        for(var index = 0; index < newAssets.length; index++) {
            newAssetsIds.push(newAssets[index].asset_id)
        }
        this.totalAssetIDs = newAssetsIds
        this.setState({assets: newAssets})
    }

    handleRackRackUSort(sortedAssets) {
        // this is already grabbing all the possible assets so select all should reflect that
        this.totalWasAdded = true
        var sortedAssetsIds = []
        for(var index = 0; index < sortedAssets.length; index++) {
            sortedAssetsIds.push(sortedAssets[index].asset_id)
        }
        this.totalAssetIDs = sortedAssetsIds
        this.setState({assets: sortedAssets})
    }

    handleSelect(datum) {
      if (datum.checked) {
        return (<CheckboxSelected
            style={{cursor: 'pointer', backgroundColor: this.colors[datum.asset_id+'_check_color']}}
            onClick={(e) => {
                e.persist()
                e.nativeEvent.stopImmediatePropagation()
                e.stopPropagation()
                datum.checked = false

                const ind = this.state.selectedAssets.indexOf(datum.asset_id)
                if (ind !== -1) {
                  this.setState({selectedAssets: this.state.selectedAssets.slice(0,ind).concat(this.state.selectedAssets.slice(ind+1,this.state.selectedAssets.length))})
                } else {
                  this.setState({selectedAssets: this.state.selectedAssets})
                }
            }}/>)
    } else {
      return (<Checkbox
          style={{cursor: 'pointer', backgroundColor: this.colors[datum.asset_id+'_check_color']}}
          onClick={(e) => {
              e.persist()
              e.nativeEvent.stopImmediatePropagation()
              e.stopPropagation()
              datum.checked = true

              const ind = this.state.selectedAssets.indexOf(datum.asset_id)
              if (ind === -1) {
                this.setState({selectedAssets: this.state.selectedAssets.concat(datum.asset_id)})
              } else {
                this.setState({selectedAssets: this.state.selectedAssets})
              }
          }}/>)
      }
    }

    updateSelectAll() {
        let assets = this.props.searchResults || this.state.assets
        var selectAll = true
        for(var index = 0; index < assets.length; index++) {
            if (!assets[index].checked) {
                selectAll = false
                break
            }
        }
        // do not put this inside a set state!!!!
        this.selectAll = selectAll
        return selectAll
    }

    handleSelectAllOrNone(all = null) {
      let assets = this.props.searchResults || this.state.assets
      var updatedSelectedAssets = this.state.selectedAssets
      if (all || (all === null && !this.selectAll)) {
        for(var index = 0; index < assets.length; index++) {
            if (!updatedSelectedAssets.includes(assets[index].asset_id)) {
                updatedSelectedAssets = updatedSelectedAssets.concat(assets[index].asset_id)
            }
            assets[index].checked = true
        }
      } else {
        for(var index = 0; index < assets.length; index++) {
            const ind = updatedSelectedAssets.indexOf(assets[index].asset_id)
            if (updatedSelectedAssets.includes(assets[index].asset_id) && ind !== -1) {
               updatedSelectedAssets = updatedSelectedAssets.slice(0,ind).concat(updatedSelectedAssets.slice(ind+1,updatedSelectedAssets.length))
            }
            assets[index].checked = false
        }
      }
      this.selectAll = all !== null ? all : !this.selectAll
      this.setState({selectedAssets: updatedSelectedAssets})
    }

    updateCurrentAssetsBasedOffSelected(selected){
      var assets = []
      assets = assets.concat(this.props.searchResults || this.state.assets)
      for(var index = 0; index < assets.length; index++) {
          assets[index].checked = selected.includes(assets[index].asset_id)
      }
      return assets
    }

    selectAllHyperlink() {
      assetutils.getAllAssetIDs(result => {
        this.totalAssetIDs = result
        // need to re-render
        this.setState(oldState => ({...oldState}))
      }, this.state.sortField ? this.state.sortField : null, this.state.sortField ? this.state.sortAscending : null)
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/'/>
        }

        if (!this.state.initialLoaded ) {
            return (<Box align="center"><Text>Please wait...</Text></Box>);
        }

        if (JSON.stringify(this.props.searchResults || this.state.assets)!==JSON.stringify(this.previousAssets)) {
            this.previousAssets = this.props.searchResults || this.state.assets
            if (this.totalAssetIDs && this.previousAssets.length !== this.totalAssetIDs.length) {
              this.totalWasAdded = false
              this.totalAssetIDs = null
            }
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
            <Box align="center">
            {(this.updateSelectAll()
              ? (this.totalAssetIDs === null
                ? <Box>{this.selectAllHyperlink()}</Box>
                : (!this.totalWasAdded && (this.props.searchResults || this.state.assets).length !== this.totalAssetIDs.length
                  ?  <Box direction='row' justify='center'>
                       <Text size='small' textAlign='center'>All {(this.props.searchResults || this.state.assets).length} assets on this page are selected.</Text>
                       <Text size='small' textAlign='center' color='#0000EE' onClick={() => {
                         var newSelections = []
                         this.totalAssetIDs.forEach(assetId => {
                           if (!this.state.selectedAssets.includes(assetId)) {
                               newSelections.push(assetId)
                           }
                         })
                         this.totalWasAdded = true
                         this.setState({selectedAssets: this.state.selectedAssets.concat(newSelections)})
                       }} style={{cursor: "pointer"}}>
                       {'\u00a0' /*non-breaking space*/}Select All {this.totalAssetIDs.length} assets.</Text>
                     </Box>
                  :  <Box direction='row' justify='center'>
                      <Text size='small' textAlign='center'>All {this.totalAssetIDs.length} assets are selected.</Text>
                      <Text size='small' textAlign='center' color='#0000EE' onClick={() => {
                        var selections = this.state.selectedAssets
                        this.totalAssetIDs.forEach(assetId => {
                          const ind = selections.indexOf(assetId)
                          if (selections.includes(assetId) && ind !== -1) {
                              selections = selections.slice(0,ind).concat(selections.slice(ind+1,selections.length))
                          }
                        })
                        this.totalWasAdded = false
                        if (this.props.searchResults) {
                          var newResults = this.updateCurrentAssetsBasedOffSelected(selections)
                          // hacky way of being able to write to props
                          this.props.searchResults.length = 0
                          newResults.forEach(result => {
                            this.props.searchResults.push(result)
                          })
                          this.setState({selectedAssets: selections})
                        } else {
                          this.setState({assets: this.updateCurrentAssetsBasedOffSelected(selections), selectedAssets: selections})
                        }
                      }} style={{cursor: "pointer"}}>
                      {'\u00a0' /*non-breaking space*/}Clear selection.</Text>
                    </Box>))
               : <Box></Box>)}
            <DataTable
                step={25}
                onMore={() => {
                    if (this.startAfter && !this.props.searchResults && this.state.initialLoaded) {
                        if (this.state.sortField) {
                            assetutils.getAssetAt(this.startAfter, (newStartAfter, newAssets) => {
                                this.startAfter = newStartAfter
                                // this is a temporary solution to selectAll with onMore
                                // could differ if get rid of limit(25) in newAssets
                                var newSelections = []
                                newAssets.forEach(asset => {
                                  if (asset.checked && !this.state.selectedAssets.includes(asset.asset_id)) {
                                      newSelections.push(asset.asset_id)
                                  }
                                })
                                this.setState({assets: this.state.assets.concat(newAssets),selectedAssets: this.state.selectedAssets.concat(newSelections)})
                            }, this.state.sortField, this.state.sortAscending, this.state.selectedAssets, this.selectAll);
                        } else {
                            assetutils.getAssetAt(this.startAfter, (newStartAfter, newAssets) => {
                                this.startAfter = newStartAfter
                                // this is a temporary solution to selectAll with onMore
                                // could differ if get rid of limit(25) in newAssets
                                var newSelections = []
                                newAssets.forEach(asset => {
                                  if (asset.checked && !this.state.selectedAssets.includes(asset.asset_id)) {
                                      newSelections.push(asset.asset_id)
                                  }
                                })
                                this.setState({assets: this.state.assets.concat(newAssets),selectedAssets: this.state.selectedAssets.concat(newSelections)})
                            }, null, null, this.state.selectedAssets, this.selectAll);
                        }
                    }
                }}

                columns={[
                    {
                        property: 'checked',
                        // todo somehow change size to small
                        header: <Text size='small' style={{cursor: "pointer"}}>
                        {(this.updateSelectAll()
                          ? <CheckboxSelected onClick={() => {this.handleSelectAllOrNone()}}/>
                          : <Checkbox onClick={() => {this.handleSelectAllOrNone()}}/>
                        )}{(<Menu icon={<FormDown/>}
                            items={[
                                  {label: 'All', onClick: () => this.handleSelectAllOrNone(true)},
                                  {label: 'None', onClick: () => this.handleSelectAllOrNone(false)}
                                  ]}/>
                          )}</Text>,
                        render: datum => this.handleSelect(datum),
                        sortable: false
                    },
                    {
                        property: 'assetID',
                        header: <Text size='small' onClick={() => {
                            this.setSort("assetId")
                        }} style={{cursor: "pointer"}}>Asset ID  {this.state.sortField === 'assetId' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                        primary: true,
                        render: datum => <Text size='small'>
                            {datum.asset_id}
                        </Text>

                    },
                    {
                        property: 'model',
                        header: <Text size='small' onClick={() => {
                            this.setSort("model")
                        }} style={{cursor: "pointer"}}>Model   {this.state.sortField === 'model' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                        // align:"start",
                        render: datum => <Text size='small'>{datum.model}</Text>,

                    },
                    {
                        property: 'hostname',
                        header: <Text size='small' onClick={() => {
                            this.setSort("hostname")
                        }} style={{cursor: "pointer"}}>Hostname  {this.state.sortField === 'hostname' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                        // align:"start",
                        render: datum => <Text wordBreak="break-all"size='small'>{datum.hostname}</Text>,
                    },
                    {
                        property: 'rack',
                        header: <Text size='small' onClick={() => {
                            this.setSort("rack")
                        }} style={{cursor: "pointer"}}>Rack  {this.state.sortField === 'rack' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                        //align:"end",
                        render: datum => <Text size='small'>{datum.rack}</Text>,

                    },
                    {
                        property: 'rackU',
                        header: <Text size='small' onClick={() => {
                            this.setSort("rackU")
                        }} style={{cursor: "pointer"}}>Rack U  {this.state.sortField === 'rackU' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                        render: datum => <Text size='small'>{datum.rackU}</Text>,

                    },
                    {
                        property: 'owner',
                        header: <Text size='small' onClick={() => {
                            this.setSort("owner")
                        }} style={{cursor: "pointer"}}>Owner  {this.state.sortField === 'owner' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
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
                        header: <Text size='small' onClick={() => {
                            this.setSort("datacenterAbbrev")
                        }} style={{cursor: "pointer"}}> Datacenter Abbrev.  {this.state.sortField === 'datacenterAbbrev' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                        render: datum => <Text size='small'>
                            {datum.datacenterAbbrev}
                        </Text>,

                    },
                    {
                        property: "power",
                        header: <Text size='small'>Power  {this.state.sortField === 'power' && (this.state.sortAscending ? <FormDown /> : <FormUp />)}</Text>,
                        sortable: false,
                        align: 'center',

                        render: datum => {
                           //if(docSnapshot.data().datacenterAbbrev.toUpperCase() === "RTP1" && docSnapshot.data().rackRow.charCodeAt(0) >= 65 && docSnapshot.data().rackRow.charCodeAt(0) <= 69 && parseInt(docSnapshot.data().rackNum) >= 1 && parseInt(docSnapshot.data().rackNum) <= 19 && docSnapshot.data().powerConnections && docSnapshot.data().powerConnections.length){


                                if ((userutils.isLoggedInUserAdmin() || userutils.getLoggedInUserUsername() === datum.owner) && datum.datacenterAbbrev.toUpperCase() === "RTP1" && datum.rackRow.charCodeAt(0) >= 65 && datum.rackRow.charCodeAt(0) <= 69 && parseInt(datum.rackNum) >= 1 && parseInt(datum.rackNum) <=19 && datum.powerConnections && datum.powerConnections.length) {
                                return (<Box direction={"row"} justify={"center"}>
                                    <Power style={{backgroundColor: this.colors[datum.asset_id+'_on_color']}} onClick={(e) => {
                                        e.persist()
                                        e.nativeEvent.stopImmediatePropagation()
                                        e.stopPropagation()
                                        //turn on all ports
                                        let count = 0;
                                        Object.keys(datum.powerConnections).forEach((connection) => {
                                            let formattedNum;
                                            console.log(datum);
                                            if(datum.rackNum.toString().length === 1){
                                                formattedNum = "0" + datum.rackNum;
                                            } else {
                                                formattedNum = datum.rackNum;
                                            }
                                            powerutils.powerPortOn("hpdu-rtp1-" + datum.rackRow + formattedNum + datum.powerConnections[connection].pduSide.charAt(0), datum.powerConnections[connection].port, result => {
                                                if(result){
                                                    count++;
                                                    if(count === Object.keys(datum.powerConnections).length){
                                                        this.props.handleToast({
                                                            type: "success",
                                                            message: "Successfully powered on the asset!"
                                                        })
                                                    }
                                                } else {
                                                    this.props.handleToast({
                                                        type: "error",
                                                        message: "Something went wrong. Please try again later."
                                                    })
                                                }
                                            })
                                        })
                                    }
                                    }
                                           onMouseOver={e => this.colors[datum.asset_id+'_on_color']='#dddddd'}
                                           onMouseLeave={e => this.colors[datum.asset_id+'_on_color']=''}/>
                                    <Clear style={{backgroundColor: this.colors[datum.asset_id+'_off_color']}} onClick={(e) => {
                                        e.persist()
                                        e.nativeEvent.stopImmediatePropagation()
                                        e.stopPropagation()
                                        //turn on all ports
                                        let count = 0;
                                        Object.keys(datum.powerConnections).forEach((connection) => {
                                            let formattedNum;
                                            console.log(datum);
                                            if(datum.rackNum.toString().length === 1){
                                                formattedNum = "0" + datum.rackNum;
                                            } else {
                                                formattedNum = datum.rackNum;
                                            }
                                            powerutils.powerPortOff("hpdu-rtp1-" + datum.rackRow + formattedNum + datum.powerConnections[connection].pduSide.charAt(0), datum.powerConnections[connection].port, result => {
                                                if(result){
                                                    count++;
                                                    if(count === Object.keys(datum.powerConnections).length){
                                                        this.props.handleToast({
                                                            type: "success",
                                                            message: "Successfully powered off the asset!"
                                                        })
                                                    }
                                                } else {
                                                    this.props.handleToast({
                                                        type: "error",
                                                        message: "Something went wrong. Please try again later."
                                                    })
                                                }
                                            })
                                        })
                                    }
                                    }
                                           onMouseOver={e => this.colors[datum.asset_id+'_off_color']='#dddddd'}
                                           onMouseLeave={e => this.colors[datum.asset_id+'_off_color']=''}/>
                                    <PowerCycle style={{backgroundColor: this.colors[datum.asset_id+'_cycle_color']}} onClick={(e) => {
                                        e.persist()
                                        e.nativeEvent.stopImmediatePropagation()
                                        e.stopPropagation()
                                        //turn on all ports
                                        this.props.handleToast({
                                            type: "info",
                                            message: "Power cycling the asset. Please wait..."
                                        })
                                        let count = 0;
                                        Object.keys(datum.powerConnections).forEach((connection) => {
                                            let formattedNum;
                                            console.log(datum);
                                            if(datum.rackNum.toString().length === 1){
                                                formattedNum = "0" + datum.rackNum;
                                            } else {
                                                formattedNum = datum.rackNum;
                                            }
                                            powerutils.powerPortOff("hpdu-rtp1-" + datum.rackRow + formattedNum + datum.powerConnections[connection].pduSide.charAt(0), datum.powerConnections[connection].port, result => {
                                                if(result){
                                                    count++;
                                                    if(count === Object.keys(datum.powerConnections).length){
                                                        //wait
                                                        setTimeout(() => {
                                                            let count = 0;
                                                            Object.keys(datum.powerConnections).forEach((connection) => {
                                                                let formattedNum;
                                                                console.log(datum);
                                                                if(datum.rackNum.toString().length === 1){
                                                                    formattedNum = "0" + datum.rackNum;
                                                                } else {
                                                                    formattedNum = datum.rackNum;
                                                                }
                                                                powerutils.powerPortOn("hpdu-rtp1-" + datum.rackRow + formattedNum + datum.powerConnections[connection].pduSide.charAt(0), datum.powerConnections[connection].port, result => {
                                                                    if(result){
                                                                        count++;
                                                                        if(count === Object.keys(datum.powerConnections).length){
                                                                            this.props.handleToast({
                                                                                type: "success",
                                                                                message: "Successfully powered cycled the asset!"
                                                                            })
                                                                        }
                                                                    } else {
                                                                        this.props.handleToast({
                                                                            type: "error",
                                                                            message: "Something went wrong. Please try again later."
                                                                        })
                                                                    }
                                                                })
                                                            })
                                                        }, 2000);
                                                    }
                                                } else {
                                                    this.props.handleToast({
                                                        type: "error",
                                                        message: "Something went wrong. Please try again later."
                                                    })
                                                }
                                            })
                                        })
                                    }
                                    }
                                                onMouseOver={e => this.colors[datum.asset_id+'_cycle_color']='#dddddd'}
                                                onMouseLeave={e => this.colors[datum.asset_id+'_cycle_color']=''}/>
                                </Box>)
                            } else {
                                return (<Text size={"small"}>No options available.</Text>)
                            }
                        }
                    },
                    // {
                    //     property: 'powerConnections',
                    //     header: <Text size='small'> Power Connections</Text>,
                    //     render: datum => <Text size='small'>
                    //         {/* {datum.owner} */}
                    //     </Text>,

                    // },
                    ...this.getAdminColumns()
                ]}
                size="medium"
                //pad={{ horizontal: "medium", vertical: "xsmall" }}

                onClickRow={({datum}) => {
                    this.props.parent.props.history.push('/assets/' + datum.asset_id)
                }}

                data={this.props.searchResults || this.state.assets}


            />
            </Box>
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
