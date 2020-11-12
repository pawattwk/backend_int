const  {
  calgrade,
  fetchSomeData,
  login,
  checksavefile
}  = require('../__tests__/app')

// https://devahoy.com/blog/2019/08/getting-started-with-testing-and-jest/
// describe('score', () => {
//   it('should work', () => {})
// })

// it('should get A', () => {
//   expect(calgrade(80)).toEqual('A')
//   expect(calgrade(100)).toEqual('A')
//   expect(calgrade(86)).toEqual('A')
// })

// it('should get B', () => {
//   expect(calgrade(79)).toEqual('B')
//   expect(calgrade(70)).toEqual('B')
// })

// it('should works async function with resolves', async () => {
//   const response = await fetchSomeData()
//   expect(response).toEqual('success')
//   // await expect(get.fetchSomeData()).resolves.toEqual('success')
// })

// it('should works with jest.fn()', () => {
//   let myMock = fetchSomeData()
//   myMock = jest.fn()
//   expect(myMock()).toEqual(undefined)
// })

it('should works with mockReturnValue', () => {
  const myMock = jest.fn() // สร้าง myMock เป็น mock function
  myMock.mockReturnValue('hello world') // mock ค่าตอน return ให้มัน
  expect(myMock()).toEqual('hello world')
})

// describe('Test login', () => {
  // it('check array length', () => {
    // expect(login()).toHaveLength(2)
  // })
// })

// describe('Test unsavefile', () => {
//   it('check unsavefile', () => {
//     expect(checksavefile.toEqual([6,7,8])
//   })
// })
