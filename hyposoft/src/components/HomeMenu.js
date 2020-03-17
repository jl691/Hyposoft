import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { Menu } from 'grommet'
import * as icons from 'grommet-icons'

class HomeMenu extends Component {
    state = {
        redirect: '',
        clicked:false
    }

    render() {
      if (this.state.clicked) {
        this.state.clicked = false
        return <Redirect to={this.state.redirect} />
      }

      return (
              <Menu icon={<icons.Menu size='medium' />}
                  size={'large'}
                  items={
                    [
                        {label: 'Dashboard', onClick: () => this.setState({clicked:true, redirect: '/dashboard'})},
                        {label: 'Users', onClick: () => this.setState({clicked:true, redirect: '/users'})},
                        {label: 'Models', onClick: () => this.setState({clicked:true, redirect: '/models'})},
                        {label: 'Assets', onClick: () => this.setState({clicked:true, redirect: '/assets'})},
                        {label: 'Racks', onClick: () => this.setState({clicked:true, redirect: '/racks'})},
                        {label: 'Import/Export', onClick: () => this.setState({clicked:true, redirect: '/port'})},
                        {label: 'Datacenters', onClick: () => this.setState({clicked:true, redirect: '/datacenters'})},
                        {label: 'Logs', onClick: () => this.setState({clicked:true, redirect: '/logs'})},
                        {label: 'Change Plans', onClick: () => this.setState({clicked:true, redirect: '/changeplans'})},
                    ]
                  }
              />
      )
    }
}

export default HomeMenu
