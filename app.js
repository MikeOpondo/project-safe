const dotenv = require("dotenv");
dotenv.config();
const logger = require("morgan");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

const app = express();
app.use(express.static("public"));
// app.use( express.static( "uploads" ) );
app.use(logger("dev"));
// Passport Config

const checkUserType = function(req, res, next) {
  const userType = req.originalUrl.split("/")[1];
  // Bring in the passport authentication starategy
  require("./config/passport")(userType, passport);
  next();
};

app.use(checkUserType);

// DB Config
const db = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose
  .connect(db, {
    keepAlive: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));
// Override method for POST to PATCH and PUT
app.use(methodOverride("_method"));

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());
// Express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Routes
const admin = require("./routes/admin");
app.use("/admin", admin);

const sacco = require("./routes/sacco");
app.use("/sacco", sacco);

app.use("/", require("./routes/index.js"));

//error 404 page middleware
app.use((req, res) => {
  res.status(404).render("error");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
