const express = require("express");
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

function generateRandomString() {
  let result = "";
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (let i = 0; i < 6; i++) {
    let code = Math.floor(Math.random() * chars.length);
    result += chars[code];
  }
  return result;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

//Connects to homepage with all database of URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
     };
  res.render("urls_index", templateVars);
});

//Connects to page to add URLs
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies['username']
     };
  res.render("urls_new", templateVars);
})

//Generate new shortURL and add to database
app.post("/urls", (req, res) => {
  const input = req.body;
  const shortURL = generateRandomString();
  const longURL = input['longURL'];
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls/" + shortURL);
});

//Delete URL from database
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//Update URL in database
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body['longURL'];
  res.redirect("/urls");
});

//Save username as a cookie
app.post("/login", (req, res) => {
  username = req.body['username'];
  res.cookie("username", username);
  res.redirect("/urls");
});

//Remove username cookie
app.post("/logout", (req, res) => {
  res.clearCookie("username")
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render("urls_show", templateVars);
})

app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
