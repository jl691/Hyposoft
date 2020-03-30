import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { Menu } from 'grommet'
import * as icons from 'grommet-icons'
import * as userutils from '../utils/userutils'

class HomeMenu extends Component {
    state = {
        redirect: '',
        clicked:false
    }

    generateItems() {
      var items = []
      items = items.concat(
        [
            {label: 'Dashboard', onClick: () => this.setState({clicked:true, redirect: '/dashboard'})},
            {label: 'Assets', onClick: () => this.setState({clicked:true, redirect: '/assets'})},
            {label: 'Change Plans', onClick: () => this.setState({clicked:true, redirect: '/changeplans'})},
            {label: 'Datacenters', onClick: () => this.setState({clicked:true, redirect: '/datacenters'})},
            {label: 'Import/Export', onClick: () => this.setState({clicked:true, redirect: '/port'})},
        ]
      )
      if (userutils.doesLoggedInUserHaveAuditPerm()) {
        items.push({label: 'Logs', onClick: () => this.setState({clicked:true, redirect: '/logs'})})
      }
      items = items.concat(
        [
            {label: 'Models', onClick: () => this.setState({clicked:true, redirect: '/models'})},
            {label: 'Racks', onClick: () => this.setState({clicked:true, redirect: '/racks'})},
            {label: 'Users', onClick: () => this.setState({clicked:true, redirect: '/users'})},
        ]
      )
      return items
    }

    render() {
      if (this.state.clicked) {
        this.state.clicked = false
        return <Redirect to={this.state.redirect} />
      }

      return (
              <Menu icon={<icons.Menu size='medium' />}
                  size={'large'}
                  items={this.generateItems()}
              />
      )
    }
}

export default HomeMenu
