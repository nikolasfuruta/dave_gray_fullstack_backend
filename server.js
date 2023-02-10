require('dotenv').config();
const express = require('express');
const path = require('path');
const { logger,logEvents } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const connectDb = require('./config/dbConn');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3500;

connectDb();

app.use(logger); 
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/', require('./routes/root'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/notes', require('./routes/noteRoutes'));

app.all('*', (req,res)=>{
  res.status(404)
  req.accepts('html') ? res.sendFile(path.join(__dirname,'views','404.html'))
  : req.accepts('json') ? res.json({message: '404 not found'})
  : res.type('txt').send('404 not found')
})

app.use(errorHandler);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
  });
})

mongoose.connection.on('error', err => {
  console.log(err);
  logEvents(
    `${err.no}\t${err.code}\t${req.syscall}\t${err.hostname}`,
    'mongoErrLog.log'
  );
})