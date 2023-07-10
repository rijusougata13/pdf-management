const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const http = require('http');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const socketIO = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());
const server = http.createServer(app);

const io =socketIO(server, {
  cors: {
      origin: "http://localhost:3000",
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});



// Connect to MongoDB
mongoose.connect('mongodb+srv://rijusougata13:mongodb1234@realmcluster.22swx.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define PDF model
const PdfSchema = new mongoose.Schema({
    filename: String,
    path: String,
    sharedWith: [String],
    uploadedBy: String,
    open:Boolean,
    comments: [{
        username: String,
        comment: String,
    }],
  });
  
const Pdf = mongoose.model('Pdf', PdfSchema);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// API endpoints

// Upload a PDF
app.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
      const { filename, path } = req.file;
      const sharedWith = req.body.sharedWith || [];
      const uploadedBy = req.body.username; // Get the username from the authenticated user
        console.log(uploadedBy);
      const pdf = new Pdf({
        filename,
        path,
        sharedWith,
        uploadedBy, 
        open:false,// Set the uploadedBy field
      });
  
      await pdf.save();
  
      res.status(200).json({ message: 'PDF uploaded successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to upload PDF' });
    }
  });

// Get all PDFs
app.get('/pdfs', async (req, res) => {
  try {
    const pdfs = await Pdf.find();
    res.status(200).json(pdfs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve PDFs' });
  }
});

app.post('/userPdfs', async (req, res) => {
  try {
    const pdfs = await Pdf.find({uploadedBy:req.body.email});
    res.status(200).json(pdfs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve PDFs' });
  }
});

// Get a specific PDF by ID
app.get('/pdfs/:id', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      res.status(404).json({ message: 'PDF not found' });
    } else {
      res.status(200).json(pdf);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve PDF' });
  }
});

// edit pdfs in mongodb 
app.put('/pdfs/:id',async(req,res)=>{
    try{
        await Pdf.findOneAndUpdate({_id:req.params.id}, req.body);
        res.status(200).json({success:true});
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update PDF' });
      }
})

app.get('/pdfs/:id/file', async (req, res) => {

    try {
      const pdf = await Pdf.findById(req.params.id);
      if (!pdf) {
        res.status(404).json({ message: 'PDF not found' });
      } else {
        const filePath = path.join(__dirname, pdf.path);
        res.sendFile(filePath);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve PDF file' });
    }
  });
// Share a PDF with other users
app.post('/pdfs/:id/share', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      res.status(404).json({ message: 'PDF not found' });
    } else {
      const { sharedWith } = req.body;
      pdf.sharedWith = sharedWith;
      await pdf.save();
      res.status(200).json({ message: 'PDF shared successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to share PDF' });
  }
});

// Add a comment to a PDF
app.post('/pdfs/:id/comments', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
Continuation:

    if (!pdf) {
      res.status(404).json({ message: 'PDF not found' });
    } else {
      const { username, comment } = req.body;
      pdf.comments.push({ username, comment });
      await pdf.save();
      io.emit('newComment', { pdfId: req.params.id, comment: { username, comment } });
      res.status(200).json({ message: 'Comment added successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Define User model
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
  });
  
  const User = mongoose.model('TestUser', UserSchema);
  
  // Register a new user
  app.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
        
      console.log("username: " + username + " password: " + password);
      // Check if the username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: 'Username is already taken' });
      }
  
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Create a new user
      const user = new User({
        username,
        password: hashedPassword,
      });
  
      await user.save();
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to register user' });
    }
  });
  
  // Login with username and password
  app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Find the user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Compare the provided password with the stored hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Generate a JWT token
      const token = jwt.sign({ userId: user._id }, 'secret-key');
  
      res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to login' });
    }
  });

// Start the server
server.listen(5000, () => {
  console.log('Server is running on port 5000');
  
});
