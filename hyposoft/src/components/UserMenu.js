import React from 'react'
import { Menu } from 'grommet'
import * as userutils from '../utils/userutils'

const UserMenu = (props) => {
    var items = [
        {label: 'Settings', onClick: () => props.this.props.history.push('/settings')},
        {label: 'Logout', onClick: () => {userutils.logout(); props.this.props.history.push('/')}},
    ]
    if(JSON.parse(localStorage.getItem('isprof'))) {
        const profItem = {label: 'New class', onClick: () => {
            props.this.props.history.push('/newclass')
        }}
        items = [profItem, ...items]
    }

    return (
            <Menu label='Admin'
                margin={{ right: 'small' }}
                items={items}
            />
    )
}

export default UserMenu
