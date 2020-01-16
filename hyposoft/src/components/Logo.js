import React from 'react'
import { NavLink } from 'react-router-dom'

const Logo = props => (
    <NavLink style={{
         userSelect: 'none', fontSize: props.alt ? '40px' : '20px', cursor: !props.alt && 'pointer'
     }} to='/'>
        HypoSoft
    </NavLink>
)
export default Logo
