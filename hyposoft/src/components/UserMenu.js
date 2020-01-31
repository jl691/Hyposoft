import React from 'react'
import { Menu } from 'grommet'
import * as userutils from '../utils/userutils'

const UserMenu = (props) => {
    var items = [
        {label: 'Settings', onClick: () => props.this.props.history.push('/settings')},
        {label: 'Logout', onClick: () => {userutils.logout(); props.this.props.history.push('/')}},
    ]

    return (
            <Menu label={localStorage.getItem('displayName')}
                margin={{ right: 'small' }}
                items={items}
            />
    )
}

export default UserMenu
