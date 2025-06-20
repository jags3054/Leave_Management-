// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (allowedRoles = []) {
  return function (req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token);
    console.log('JWT_SECRET used for verification:', process.env.JWT_SECRET);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      next();
    } catch (err) {
      console.error('Auth error:', err.message);
      return res.status(401).json({ message: 'Token is not valid' });
    }
  };
};
