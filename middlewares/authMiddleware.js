export const requireUser = (req, res, next) => {

  if (!req.session.user) {
      return res.redirect("/login");
  }

  next();
};

export const requireAdmin = (req, res, next) => {

  if (!req.session.admin) {
      return res.redirect("/admin/login");
  }

  next();
};