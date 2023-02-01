const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');

router.route('/')
  .get(notesController.getAllNotes)
  .post(notesController.createNewNote)
  .patch(notesController.updateNote)
  .delete(notesController.deleteNote)

router.route('/username')
  .get(notesController.getAllNotesWithUsername)

module.exports = router;