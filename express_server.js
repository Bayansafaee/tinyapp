const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

// EJS template
app.set("view engine", "ejs");

// helper functions
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

// users database
const userDatabase = {};

// URL database
const urlDatabase = {};

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["some-long-secret"],
}));

// ROUTING
app.get("/", (req, res) => {
  res.redirect('/urls');
});

// registration page
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = {
    user_id: userDatabase[req.session.user_id]
  };
  res.render('register', templateVars);
});

app.get('/login', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = {
    user_id: userDatabase[req.session.user_id],
    urls: urlDatabase
  };
  res.render("login", templateVars);
});

// Displays our urls from the urlDatabase by using the urls_index template
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const userURLS = urlsForUser(user_id, urlDatabase);
  const templateVars = {
    urls: userURLS,
    user_id: userDatabase[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});

// Render a new website URL and displays it with the urls_new template
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      urls: urlDatabase,
      user_id: userDatabase[req.session.user_id]
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
      user_id: userDatabase[req.session.user_id]
    };

    // only URLs that belongs to current user
    if (urlDatabase[req.params.id].userID === req.session.user_id) {
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
  if (!req.session.user_id) {
    return res.status(400).send('Must login to shorten URLs.\n');
  }
  const currentUserIDs = Object.keys(urlDatabase);
  let id = generateRandomString();
  while (currentUserIDs.includes(id)) {
    id = generateRandomString();
  }
  urlDatabase[id] = {};
  urlDatabase[id].longURL = req.body.longURL;
  urlDatabase[id].userID = req.session.user_id;
  res.redirect(`/urls/${id}`);
});

// delete entry from database
app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send('Must login to delete URLs.\n');
  }
  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(401).send('Must be owner to delete.\n');
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");

});

// edit request
app.post("/urls/:id/", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send('Must login to update URLs.\n');
  }
  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(401).send('Must be owner to delete.\n');
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// User login functionality
app.post("/login", (req, res) => {
  const userCheck = getUserByEmail(req.body.email, userDatabase);
  if (!userCheck) {
    res.sendStatus(404);
  } else {
    if (userCheck.email === req.body.email && bcrypt.compareSync(req.body.password, userCheck.password)) {
      req.session.user_id = userCheck.user_id;

      res.redirect("/urls");
    } else {
      res.sendStatus(406);
    }
  }
});

// User Log out
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  if (getUserByEmail(req.body.email, userDatabase)) {
    res.sendStatus(400);
  } else {
    if (req.body.email === '' || req.body.password === '') {
      req.session = null;
      res.sendStatus(400);
    } else {
      const userID = String(generateRandomString());
      userDatabase[String(userID)] = {
        user_id: userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.user_id = userID;

      res.redirect("/urls");
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});