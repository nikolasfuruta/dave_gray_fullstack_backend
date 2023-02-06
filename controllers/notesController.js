const Note = require('../models/Note');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

//@desc-get all notes with username
//@method-GET
//@route-/notes
//@acess Private
const getAllNotesWithUsername = asyncHandler(async (req,res) => {
  // Get all notes from MongoDB
  const notes = await Note.find().lean().exec();
  if(!notes.length) return res.status(400).json({message:'No notes found'});

  // Add username to each note before sending the response 
  const notesWithUsername = await Promise.all(notes.map(async (note) => {
    const user = await User.findById(note.user).lean().exec();
    if(!user) return res.status(400).json({message:'Failed to get username'})
    const noteObj = {...note, username: user.username};
    return noteObj
  }));
  
  //get all notes
  res.json(notesWithUsername);
});

//@desc-create new note
//@method-POST
//@route-/notes
//@acess Private
const createNewNote = asyncHandler(async (req,res) => {
  const { user,title,text,completed } = req.body;
  
  //check datas
  if(![user,title,text].every(Boolean)) return res.status(400).json({message:"All fields are required"});

  //check for duplicate
  const isDuplicate = await Note.findOne({title}).lean().exec();
  if(isDuplicate) return res.status(409).json({message:'Duplicate title'});

  //create and store note
  const noteObj = {user,title,text,completed};
  const isNoteCreated = await Note.create(noteObj);
  if(isNoteCreated) res.status(201).json({message:`Note ${title} created`});
  else res.status(400).json({message:'Invalid note data received'});
});

//@desc-update note
//@method-PATCH
//@route-/notes
//@acess Private
const updateNote = asyncHandler(async (req,res) => {
  const { id,user,title,text,completed } = req.body;

  //check data
  if(![id,user,title,text].every(Boolean) || typeof completed !== 'boolean') return res.status(409).json({message:'All fields are required'});

  // Confirm note exists to update
  const note = await Note.findById(id).lean().exec();
  if(!note) return res.status(400).json({message:'Note not found'});

  //check for duplicate title
  const isDuplicate = await Note.findOne({title}).lean().exec();
  if(isDuplicate && isDuplicate._id.toString() !== id) return res.status(409).json({message:'Duplicate title'});

  //update note
  const updatedNote = await Note.updateOne({id,user,title,text,completed}).lean().exec();
  if(updatedNote.ok===0) res.status(400).json({message:'Failed to update'});
  else res.status(200).json({message:`Note ${title} with ID ${id} updated`});
});

//@desc-delete note
//@method-DELETE
//@route-/notes
//@acess Private
const deleteNote = asyncHandler(async (req,res) => {
  const {id} = req.body;
  if(!id) return res.status(400).json({message:'ID required'});

  //check if note exist
  const note = await Note.findById(id).lean().exec();
  if(!note) return res.status(400).json({message:'Note not found'});
  
  //delete
  const result = await Note.deleteOne({_id:id})
  if(result.ok === 0) return res.status(400).json({message:`Failed to delete note with ID ${id}`});
  res.json({message:`Note with ID ${id} deleted` })
});

module.exports = {
  getAllNotesWithUsername,
  createNewNote,
  updateNote,
  deleteNote,
}