
module.exports = function(req, res, next) {
  const authorization = req.headers['authorization'];
  if(authorization === undefined){
    return res.status(401).json({
      "status": 401,
      "message": "Unauthorized"
    })   
  }else{
    const token = req.headers['authorization'].split(' ')[1]
    if(token===undefined){ 
      return res.status(401).json({
        "status": 401,
        "message": "Unauthorized"
      })
    }else{
      req.token = token
      next();
      // res.status(200).json({token})
    }   
  }
  
}

