const express = require("express"); // importing the express package
const app = express(); // creating an express server instance

app.get('/',(request,response) => {
    let date = new Date();
    response.send("Hello guys !");
});
app.get('/date',(request,response) => {
    let date = new Date();
    response.send(`Today's dates is ${date}`);
});

app.get('/page',(request,response) => {
    response.sendFile('./page.html',{root: __dirname});
});
app.listen(3000);
