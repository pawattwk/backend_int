
function calgrade(point){
  if (point < 50) return 'F'
  else if(point >= 50 && point <60)  return 'D'
  else if(point >= 60 && point <70)  return 'C'
  else if(point >= 70 && point <80)  return 'B'
  else return 'A'
}

function fetchSomeData(){
 return new Promise(resolve => resolve('success'))
}

function login(username,password){
  return [username,password]
}

function checksavefile(){
  let unsave = [1,2,3,4,5],save=[1,2,3,4,5,6,7,8],result=[]
  for (let i = 0; i < save.length; i++) {
    const element = save[i]
    if (!unsave.includes(element)) result.push(element)
  }
  return result
}

module.exports = {calgrade,fetchSomeData,login,checksavefile}