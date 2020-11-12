const sercretkey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJWaWRlb2NhbGwiLCJuYW1lIjoiT05FQ0hBVFNFUlZJQ0UiLCJpYXQiOjIyMDF9.-llQuCLFEUdv4BdJ1pf0-4KwrfwnXz7ybqS10DFLuBs'

module.exports = function(token) {
  if(sercretkey === token){
    return true 
  }else{
    return false
  }
}