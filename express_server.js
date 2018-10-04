const express = require("express");
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs')

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["user_id"]
}));

const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "jSi83D"
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
  },
  "jSi83D": {
    id: "jSi83D",
    email: "zacharylhlee@hotmail.com",
    password: bcrypt.hashSync("hello")
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

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//Connects to homepage with all database of URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
     };
  res.render("urls_index", templateVars);
});

//Connects to page to add URLs
app.get("/urls/new", (req, res) => {
  let templateVars = {
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
  const longURL = input['longURL'];
  const userID = req.session.user_id;
  urlDatabase[shortURL] = {
    url: longURL,
    userID: userID
  }
  res.redirect("/urls/" + shortURL);
});

//Delete URL from database
app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id]['userID'] === req.session.user_id) {
    delete urlDatabase[req.params.id];
  }
    res.redirect("/urls");
});

//Update URL in database
app.post("/urls/:id/update", (req, res) => {
  if (urlDatabase[req.params.id]['userID'] === req.session.user_id) {
    urlDatabase[req.params.id]['url'] = req.body['longURL'];
  }
  res.redirect("/urls");
});

//Connects to registration page
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect("/urls")
  } else {
    res.render("urls_register", templateVars);
  }
})

//Save email and password to users database
app.post("/register", (req, res) => {
  const email = req.body['email'];
  const password = req.body['password'];
  const hashedPassword = bcrypt.hashSync(password, 10);
  //Check if email and password are submitted
  if (!email || !password) {
    res.statusCode = 400;
    res.end("400 status code: Please provide email and password");
  } else {
    //Check if email is already registered as a user
    let emailUsed = false;
    for (user in users) {
      if (email === users[user]['email']) {
        emailUsed = true;
      }
    }

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
  let templateVars = {
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
  const email = req.body['email'];
  const password = req.body['password'];
  //Check if email and password are submitted
  if (!email || !password){
    res.statusCode = 400;
    res.end("400 status code: Please provide email and password");
  } else {
    //Check if email matches a user
    let matchUser = false;
    let login = false;
    let id;
    for (user in users) {
      if (email === users[user]['email']) {
        matchUser = true;
        id = user;
      }
    }
    if (matchUser) {
      //Check if password matches registered user
      if (bcrypt.compareSync(password, users[id]['password'])) {
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

//  Remove user_id cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id]['url'];
    res.redirect(longURL);
  } else {
    res.end("URL does not exist!");
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
