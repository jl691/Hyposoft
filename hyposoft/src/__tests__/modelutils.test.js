import * as modelutils from '../utils/modelutils'

// NOTE: please only have one assertion in each test

describe('modelutilsTests', () => {
  test('getSuggestedVendors empty string', done => {
    modelutils.getSuggestedVendors('', array => {
        expect(array).toEqual(['Apple','Dell','Google'])
        done()
    })
  })

  test('getSuggestedVendors a', done => {
    modelutils.getSuggestedVendors('a', array => {
        expect(array).toEqual(['Apple'])
        done()
    })
  })
})
