import React, { Component } from 'react'
import AssetScreen from './AssetScreen'

class OfflineAssetScreen extends Component {
  constructor(props) {
      super(props);
  }

  render() {
    return(
      <AssetScreen
      match={this.props.match}
      parent={this.props.parent}
      history={this.props.history}
      />
    )
  }
}

export default OfflineAssetScreen
