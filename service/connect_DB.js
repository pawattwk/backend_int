var mongoose = require('mongoose')
const Roles = require('../models/roles')


try {
  var url = `mongodb://${process.env.databaseHost}:${process.env.databasePort_ie}/${process.env.databaseName_ie}?authSource=${process.env.database_AuthSource}`;
  var option =  {
    user: process.env.database_User,
    pass: process.env.database_Password,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    }
  mongoose.connect(url,option)
  mongoose.connection.on('connected', function () {  
    console.log('DB Connection');
  }); 
  mongoose.connection.on('error',function (err) {  
    console.log('DB Connection error: ' + err);
  }); 
  createRole()
  // console.log('DB Connect');
} 
catch (error) {
  console.log(error);
}

async function createRole(){
  try {
    let role = await Roles.find({$or:[ {'name':'admin'}, {'name':'user'}, {'name':'host'}, {'name':'citizen'} ]})
    if (!role.length) {
      let createadminrole = new Roles({
        name : "admin",
        created_at : Date.now(),
        updated_at : Date.now(),
      })
      let createhostrole = new Roles({
        name : "host",
        created_at : Date.now(),
        updated_at : Date.now(),
      })
      let createuserrole = new Roles({
        name : "user",
        created_at : Date.now(),
        updated_at : Date.now(),
      })
      let createcitizenrole = new Roles({
        name : "citizen",
        created_at : Date.now(),
        updated_at : Date.now(),
      })
      await createadminrole.save()
      await createuserrole.save()
      await createhostrole.save()
      await createcitizenrole.save()
      console.log('Create Roles');
    }
  } catch (error) {
   console.log(error); 
  }
}