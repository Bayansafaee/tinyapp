const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const generateRandomString = () => {
  return Math.random().toString(36).slice(2).substring(0,6);
};

// users database
const userDatabase = {

};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// user lookup helper function
const getUserByEmail = (email) => {
  for (const id in userDatabase) {
    if (userDatabase[id].email === email) {
      return userDatabase[id];
    }
  }
  return null;
};

// ROUTING
app.get("/", (req, res) => {
  res.send("Hello!");
});

// registration page
app.get('/register', (req, res) => {
  const templateVars = {
    id: userDatabase[req.cookies['id']]
  };
  res.render('register', templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = {
    id: userDatabase[req.cookies['id']],
    urls: urlDatabase
  };
  res.render("login", templateVars);
});

// Displays our urls from the urlDatabase by using the urls_index template
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    id: userDatabase[req.cookies['id']],
  };
  res.render("urls_index", templateVars);
});

// Render a new website URL and displays it with the urls_new template
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    id: userDatabase[req.cookies["id"]]
  };
  res.render("urls_new", templateVars);
});

// Displays short URL and long URL
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    URLid: req.params.id,
    longURL: urlDatabase[req.params.id],
    id: userDatabase[req.cookies['id']]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Generates 6 digit string that is added to database and redirected to urls/:id
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});


// delete entry from database
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// edit request
app.post("/urls/:id/", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});


// User login functionality
app.post("/login", (req, res) => {

  let checkUser = getUserByEmail(req.body.email);
  if (checkUser === null) {
    res.sendStatus(406);
  } else {
    if (checkUser.email === req.body.email && checkUser.password === req.body.password) {
      res.cookie('id', checkUser.id);
      res.redirect("/urls");
    } else {
      res.sendStatus(406);
    }
  }
  });

// User Log out
app.post('/logout', (req, res) => {
  res.clearCookie('id');
  res.redirect('/urls');
});



app.post("/register", (req, res) => {
  
  if (getUserByEmail(req.body.email) !== null) {
    res.sendStatus(400);
  } else {
    if (req.body.email === '' || req.body.password === '') {
      res.clearCookie('email');
      res.sendStatus(400);
    } 
    else {
      let userID = String(generateRandomString());
      userDatabase[String(userID)] = {
        id: userID,
        email: req.body.email,
        password: req.body.password};
      res.cookie('id', userID);
      res.redirect("/urls");
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});