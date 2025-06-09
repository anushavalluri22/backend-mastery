const express = require('express');
const app = express();
app.use(express.json());
const {open} = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname,'practice.db');
let db = null;

// Connecting SQlite Database and express Server
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

// Get Users API -- > gives all Users in the practice.db Data Base
app.get('/users/',async(request,response) => {
    const displayUsersquery = `SELECT * 
    FROM 
    users;`
    const usersArray = await db.all(displayUsersquery);
    console.log(usersArray)
    response.send(usersArray);
})
initializeDbAndServer();