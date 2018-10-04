const express = require("express");
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "jSi83D": {
    id: "jSi83D",
    email: "zacharylhlee@hotmail.com",
    password: "hello"
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
  res.send("Hello!");
});

//Connects to homepage with all database of URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
     };
  res.render("urls_index", templateVars);
});

//Connects to page to add URLs
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
     };
  if (req.cookies['user_id']) {
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
  const userID = req.cookies['user_id'];
  urlDatabase[shortURL] = {
    url: longURL,
    userID: userID
  }
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


//Connects to registration page
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
  };
  res.render("urls_register", templateVars);
})

//Save email and password to users database
app.post("/register", (req, res) => {
  const email = req.body['email'];
  const password = req.body['password'];
  //Check if email and password are submitted
  if (!email || !password){
    res.statusCode = 400;
    res.end("400 status code: Please provide email and password");
  } else {
    //Check if email is already registered as a user
    var emailUsed = false;
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
        "password": password,
      }
      res.cookie("user_id", id);
      res.redirect("/urls");
    }
  }
});

//Connects to login page
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
  };
  res.render("urls_login", templateVars);
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
    var matchUser = false;
    var login = false;
    var id;
    for (user in users) {
      if (email === users[user]['email']) {
        matchUser = true;
        id = user;
      }
    }
    if (matchUser) {
      //Check if password matches registered user
      if (password === users[id]['password']) {
        res.cookie("user_id", id);
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
  res.clearCookie("user_id")
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
    user: users[req.cookies['user_id']]
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
