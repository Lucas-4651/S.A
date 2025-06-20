// app.js
const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "secret_ia_companion",
    resave: false,
    saveUninitialized: true,
  })
);

// Chargement données JSON (simulate DB)
let users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
const prompts = JSON.parse(fs.readFileSync("./data/prompts.json", "utf8"));
const guides = JSON.parse(fs.readFileSync("./data/guides.json", "utf8"));
const astuces = JSON.parse(fs.readFileSync("./data/astuces.json", "utf8"));

// Middleware pour vérifier l'auth
function checkAuth(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/login");
}

// Routes

// Home avec astuce du jour
app.get("/", (req, res) => {
  const randomTip = astuces[Math.floor(Math.random() * astuces.length)];
  res.render("pages/home", { user: req.session.user, randomTip });
});

// Prompts list
app.get("/prompts", (req, res) => {
  res.render("pages/prompts", { prompts, user: req.session.user });
});

// Guides list
app.get("/guides", (req, res) => {
  res.render("pages/guides", { guides, user: req.session.user });
});

// Astuces list
app.get("/astuces", (req, res) => {
  res.render("pages/astuces", { astuces, user: req.session.user });
});

// Login form
app.get("/login", (req, res) => {
  res.render("pages/login", { error: null });
});

// Login POST
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;
    res.redirect("/dashboard");
  } else {
    res.render("pages/login", { error: "Nom d'utilisateur ou mot de passe incorrect." });
  }
});

// Register form
app.get("/register", (req, res) => {
  res.render("pages/register", { error: null });
});

// Register POST
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users.find((u) => u.username === username)) {
    return res.render("pages/register", { error: "Nom d'utilisateur déjà pris." });
  }
  const newUser = {
    username,
    password: bcrypt.hashSync(password, 10),
    promptsFavoris: [],
    historique: [],
  };
  users.push(newUser);
  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2));
  res.redirect("/login");
});

// Dashboard (protégé)
app.get("/dashboard", checkAuth, (req, res) => {
  const user = users.find((u) => u.username === req.session.user.username);
  res.render("pages/dashboard", { user });
});

// Prompt Battle Arena (fonction bonus)
app.get("/arena", (req, res) => {
  const allPrompts = prompts.rédaction.concat(prompts.code);
  const p1 = allPrompts[Math.floor(Math.random() * allPrompts.length)];
  let p2;
  do {
    p2 = allPrompts[Math.floor(Math.random() * allPrompts.length)];
  } while (p1.prompt === p2.prompt);
  res.render("pages/arena", { p1, p2, user: req.session.user });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 IA Companion lancé sur http://localhost:${PORT}`);
});