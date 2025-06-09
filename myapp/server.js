const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
app.use(express.json());
const {open} = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const { off } = require('process');
const dbPath = path.join(__dirname,'practice.db');
let db = null;
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
// Display users API
app.get('/users/',async(request,response) => {
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
});

// Display single User API
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
// Register API
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

// Login API
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
      response.send("Login Success!");
    }
    else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
})

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

app.delete("/users/:userId",async (request,response) => {
  const {userId} = request.params;
  const deleteUserQuery = `
  DELETE FROM
  users
  WHERE id = ?;`
  await db.run(deleteUserQuery,[userId]);
  response.send("User Deleted Successfully");

})


initializeDbAndServer();
