const jwt = require('jsonwebtoken');

const verifyJwt = (req, res, next) => {
	//check if header contains authorization
	const authHeader = req.headers.authorization || req.headers.Authorization;
  if(!authHeader?.startsWith('Bearer ')){//Bearer ...token 
    return res.status(401).json({ message: 'Unauthorized' });
  }

  //get access token
  const token = authHeader.split(' ')[1];//Bearer [...token ]

  //verify token
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded) => {
      //check error
      if(err) return res.status(403).json({ message: 'Forbidden' });
      
      //get token content
      req.user = decoded.UserInfo.username;
      req.roles = decoded.UserInfo.roles;
      next();
    }
  );
};

module.exports = verifyJwt;
