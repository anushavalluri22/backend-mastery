//------------------------------------------------ALL necessary third-party Packages (Imports)---------------------------------------------------------------------------------------------------------------------------------------
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {open} = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const { off } = require('process');
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const app = express();   // creates an instance of the express server (that server is needed for the user
                        //  to perform various operations on DataBase and get the needed resources)

                        
app.use(express.json()); // Converts the data passed to the http-Body to Json format for better understanding for the server


const dbPath = path.join(__dirname,'practice.db'); // the path package containes a method called join() which is used to get the complete path
                                                  // of that specified file from root directory (ex: c:/Desktop/node/backend-mastery/myapp/practice.db)



let db = null; // Initially we havent connected the DataBase and server yet so lets assume it as null for now..

//---------------------------------------------------Connecting SQlite Database and express Server------------------------------------------------------------------------------------
const initializeDbAndServer = async() => {
    try {
        db = await open({
        filename : dbPath,
        driver : sqlite3.Database
        });
        app.listen(3000,() => {
            console.log(`server running on the port 3000`);
        });
    }
    catch(e) {
        console.log(`Expecter error : ${e.message}`);
        process.exit(1);
    }

};
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// --------------------Get Users API --> Display Users by sorting and ordering functions like (like,orderBy,order,limit,offset) and also Token Authentication-------------------------------------------------------------
app.get('/users/',async(request,response) => {
  let jwtToken;
  const authHeader = request.headers.authorization;
  if(authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if(jwtToken === undefined) {
    response.status(401);
    response.send("Invalid Access Token");
  }
  else {
    jwt.verify(jwtToken,"MY_SECRET_TOKEN",async(error,payload) =>{
      if(error) {
        response.status(401);
        response.send("Invalid Access Token")
      }
      else {
        const {search_q = '',orderBy = 'id',order = 'ASC',limit = 5,offset = 0} = request.query
        let query = search_q || order || orderBy || limit || offset ? `SELECT
        *
        FROM
        users
        WHERE name LIKE '%${search_q}%'
        ORDER BY ${orderBy} ${order}
        LIMIT ? OFFSET ?;` : `SELECT * FROM users;`
        let usersArray = await db.all(query,[limit,offset]);
        response.send(usersArray);
      }
    })
  }
});
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//------------------------------------------------------Get User API --> Display Single User -----------------------------------------------------------------------------------------------------------------------------
app.get('/users/:id/',async(request,response) => {
    const {id} = request.params;
    const displayUsersquery = `SELECT * 
    FROM 
    users
    WHERE
    id = ${id}`;
    const row = await db.get(displayUsersquery);
    console.log(row)
    row ? response.send(row) : response.sendFile('err.html',{root:__dirname});
})
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//--------------------------------------------------Register API --> creates new user in the Database---------------------------------------------------------------------------------------------------------------------------- 
app.post('/users/',async(request,response) =>{
    const userDetails = request.body;
    const {
        name,
        age,
        email,
        password
    } = userDetails;
    const hpasswd = await bcrypt.hash(password,10);
    const query = `SELECT * FROM users WHERE name = ?;`
    const dbUser = await db.get(query,[name]);
    if(dbUser === undefined) {
      const addUserQuery = `
      INSERT INTO 
      users(name,age,email,password) VALUES(
      ?,?,?,?
      );`
    await db.run(addUserQuery,[name, age, email,hpasswd]);
    response.send("User Created Successfully");
    }
    else {
      response.status(400);
      response.send("User already exists");
    }
    
})
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//--------------------------------------Login API (with Token Authentication) --> creates a unique access Token for the logged-in user-------------------------------------------------------------------------------------------------------------------------------------
app.post('/login/',async(request,response) => {
  const {name,password} = request.body;
  const query = `SELECT * FROM users WHERE name = ?;`
  const dbUser = await db.get(query,[name])
  if(dbUser === undefined) {
    response.status(400);
    response.send("Invalid User")
  }
  else {
    const isPasswordMatched = await bcrypt.compare(password,dbUser.password);
    console.log(dbUser.password);
    console.log(password);
    if(isPasswordMatched === true) {
      const payload = {name : name};
      const jwtToken = jwt.sign(payload,"MY_SECRET_TOKEN");
      response.send({jwtToken});
    }
    else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
})
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------Update User API --> Updates the user details in the-------------------------------------------------------------------------------------------------------------------------------------
app.put("/users/:userId/", async (request, response) => {
  const { userId } = request.params;
  const userDetails = request.body;
  const {
    name,
    age,
    email
  } = userDetails;
  const updateUserQuery = `
    UPDATE
      users
    SET
      name=?,
      age=?,
      email=?
    WHERE
      id = ?;`;
  await db.run(updateUserQuery,[name,age,email,userId]);
  response.send("User Updated Successfully");
});
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//-----------------------------------------------Delete User API --> Deletes an existing user from the DataBase----------------------------------------------------------------------------------------------------------------------------------------
app.delete("/users/:userId",async (request,response) => {
  const {userId} = request.params;
  const deleteUserQuery = `
  DELETE FROM
  users
  WHERE id = ?;`
  await db.run(deleteUserQuery,[userId]);
  response.send("User Deleted Successfully");

});
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
initializeDbAndServer();
