const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

//@desc-get all users 
//@route-/users
//@method-GET
//@access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').lean().exec();
  if(!users?.length) return res.status(400).json({message:'No users found'});
  res.json(users)
});

//@desc-create new users 
//@route-/users
//@method-POST
//@access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username,password,roles } = req.body;

  //confirm data
  if(!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({message:"All fields are required"})
  }
  
  //check for duplicate user
  const isDuplicate = await User.findOne({ username }).lean().exec();
  if(isDuplicate) return res.status(409).json({message:'Duplicate username'});
  
  //hash password
  const hashedPwd = await bcrypt.hash(password,10);
  const userObj = {username, 'password':hashedPwd, roles}

  //create and store new user
  const isUserCreated = await User.create(userObj);
  if(isUserCreated) res.status(201).json({message:`User ${username} created`});
  else res.status(400).json({message:'Invalid user data received'});
});

//@desc-update a users 
//@route-/users
//@method-PATCH
//@access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id,username,roles,active,password } = req.body;

  //confirm data
  if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
    return res.status(400).json({message:"All fields are required"})
  }

  //check if user exist
  const user = await User.findById(id).exec();
  if(!user) return res.status(400).json({message:'User not found'});
  
  //check for duplicate username on DB
  const duplicate = await User.findOne({ username }).lean().exec();
  //allow update to the original user
  if(duplicate && duplicate?._id.toString() !== id) return res.status(409).json({message:'Duplicate username'});
  
  //update
  user.username = username;
  user.roles = roles;
  user.active = active;
  if(password) {
    //hash pwd
    user.password = await bcrypt.hash(password,10);
  }
  const updatedUser = await user.save();

  res.json({message:`${updatedUser.username} updated`});
});

//@desc-delete a users 
//@route-/users
//@method-DELETE
//@access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  //check data
  if(!id) return res.status(400).json({message:'User ID required'});

  //check is there are notes related to user
  const note = await Note.findOne({ user: id }).lean().exec();
  if(note) return res.status(400).json({message:'User has assigned notes'});

  //find user
  const user = await User.findById(id).exec();
  if(!user) return res.status(400).json({message:'User not found'});

  //delete
  const result = await user.deleteOne();
  const reply = `Username ${result.username} with ID ${result._id} deleted`;
  res.json(reply);
})

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser, 
  deleteUser
}