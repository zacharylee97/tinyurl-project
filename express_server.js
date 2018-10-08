//Adds all required packages
const PORT = 8080;
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs")
const methodOverride = require("method-override");

//Set up express with body-parser and cookie-session
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["user_id", "visitor_id"]
}));
app.use(methodOverride('_method'));

const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    totalVisits: 0,
    visitors: {},
    log: {}
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "user2RandomID",
    totalVisits: 0,
    visitors: {},
    log: {}
  }
}

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur")
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk")
  }
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

//Function to check if email has already been registered
function registered(users, email) {
  let isUsed = false;
  for (let user in users) {
    if (email === users[user]["email"]) {
      isUsed = true;
    }
  }
  return isUsed;
}

//Redirect from root page based on login status
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//Connects to homepage with all database of URLs
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
     };
  res.render("urls_index", templateVars);
});

//Connects to page to add URLs
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
     };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
})

//Generate new shortURL and add to database
app.post("/urls", (req, res) => {
  const input = req.body;
  const shortURL = generateRandomString();
  const longURL = input["longURL"];
  const userID = req.session.user_id;
  urlDatabase[shortURL] = {
    url: longURL,
    userID: userID,
    totalVisits: 0,
    visitors: {},
    log: {}
  }
  res.redirect("/urls/" + shortURL);
});

//Delete URL from database
app.delete("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id]['userID'] === req.session.user_id) {
    delete urlDatabase[req.params.id];
  }
    res.redirect("/urls");
});

//Update URL in database
app.put("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]["userID"] === req.session.user_id) {
    urlDatabase[req.params.id]["url"] = req.body["longURL"];
  }
  res.redirect("/urls");
});

//Connects to registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect("/urls")
  } else {
    res.render("urls_register", templateVars);
  }
});

//Save email and password to users database
app.post("/register", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  const hashedPassword = bcrypt.hashSync(password, 10);
  //Check if email and password are submitted
  if (!email || !password) {
    res.statusCode = 400;
    res.end("400 status code: Please provide email and password");
  } else {
    var emailUsed = registered(users, email);
    console.log(emailUsed)
    //Error if email already registered by a user
    if (emailUsed) {
      res.statusCode = 400;
      res.end("400 status code: Email already registered by a user");
    } else {
      //Register new user
      const id = generateRandomString();
      users[id] = {
        "id": id,
        "email": email,
        "password": hashedPassword
      }
      req.session.user_id = id;
      res.redirect("/urls");
    }
  }
});

//Connects to login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
    if (req.session.user_id) {
    res.redirect("/urls")
  } else {
    res.render("urls_login", templateVars);
  }
});

// Log in form
app.post("/login", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  //Check if email and password are submitted
  if (!email || !password){
    res.statusCode = 400;
    res.end("400 status code: Please provide email and password");
  } else {
    //Check if email matches a user
    let matchUser = false;
    let id;
    for (user in users) {
      if (email === users[user]["email"]) {
        matchUser = true;
        id = user;
      }
    }
    if (matchUser) {
      //Check if password matches registered user
      if (bcrypt.compareSync(password, users[id]["password"])) {
        req.session.user_id = id;
        res.redirect("/");
      //403 status code if password does not match user
      } else {
        res.statusCode = 403;
        res.end("403 status code: Email and password are incorect");
      }
    //403 status code if email does not match user
    } else {
      res.statusCode = 403;
      res.end("403 status code: Email and password are not incorrect");
    }
  }
});

//Remove user_id cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

//Redirect to longURL
app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id]["url"];
    urlDatabase[req.params.id]['totalVisits']++;

  //Keep track of unique visitors
    let visitor_id = req.session.user_id;
    //If user is not logged in, generate unique visitor_id
    if (visitor_id === undefined) {
      visitor_id = generateRandomString();
    }
    let date = new Date();
    urlDatabase[req.params.id]['log'][date] = visitor_id;
    req.session.visitor_id = visitor_id;
    if (!urlDatabase[req.params.id]['visitors'].hasOwnProperty(visitor_id)) {
      urlDatabase[req.params.id]['visitors'][visitor_id] = 1;
    }
    res.redirect(longURL);
  } else {
    res.end("URL does not exist!");
  }
});

//Display page to update URL
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  //Check that shortURL is in database
  let validURL = false;
  for (let el in urlDatabase) {
    if (req.params.id === el) {
      validURL = true;
    }
  }
  if (validURL) {
    res.render("urls_show", templateVars);
  } else {
    res.end("URL does not exist!");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});