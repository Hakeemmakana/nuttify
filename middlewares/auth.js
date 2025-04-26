const User = require("../models/userSchema");

const userAuth = (req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user)
      .then((data) => {
        if (data && data.isVerified) {
          return next(); // Allow access
        } else {
          req.session.destroy(() => {
            res.redirect("/"); 
          });
        }
      })
      .catch((error) => {
        console.error("Error in user auth middleware:", error);
        return res.status(500).send("Internal server error");
      });
  } else {
    return res.redirect("/singin"); // Redirect if session doesn't exist
  }
};


const adminAuth = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

module.exports = {
  userAuth,
  adminAuth,
};