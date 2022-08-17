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
 
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// user lookup helper function
const getUserByEmail = (email) => {
  for (const user_id in userDatabase) {
    if (userDatabase[user_id].email === email) {
      return userDatabase[user_id];
    }
  }
  return null;
};

const urlsForUser = (id) => {
  const keys = Object.keys(urlDatabase);
  let userURLs = {};

  for (const key of keys) {
    if (urlDatabase[key].userID === id) {
      userURLs[key] = urlDatabase[key];
    }
  }
  return userURLs;
};

// ROUTING
app.get("/", (req, res) => {
  res.redirect('/urls');
});

// registration page
app.get('/register', (req, res) => {
  if (req.cookies['user_id']) {
    return res.redirect('/urls');
  }
  const templateVars = {
    user_id: userDatabase[req.cookies['user_id']]
  };
  res.render('register', templateVars);
});

app.get('/login', (req, res) => {
  if (req.cookies['user_id']) {
    return res.redirect('/urls');
  }
  const templateVars = {
    user_id: userDatabase[req.cookies['user_id']],
    urls: urlDatabase
  };
  res.render("login", templateVars);
});

// Displays our urls from the urlDatabase by using the urls_index template
app.get("/urls", (req, res) => {
  const userURLS = urlsForUser(req.cookies.user_id);
  const templateVars = {
    urls: userURLS,
    user_id: userDatabase[req.cookies['user_id']],
  };
  res.render("urls_index", templateVars);
});

// Render a new website URL and displays it with the urls_new template
app.get("/urls/new", (req, res) => {
  if (req.cookies['user_id']) {
    const templateVars = {
      urls: urlDatabase,
      user_id: userDatabase[req.cookies["user_id"]]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

// Displays short URL and long URL
app.get("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const templateVars = {
      URLid: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user_id: userDatabase[req.cookies['user_id']]
    };
  
    // only URLs that belongs to current user
    if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
      res.render("urls_show", templateVars);
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(404);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL;
    return res.redirect(longURL);
  }
  res.sendStatus(404);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Generates 6 digit string that is added to database and redirected to urls/:id
app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(400).send('Must login to shorten URLs.\n');
  }
  const currentUserIDs = Object.keys(urlDatabase);
  let id = generateRandomString();
  while (currentUserIDs.includes(id)) {
    id = generateRandomString();
  }
  urlDatabase[id] = {};
  urlDatabase[id].longURL = req.body.longURL;
  urlDatabase[id].userID = req.cookies.user_id;
  res.redirect(`/urls/${id}`);
});

// delete entry from database
app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    res.status(401).send('Must be logged in to delete.\n');
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

// edit request
app.post("/urls/:id/", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  urlDatabase[req.params.id].userID = req.cookies.user_id;
  res.redirect("/urls");
});

// User login functionality
app.post("/login", (req, res) => {
  const userCheck = getUserByEmail(req.body.email);
  if (!userCheck) {
    res.sendStatus(404);
  } else {
    if (userCheck.email === req.body.email && userCheck.password === req.body.password) {
      res.cookie('user_id', userCheck.user_id);
      res.redirect("/urls");
    } else {
      res.sendStatus(406);
    }
  }
});

// User Log out
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  if (getUserByEmail(req.body.email)) {
    res.sendStatus(400);
  } else {
    if (req.body.email === '' || req.body.password === '') {
      res.clearCookie('user_id');
      res.sendStatus(400);
    } else {
      const userID = String(generateRandomString());
      userDatabase[String(userID)] = {
        user_id: userID,
        email: req.body.email,
        password: req.body.password
      };
      res.cookie('user_id', userID);
      res.redirect("/urls");
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});