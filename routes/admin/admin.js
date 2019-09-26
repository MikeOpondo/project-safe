const bcrypt = require("bcryptjs");
const passport = require("passport");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();
// Load User model
const { User, Sacco } = require("../../models/user");
const {
  ensureAuthenticated,
  forwardAuthenticated
} = require("../../config/auth");

module.exports = router => {
  // Login Page
  router.get("/login", forwardAuthenticated, (req, res) => res.render("login"));

  // Register
  router.post("/admin", (req, res, next) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
      errors.push({ msg: "Please enter all fields" });
    }

    if (password != password2) {
      errors.push({ msg: "Passwords do not match" });
    }

    if (password.length < 6) {
      errors.push({ msg: "Password must be at least 6 characters" });
    }

    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: "Email already exists" });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });
        //hash password
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  "success_msg",
                  "You are now registered and can log in"
                );

                res.redirect("/users/login");
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  });

  //register new sacco
  router.post("/saccoadmin", (req, res) => {
    const {
      name,
      uniqueSaccoCode,
      address,
      postal_code,
      registration_number,
      telephone_number,
      membership,
      date_founded,
      description,
      website,
      created,
      saccoLeaderFname,
      saccoLeaderLname,
      saccoLeaderPhoneNumber,
      status,
      email,
      password,
      password2
    } = req.body;

    let errors = [];
    if (!name || !email || !password || !password2) {
      errors.push({ msg: "Please enter all fields" });
    }
    if (password != password2) {
      errors.push({ msg: "Passwords do not match" });
    }

    if (password.length < 6) {
      errors.push({ msg: "Password must be at least 6 characters" });
    }

    if (errors.length > 0) {
      res.render("register", {
        errors,
        email,
        password,
        password2
      });
    } else {
      Sacco.findOne({ email: email }).then(user => {
        if (user) {
          errors.push({ msg: "The Sacco already exists" });
          res.render("register", {
            errors,
            name,
            uniqueSaccoCode,
            address,
            postal_code,
            registration_number,
            telephone_number,
            membership,
            date_founded,
            description,
            website,
            created,
            saccoLeaderFname,
            saccoLeaderLname,
            saccoLeaderPhoneNumber,
            status,
            email,
            password,
            password2
          });
        } else {
          const newUser = new Sacco({
            name,
            uniqueSaccoCode,
            address,
            postal_code,
            registration_number,
            telephone_number,
            membership,
            date_founded,
            description,
            website,
            created,
            saccoLeaderFname,
            saccoLeaderLname,
            saccoLeaderPhoneNumber,
            status,
            email,
            password
          });

          //Send email(sendgrid)
          sgMail.setApiKey(process.env.SG_KEY);
          const msg = {
            to: [email],
            from: "admin@fikasafe.com",
            subject: "Your Fika Safe Logins",
            html:
              `<strong>Thank you for registering with Fika Safe. Your login credentials are:<br><br>` +
              `Email: ${email}<br>Passowrd: ${password}</strong>`
          };
          sgMail.send(msg);
          res.status(200);
          req.flash("success_msg", "Message sent sucessfully!");
          res.redirect("/");
          console.log("success");

          //Hash password
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser
                .save()
                .then(user => {
                  console.log(user.password);
                  res.status(200);
                  res.redirect("/dashboard");
                })
                .catch(err => console.log(err));
            });
          });
        }
      });
    }
  });

  //Update specific sacco details
  router.patch("/:saccoId", (req, res) => {
    Sacco.findByIdAndUpdate(
      { _id: req.params.saccoId },
      {
        name: req.body.name,
        address: req.body.address,
        postal_code: req.body.postal_code,
        telephone_number: req.body.telephone_number,
        membership: req.body.membership,
        description: req.body.description,
        website: req.body.website,
        saccoLeaderFname: req.body.saccoLeaderFname,
        saccoLeaderLname: req.body.saccoLeaderLname,
        saccoLeaderPhoneNumber: req.body.saccoLeaderPhoneNumber,
        status: req.body.status,
        email: req.body.email
      },
      { new: true }
    )
      .then(sacco => {
        if (!sacco) {
          return res.status(404).send({
            message: "Sacco not found with id " + req.params.saccoId
          });
        }
        res.redirect("/dashboard");
      })
      .catch(err => {
        if (err.kind === "ObjectId") {
          return res.status(404).send({
            message: "Sacconot found with id " + req.params.saccoId
          });
        }
        return res.status(500).send({
          message: "Error updating Sacco with id " + req.params.saccoId
        });
      });
  });

  router.put("status/:saccoId", (req, res) => {
    Sacco.findByIdAndUpdate(
      { _id: req.params.saccoId },
      {
        status: req.body.status
      },
      { new: true }
    )
      .then(sacco => {
        if (!sacco) {
          return res.status(404).send({
            message: "Sacco not found with id " + req.params.saccoId
          });
        }
        res.redirect("/dashboard");
      })
      .catch(err => {
        if (err.kind === "ObjectId") {
          return res.status(404).send({
            message: "Sacco not found with id " + req.params.saccoId
          });
        }
        return res.status(500).send({
          message: "Error updating Sacco with id " + req.params.saccoId
        });
      });
  });

  router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
      successRedirect: "/admin/dashboard",
      failureRedirect: "/admin/login",
      failureFlash: true
    })(req, res, next);
  });

  // Logout
  router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success_msg", "You are logged out");
    res.redirect("/");
  });
};
