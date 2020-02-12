import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

/* Components */
import DeleteAssetPopup from '../components/DeleteAssetPopup'

// Configure enzyme for react 16
Enzyme.configure({ adapter: new Adapter() })

describe('firstJestTest', () => {
  it('delete asset popup renders', () => {
    const wrapper = shallow(<DeleteAssetPopup></DeleteAssetPopup>)
    const popup = wrapper.find('DeleteAssetPopup')
    expect(popup).toHaveLength(1)
    //expect(paragraph.text()).toEqual('This is my first test')
  })
})