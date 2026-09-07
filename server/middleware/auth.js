import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token",
      });
    }

    // Accept "Bearer <token>" (standard) — fall back to a bare token
    // for any older clients that haven't been updated yet.
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};

export default auth;