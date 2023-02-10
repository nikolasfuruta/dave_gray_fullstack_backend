const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler( async (req,res) => {
  const { username, password } = req.body;
  //verify received data
  if( !username || !password ) return res.status(400).json({ message: 'All fields are required' });
  
  //check user
  const foundUser = await User.findOne({ username: username }).exec();
  if(!foundUser || !foundUser.active) return res.status(401).json({ message: 'Unauthorized' });

  //check password
  const match = bcrypt.compare(password, foundUser.password);
  if(!match) return res.status(401).json({ message: 'Unauthorized' });

  //create token
  //access token
  const accessToken = jwt.sign(
    {
      "UserInfo": {//content
        "username": foundUser.username,
        "roles": foundUser.roles
      }
    },
      process.env.ACCESS_TOKEN_SECRET,//salt
    { expiresIn: '60s' }//timeLimit
  );

  //refresh token
  const refreshToken = jwt.sign(
    { "username": foundUser.username },//content
    process.env.REFRESH_TOKEN_SECRET,//salt
    { expiresIn: '1d' }//timeLimit
  );

  //create secure cookie with refresh token
  //res.cookie('cookie-name, content, options)
  res.cookie('jwt', refreshToken, {
    httpOnly:true,//accessible only by web token
    secure:true, //https
    sameSite:"none",//cross-site cookie
    maxAge: 7*24*60*60*1000 //coockie expires: set to match refresh token
  });

  //send accessToken
  res.json({ accessToken })
});

// @desc Refresh
// @route GET /auth/refresh
// @access Public
const refresh = asyncHandler( async (req,res) => {
  //check cookie
  const cookies = req.cookies;
  if(!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

  //get cookie`s content
  const refreshToken = cookies.jwt;

  //create access token
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler( async (err, decoded) => {
      //check error
      if(err) return res.status(403).json({ message: 'Forbidden' })

      //check user
      const foundUser = await User.findOne({ username: decoded.username });
      if(!foundUser) return res.status(401).json({ message: 'Unauthorized' })

      //ceate access token
      const accessToken = jwt.sign(
        {
          "UserInfo": {
            "username": foundUser.username,
            "roles": foundUser.roles
          }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '60s' }
      );

      //send access token
      res.json({ accessToken });
    })
  );
});

// @desc Logout
// @route POST /auth/logout
// @access Public - clear cookies
const logout = asyncHandler( async (req,res) => {
  //check cookies
  const cookies = req.cookies;
  if(!cookies?.jwt) return res.sendStatus(204); //No content

  //clear cookie
  res.clearCookie('jwt',{
    httpOnly: true,
    secure: true,
    sameSite:'none'
  });

  //return
  res.json({ message: 'Cookie cleared' });

});

module.exports = {
  login,
  refresh,
  logout
};