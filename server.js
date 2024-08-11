const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const app = express();
const { ObjectId } = require('mongodb');
const PORT = process.env.PORT || 5002;
const cloudinaryService = require('./services/CloudinaryServices'); // Adjust the path as necessary
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const axios = require('axios');
const { ok } = require("assert");
const cron = require('node-cron');
const moment = require('moment-timezone');


const storage = multer.memoryStorage();
const upload = multer({ storage });


const corsOptions = {
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'] // Add other headers as needed
};

// https://layla-restaurant.netlify.app
 

app.use(cors(corsOptions))

const server = http.createServer(app);

// Create a WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });


const nodemailer = require('nodemailer');

let clients = [];

wss.on('connection', function connection(ws) {

  // Add the new client to the list of clients
  clients.push(ws);

  // Log if it's a new client
  console.log('Client connected. Total clients:', clients.length);

  ws.on('close', function () {
    // Remove the disconnected client from the list of clients
    clients = clients.filter(client => client !== ws);

    // Log if it was the last client
    console.log('Client disconnected. Total clients:', clients.length);
  });

  // Handle messages from clients (if needed)
  ws.on('message', function incoming(message) {
      console.log('Received:', message);
    });  
});


function broadcastCartUpdated() {
  console.log('Broadcasting cartUpdated');
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'cartUpdated' }));
    }
  });
}

function broadcastFavoritesUpdated() {
  console.log('Broadcasting favoritesUpdated');
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'favoritesUpdated' }));
    }
  });
}

function broadcastNewOrderReceived(restaurantName) {
  console.log('Broadcasting newOrderReceived for restaurant:', restaurantName);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'newOrderReceived', restaurantName: restaurantName }));
    }
  });
}



app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


app.use(express.json());

app.get('/api/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});


app.get("/", (req, res) => {
  res.send(process.env.MONGO_URI);
});


// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("MongoDb connected"))
//   .catch((error) => console.log(error));

async function connectToMongoDB() {
  try {
      await mongoose.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true
      });
      console.log('MongoDB connected successfully');

      // Add event listeners for the mongoose connection
      mongoose.connection.on('connected', () => {
          console.log('Mongoose connected to ' + process.env.MONGO_URI);
      });

      mongoose.connection.on('error', (err) => {
          console.log('Mongoose connection error: ' + err);
      });

      mongoose.connection.on('disconnected', () => {
          console.log('Mongoose disconnected');
      });

      // If the Node process ends, close the Mongoose connection
      process.on('SIGINT', async () => {
          await mongoose.connection.close();
          console.log('Mongoose disconnected on app termination');
          process.exit(0);
      });
  } catch (err) {
      console.error('MongoDB connection error:', err);
      process.exit(1); // Exit the process with failure
  }
}

// Call the function to initiate the connection
connectToMongoDB();

  server.listen(PORT, () => console.log(`listening at ${PORT}`));


// Middleware to refresh JWT token before expiration
const refreshAuthToken = (req, res, next) => {

  const authorizationHeader = req.headers.authorization;


  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Bearer token not provided" });
  }

  const token = authorizationHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {

      if (err.name === 'TokenExpiredError') {
        const newToken = generateToken(decoded.userId);
        res.setHeader('Authorization', `Bearer ${newToken}`);
      } else {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }
    } else {

      req.userId = decoded.userId;
    }
    next();
  });
};

// app.use(refreshAuthToken);




// Middleware to authenticate user with JWT token
const authenticateUser = (req, res, next) => {
  // Get token from request headers
  const authorizationHeader = req.headers.authorization;

  // Check if authorization header is provided
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Bearer token not provided" });
  }

  // Extract token from authorization header
  const token = authorizationHeader.split(' ')[1];

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    // If token is valid, attach decoded data to request object
    req.userId = decoded.userId;
    next(); // Proceed to the next middleware or route handler
  });
};


// Function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};




require("./ownerDetails");
const Ownerr = mongoose.model("OwnerInfo");


// app.post("/login-owner", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const owner = await Ownerr.findOne({ email });
//     if (!owner) {
//       return res.json({ error: "User not found" });
//     }

//     const isPasswordValid = await bcrypt.compare(password, owner.password);
//     if (!isPasswordValid) {
//       return res.json({ error: "Invalid password" });
//     }

//     // Find the restaurant with the restaurant name of the owner
//     const restaurant = await Restaurant.findOne({ restaurantName: owner.firstname });
//     if (!restaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     const token = generateToken(owner._id);

//     return res.json({ status: "ok", id: owner._id, token, resName: owner.firstname, restaurantId: restaurant._id, name: owner.firstname + " " + owner.lastname });
//   } catch (e) {
//     return res.json({ status: e.message });
//   }
// });


const SliderImageSchema = new mongoose.Schema({
  title: {
      type: String,
      required: false
  },
  url:{
    type: String,
    required: false
  },
  imageUrl: {
      type: String,
      required: true
  }
});

const SliderImage = mongoose.model('SliderImage', SliderImageSchema);


app.post('/addImage' , upload.single('carouselImage'), async (req, res) => {
  try {
      const { title,url } = req.body;
      const carouselImage = req.file;
    let imageUrl = null;
    if (carouselImage) {
      const result = await cloudinaryService.addImage(carouselImage.buffer);
      imageUrl = result.secure_url;
    }

      const newSliderImage = new SliderImage({
          title,
          url,
          imageUrl
      });

      await newSliderImage.save();
      res.status(201).json(newSliderImage);
  } catch (error) {
      res.status(400).json({ message: 'Error creating slider image', error });
  }
});

// Get all slider images
app.get('/allImages', async (req, res) => {
  try {
      const sliderImages = await SliderImage.find();
      res.status(200).json(sliderImages);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching slider images', error });
  }
});

app.put('/image/:id', upload.single('carouselImage'), async (req, res) => {
  try {
    const { title,url } = req.body;
    const carouselImage = req.file;
    
    let carousel = await SliderImage.findById(req.params.id);
    if (!carousel) {
      return res.status(404).json({ message: 'Slider image not found' });
    }

    let imageUrl = carousel.imageUrl;  // Initialize imageUrl with existing URL

    if (carouselImage) {
      try {
        // Extract the public ID from the existing image URL
        const existingImageUrl = carousel.imageUrl;
        const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|webp)$/;
        const match = existingImageUrl.match(regex);
        let publicId = null;

        if (match) {
          publicId = match[1]; // Extract the public ID
        }

        if (publicId) {
          // Update the image on Cloudinary
          const updatedImage = await cloudinaryService.updateImage(publicId, carouselImage.buffer);
          imageUrl = updatedImage.secure_url;
        } else {
          // Upload a new image to Cloudinary
          const result = await cloudinaryService.addImage(carouselImage.buffer);
          imageUrl = result.secure_url;
        }
      } catch (error) {
        console.error('Error updating image:', error);
        return res.status(500).json({ error: "Error updating image" });
      }
    }

    // Update only the provided fields
    const updateData = {};
    if (title) updateData.title = title;
    if (url) updateData.url = url;
    if (imageUrl) updateData.imageUrl = imageUrl;

    const updatedSliderImage = await SliderImage.findByIdAndUpdate(
      req.params.id,
      updateData,  // Update with conditional fields
      { new: true }
    );

    res.status(200).json(updatedSliderImage);
  } catch (error) {
    res.status(500).json({ message: 'Error updating slider image', error });
  }
});

// Delete a slider image by ID
app.delete('/image/:id', async (req, res) => {
  try {
    // Find the slider image to delete
    const sliderToRemove = await SliderImage.findById(req.params.id);
    if (!sliderToRemove) {
      return res.status(404).json({ message: 'Slider image not found' });
    }

    // Check if there is an image URL to delete
    if (sliderToRemove.imageUrl) {
      try {
        // Extract the public ID from the image URL
        const imageUrl = sliderToRemove.imageUrl;
        console.log('Extracting public ID from image URL:', imageUrl);
        const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|webp)$/;
        const match = imageUrl.match(regex);

        if (match) {
          const publicId = match[1]; // Extract the public ID
          console.log('Public ID:', publicId);

          // Call the deleteImage function
          await cloudinaryService.deleteImage(publicId);
        } else {
          console.log('No public ID found in the image URL');
        }
      } catch (error) {
        console.error('Error extracting public ID or deleting image:', error);
        // Proceed to delete the database record even if the image deletion fails
      }
    }

    // Delete the record from the database
    const deletedSliderImage = await SliderImage.findByIdAndDelete(req.params.id);
    if (!deletedSliderImage) {
      return res.status(404).json({ message: 'Slider image not found' });
    }

    res.status(200).json({ message: 'Slider image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting slider image', error });
  }
});


app.get('/image/:id' ,async (req, res, next) => {
  const { id } = req.params;

  try {
    // Find the image by ID
    const image = await SliderImage.findById(id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Return the image details
    res.json(image);
  } catch (error) {
    console.error('Error fetching image details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post("/login-owner", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find the owner by email
    const owner = await Ownerr.findOne({ email });
    if (!owner) {
      return res.status(404).json({ error: "Owner not found" });
    }

    // Check if the email has been changed
    if (!owner.emailChanged) {
      return res.status(400).json({ error: "Please set your personal email first." });
    }

    // Validate the password
    const isPasswordValid = await bcrypt.compare(password, owner.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Find the restaurant associated with the owner
    const restaurant = await Restaurant.findOne({ restaurantName: owner.firstname });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Generate a token for the owner
    const token = generateToken(owner._id);

    // Return the response with owner and restaurant details
    return res.json({
      status: "ok",
      id: owner._id,
      token,
      resName: owner.firstname,
      restaurantId: restaurant._id,
      name: `${owner.firstname}`
    });
  } catch (e) {
    return res.json({ status: e.message });
  }
});


app.post("/update-owner-email", async (req, res) => {
  const { email } = req.body;
  
  try {
    const owner = await Ownerr.findOne({ email });
    if (!owner) {
      return res.status(404).json({ error: "Owner not found" });
    }

    // Assuming that the new email is also sent in req.body under `newEmail`
    const { newEmail } = req.body;

    if (!newEmail || newEmail === email) {
      return res.status(400).json({ error: "Invalid new email" });
    }

    owner.email = newEmail;
    owner.emailChanged = true;
    await owner.save();

    return res.json({ status: "ok", message: "Email updated successfully" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});


// Get owner by ID
app.get("/owner/:id", authenticateUser, async (req, res) => {
  const ownerId = req.params.id;
  try {
    const owner = await Ownerr.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ error: "Owner not found" });
    }
    // If owner found, return owner details
    return res.json({ id: owner._id });
  } catch (error) {
    // Handle errors
    return res.status(500).json({ error: error.message });
  }
});


//client
require("./clientDetails");
const Clientt = mongoose.model("ClientInfo");

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit code
};



// Register client endpoint
app.post("/register-client", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  try {
    // Check if a client with the provided email already exists
    const oldClient = await Clientt.findOne({ email });
    if (oldClient) {
      return res.status(400).send({
        error: "User with the same email address already exists",
      });
    }

    const verificationCode = generateVerificationCode(); // Generate verification code
    const encryptedPassword = await bcrypt.hash(password, 10); // Encrypt password

    // Save user details and verification code to the database
    const newClient = await Clientt.create({
      firstname,
      lastname,
      email,
      password: encryptedPassword,
      verificationCode, // Save verification code
      verificationCodeExpires: Date.now() + 30 * 60 * 1000, // Set expiration time (30 minutes)
    });

    // Send verification code to the user's email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: 'help.layla.restaurant@gmail.com', // Your Gmail email address
        pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password
      }
    });

    // Configure email options
    const mailOptions = {
      from: 'YazanResturant@gmail.com',
      to: email,
      subject: 'Account Verification',
      text: `Hello, Your verification code is: ${verificationCode}. Please use this code to complete your registration. It will expire in 30 minutes. If you didn't initiate this request, please ignore this message. Thank you, Layla Security Team.`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to send verification code' });
      } else {
        res.json({ message: 'Verification code sent successfully' });
      }
    });

    return res.send({ status: "ok", message: "Verification code sent to your email" });
  } catch (error) {
    return res.send({ error: error.message });
  }
});

// Verify code endpoint
app.post("/verify-code/:email", async (req, res) => {
  const { verificationCode } = req.body;
  const { email } = req.params;

  try {
    const client = await Clientt.findOne({ email });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    if (client.verificationCode !== verificationCode) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    if (client.verificationCodeExpires < Date.now()) {
      return res.status(402).json({ error: "Verification code has expired" });
    }

    // Update isCodeVerified field to true
    client.isCodeVerified = true;
    await client.save();

    // Generate JWT token for the verified client
    const token = jwt.sign({ userId: client._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Clear verification code and expiration
    client.verificationCode = undefined;
    client.verificationCodeExpires = undefined;
    await client.save();

    return res.send({ status: "ok", token });
  } catch (error) {
    return res.send({ error: error.message });
  }
});


// Resend verification code endpoint
app.post("/resend-verification-code", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the client with the provided email
    const client = await Clientt.findOne({ email });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Generate a new verification code
    const verificationCode = generateVerificationCode();

    // Update the client's verification code and expiration
    client.verificationCode = verificationCode;
    client.verificationCodeExpires = Date.now() + 30 * 60 * 1000; // Set expiration time (30 minutes)
    await client.save();

    // Send the new verification code to the user's email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: 'help.layla.restaurant@gmail.com', // Your Gmail email address
        pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password
      }
    });

    // Configure email options
    const mailOptions = {
      from: 'YazanResturant@gmail.com',
      to: email,
      subject: 'New Verification Code',
      text: `Hello, Your new verification code is: ${verificationCode}. Please use this code to complete your registration. It will expire in 30 minutes. If you didn't initiate this request, please ignore this message. Thank you, Layla Security Team.`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to send verification code' });
      } else {
        res.json({ message: 'New verification code sent successfully' });
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});



//login for the res owner

app.post("/login-client", async (req, res) => {
  const { email, password } = req.body;
  try {
    const client = await Clientt.findOne({ email });
    if (!client) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if verification code is verified
    if (!client.isCodeVerified) {
      return res.status(403).json({ error: "Verification code is not verified. Please verify your code first." });
    }

    const isPasswordValid = await bcrypt.compare(password, client.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update isLoggedIn field
    await Clientt.updateOne({ email }, { isLoggedIn: true });

    // Generate JWT token
    const token = generateToken(client._id);

    // Send token in response
    return res.status(200).json({ status: "ok", token, userId: client._id, name: client.firstname + " " + client.lastname });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});




app.post('/check-email-exists', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if a client with the provided email already exists
    const existingClient = await Clientt.findOne({ email });
    if (existingClient) {
      return res.status(200).json({ exists: true });
    }

    // If no client with the email exists
    return res.status(200).json({ exists: false });
  } catch (error) {
    // If an error occurs
    return res.status(500).json({ error: error.message });
  }
});

//admin processing
app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = generateToken(process.env.ADMIN_EMAIL);
    return res.json({ status: "ok", message: "Admin authenticated successfully", token });
  } else {
    return res.status(401).json({ error: "Invalid credentials" });
  }
});



// Define middleware function to check admin authentication
const authenticateAdmin = (req, res, next) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    return res.status(401).json({ error: "Unauthorized: Admin credentials required" });
  }
};

// heeere wee generate a random password
const generateRandomPassword = () => {
  // Generate a random string of 8 characters
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

// const Dish = mongoose.model("DishInfo");
// const MenuCategory = mongoose.model("MenuCategory");

// Middleware to add restaurant owner after adding a restaurant
const addRestaurantOwner = async (req, res, next) => {
  const { restaurantName } = req.body;

  try {
    const existingOwner = await Ownerr.findOne({ firstname: restaurantName });
    if (existingOwner) {
      return res.status(400).json({ error: "Owner with this restaurant name already exists" });
    }

    const password = generateRandomPassword();

    const email = `${restaurantName.replace(/\s+/g, '')}@layla.com`;

    const encryptedPassword = await bcrypt.hash(password, 10);

    // Create admin user for the restaurant
    const owner = new Ownerr({
      firstname: restaurantName,
      lastname: "Owner",
      email,
      emailChanged:false,
      password: encryptedPassword,
    });

    await owner.save();

    req.generatedEmail = email;
    req.generatedPassword = password;

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const favoriteSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  }
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;




// Define Dish Schema
const DishSchema = new mongoose.Schema({
  name: String,
  price: Number,
  dishImage: String,
  description: String,
  extras: {
    requiredExtras: {
      type: [{
        name: String,
        price: Number,
     
      }],
      default: []
    },
    optionalExtras: {
      type: [{
        name: String,
        price: Number
      }],
      default: []
    }
  }
});



// Define Menu Category Schema
// Define Menu Category Schema
const MenuCategorySchema = new mongoose.Schema({
  categoryName: String,
  categoryImage: String,
  dishes: [{
    name: String,
    price: Number,
    dishImage: String,
    description: String,
    extras: {
      requiredExtras: {
        type: [{
          name: String,
          price: Number,
       
        }],
        default: []
      },
      optionalExtras: {
        type: [{
          name: String,
          price: Number
        }],
        default: []
      }
    }
  }]
});





// Define Restaurant Schema
const RestaurantsSchema = new mongoose.Schema({
  restaurantName: { type: String, required: true },

  picture: { type: String, required: true },
  location: { type: String },
  coordinates: {
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false }
  },
  menu: [MenuCategorySchema],
  generatedEmail: { type: String},
  generatedPassword: { type: String},
  openingHours: {
    sunday: {
      open: { type: String, default: "00:00" }, // Default to midnight if not specified
      close: { type: String, default: "00:00" } // Default to midnight if not specified
    },
    monday: {
      open: { type: String, default: "00:00" },
      close: { type: String, default: "00:00" }
    },
    tuesday: {
      open: { type: String, default: "00:00" },
      close: { type: String, default: "00:00" }
    },
    wednesday: {
      open: { type: String, default: "00:00" },
      close: { type: String, default: "00:00" }
    },
    thursday: {
      open: { type: String, default: "00:00" },
      close: { type: String, default: "00:00" }
    },
    friday: {
      open: { type: String, default: "00:00" },
      close: { type: String, default: "00:00" }
    },
    saturday: {
      open: { type: String, default: "00:00" },
      close: { type: String, default: "00:00" }
    }
  },
  // Status of the restaurant (open, close, busy, etc.)
  status: { type: String, enum: ['open', 'closed', 'busy'], default: 'open' }
}, {
  collection: "restaurantInfo"
});

const Restaurant = mongoose.model("RestaurantInfo", RestaurantsSchema);


// Create Dish model
const Dish = mongoose.model("Dish", DishSchema);

// Create Menu Category model
// const MenuCategory = mongoose.model("MenuCategory"\, MenuCategorySchema);
const MenuCategory = mongoose.model("MenuCategory", MenuCategorySchema);





const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

console.log('Server timezone: ' + serverTimezone);

cron.schedule('*/3 * * * *', async () => {
  try {
    // Get the current time in the server's timezone
    const currentTime = moment().tz(serverTimezone);

    // Get the current day and time (hour and minute)
    const currentDay = currentTime.format("dddd").toLowerCase();
    const currentHour = currentTime.hour();
    const currentMinute = currentTime.minute();

    console.log('Current Time', currentTime.format('HH:mm'));
    console.log('Current Hour', currentHour);
    console.log('Current Minute', currentMinute);
    console.log('Current Day', currentDay);

    // Find all restaurants
    const restaurants = await Restaurant.find();

    // Loop through each restaurant
    for (const restaurant of restaurants) {
      // Check if the restaurant has opening hours for the current day
      const openingHours = restaurant.openingHours[currentDay];

      if (openingHours) {
        // Extract the open and close hours
        const { open, close } = openingHours;

        // Convert opening and closing hours to numerical values for comparison
        const [openHour, openMinute] = open.split(":").map(Number);
        const [closeHour, closeMinute] = close.split(":").map(Number);


        // Check if the restaurant is already marked as busy
        if (restaurant.status === 'busy') {
          console.log(`Restaurant ${restaurant.restaurantName} is already busy.`);
          continue; // Skip to the next restaurant
        }

        // Determine if the current time is within the opening hours
        const isOpen = 
          (currentHour > openHour || (currentHour === openHour && currentMinute >= openMinute)) &&
          (currentHour < closeHour || (currentHour === closeHour && currentMinute <= closeMinute));

        // Update the status based on the current time
        if (isOpen) {
          if (restaurant.status !== 'open') {
            restaurant.status = 'open';
            await restaurant.save();
            console.log(`Restaurant ${restaurant.restaurantName} is now open.`);
          }
        } else {
          if (restaurant.status !== 'closed') {
            restaurant.status = 'closed';
            await restaurant.save();
            console.log(`Restaurant ${restaurant.restaurantName} is now closed.`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating restaurant statuses:', error);
  }
});




// API endpoint to change restaurant status to "busy"
app.put("/change-restaurant-status/:restaurantName/:status", async (req, res) => {
  const { restaurantName, status } = req.params;
  const currentTime = moment().tz(serverTimezone);

  let currentDay = currentTime.format("dddd");
  currentDay = currentDay.toLowerCase();
  console.log(currentDay);
  try {
    // Find the restaurant by name
    const restaurant = await Restaurant.findOne({ restaurantName });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Change status to "busy"
    restaurant.status = status;
    await restaurant.save();

    return res.status(200).json({ message: `Restaurant status changed to ${status}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// Define a route to retrieve the status of a restaurant
app.get("/restaurant-status/:restaurantName", async (req, res) => {
  const { restaurantName } = req.params;

  try {
    // Find the restaurant by name
    const restaurant = await Restaurant.findOne({ restaurantName });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Extract and return the status of the restaurant
    const { status,coordinates } = restaurant;
    return res.status(200).json({ status,coordinates});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/all-restaurant-status", async (req, res) => {
  try {
    // Find all restaurants
    const restaurants = await Restaurant.find();

    if (!restaurants || restaurants.length === 0) {
      return res.status(404).json({ error: "Restaurants not found" });
    }

    // Extract and return the status of each restaurant
    const restaurantStatuses = restaurants.map(restaurant => ({
      restaurantName: restaurant.restaurantName,
      status: restaurant.status
    }));

    return res.status(200).json(restaurantStatuses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



// Define a route to update the opening hours and status of a restaurant for any day
app.put("/update-opening-hours/:restaurantName/:day", async (req, res) => {
  const { restaurantName, day } = req.params;
  const { open, close } = req.body;

  // Define array of valid day values
  const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Check if the provided day is a valid day
  if (!validDays.includes(day)) {
    return res.status(400).json({ error: "Invalid day value" });
  }

  try {
    // Find the restaurant by name
    const restaurant = await Restaurant.findOne({ restaurantName });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Update the opening hours for the specified day
    restaurant.openingHours[day] = { open, close };

    // Save the updated restaurant document
    await restaurant.save();

    return res.status(200).json({ message: `Opening hours for ${day} updated successfully` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/opening-hours/:restaurantName", async (req, res) => {
  const { restaurantName } = req.params;

  try {
    // Find the restaurant by name
    const restaurant = await Restaurant.findOne({ restaurantName });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Return the opening hours for the restaurant
    return res.status(200).json({ openingHours: restaurant.openingHours });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});




// Route to add a new restaurant
// app.post("/add-restaurant", upload.single('picture'), addRestaurantOwner, async (req, res) => {
//   const { restaurantName, location} = req.body;

//   try {
//     const existingRestaurant = await Restaurant.findOne({ restaurantName });
//     if (existingRestaurant) {
//       return res.status(400).json({ error: "Restaurant with the same name already exists" });
//     }

//     // Upload picture to Cloudinary
//     let pictureUrl;
//     if (req.file) {
//       const result = await cloudinaryService.addImage(req.file.buffer);
//       pictureUrl = result.secure_url;
//     }

//     // Fetch coordinates using Google Maps Geocoding API
//     // const geocodingResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=your-api-here`);
//     // console.log(geocodingResponse.data);
//     // const { results } = geocodingResponse.data;
//     // const coordinates = results[0].geometry.location;

//     // let menuCategories = [];
//     // if (menu) {
//     //   menuCategories = await Promise.all(menu.map(async categoryData => {
//     //     const dishes = await Promise.all(categoryData.dishes.map(async dishData => {
//     //       const dish = new Dish({
//     //         name: dishData.name,
//     //         price: dishData.price,
//     //         dishImage: dishData.dishImage,
//     //         description: dishData.description,
//     //         extras: {
//     //           requiredExtras: dishData.requiredExtras,
//     //           optionalExtras: dishData.optionalExtras
//     //         }
//     //       });

//     //       await dish.save();
//     //       return dish;
//     //     }));

//     //     const menuCategory = new MenuCategory({
//     //       categoryName: categoryData.categoryName,
//     //       dishes
//     //     });

//     //     await menuCategory.save();
//     //     return menuCategory;
//     //   }));
//     // }

//     const newRestaurant = new Restaurant({
//       restaurantName,
//       picture: pictureUrl,
//       location,
//       coordinates: {
//         latitude: '78', // Replace with actual coordinates
//         longitude: '68' // Replace with actual coordinates
//       },
//       // menu: menuCategories.length > 0 ? menuCategories : undefined,
//       generatedEmail: req.generatedEmail,
//       generatedPassword: req.generatedPassword
//     });

//     // Save the new restaurant to the database
//     await newRestaurant.save();

//     return res.status(201).json({
//       status: "ok",
//       message: "Restaurant added successfully",
//       generatedEmail: req.generatedEmail,
//       generatedPassword: req.generatedPassword
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });


const addRestaurant = async (req, res, next) => {
  const { restaurantName, location } = req.body;

  try {
    const existingRestaurant = await Restaurant.findOne({ restaurantName });
    if (existingRestaurant) {
      return res.status(400).json({ error: "Restaurant with the same name already exists" });
    }

    // Upload picture to Cloudinary
    let pictureUrl;
    if (req.file) {
      const result = await cloudinaryService.addImage(req.file.buffer);
      pictureUrl = result.secure_url;
    }

    const newRestaurant = new Restaurant({
      restaurantName,
      picture: pictureUrl,
      location,
      coordinates: {
        latitude: '78', // Replace with actual coordinates
        longitude: '68' // Replace with actual coordinates
      }
    });

    // Save the new restaurant to the database
    await newRestaurant.save();

    req.newRestaurant = newRestaurant;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const handleSuccessResponse = (req, res) => {
  const { newRestaurant } = req;
  const { generatedEmail, generatedPassword } = req;

  return res.status(201).json({
    status: "ok",
    message: "Restaurant added successfully",
    restaurant: newRestaurant,
    generatedEmail,
    generatedPassword
  });
};

app.post(
  "/add-restaurant",
  upload.single('picture'),
  addRestaurant,
  addRestaurantOwner,
  handleSuccessResponse
);



app.post("/add-to-favorites/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { restaurantName } = req.body;
    const existingFavorite = await Favorite.findOne({ restaurantName, customerId });
    if (existingFavorite) {
      return res.status(400).json({ error: "Restaurant already in favorites" });
    }
    const favorite = new Favorite({ customerId, restaurantName });
    await favorite.save();
    broadcastFavoritesUpdated();

    res.status(201).send(favorite);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/favorites/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const favorites = await Favorite.find({ customerId });
    res.send(favorites);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.delete("/remove-from-favorites/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { restaurantName } = req.body;
    await Favorite.findOneAndDelete({ customerId, restaurantName }); // Use an object to specify the query
    res.status(201).send({ message: "Favorite removed successfully" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});





//update restaurant
// Route to update a restaurant
// app.put("/update-restaurant/:resName", async (req, res) => {
//   const { resName } = req.params;
//   const { newRestaurantName, newBase64Image, newLocation, newMenu } = req.body;

//   try {
//     // Find the restaurant by name
//     let restaurant = await Restaurant.findOne({ restaurantName: resName });
//     if (!restaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     // Update the restaurant details
//     if (newRestaurantName) {
//       restaurant.restaurantName = newRestaurantName;

//       // Update the owner's firstname with the new restaurant name
//       const owner = await Ownerr.findOneAndUpdate(
//         { firstname: resName }, // Query to find the owner by the current restaurant name
//         { firstname: newRestaurantName }, // Update the owner's firstname with the new restaurant name
//         { new: true } // To return the updated document
//       );
//     }
//     if (newBase64Image) {
//       restaurant.picture = newBase64Image;
//     }
//     if (newLocation) {
//       restaurant.location = newLocation;
//     }
//     if (newMenu) {
//       // Clear existing menu categories and dishes
//       restaurant.menu = [];

//       // Construct new menu categories with dishes
//       const menuCategories = await Promise.all(newMenu.map(async category => {
//         const dishes = await Promise.all(category.dishes.map(async dishData => {
//           const dishExtras = dishData.extras && dishData.extras.map(extra => ({
//             name: extra.name,
//             price: extra.price
//           }));

//           const dish = new Dish({
//             name: dishData.name,
//             price: dishData.price,
//             dishImage: dishData.dishImage,
//             description: dishData.description,
//             extras: dishExtras
//           });

//           await dish.save();
//           return dish;
//         }));

//         const menuCategory = new MenuCategory({
//           categoryName: category.categoryName,
//           dishes: dishes
//         });
//         await menuCategory.save();

//         return menuCategory;
//       }));

//       restaurant.menu = menuCategories;
//     }

//     // Save the updated restaurant
//     await restaurant.save();

//     return res.status(200).json({ status: "ok", message: "Restaurant updated successfully", resName: newRestaurantName, name: newRestaurantName + " " + "Owner" });
//   } catch (error) {
//     console.error("Error updating restaurant:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.put("/update-restaurant/:resName", upload.single('restaurantImage'), async (req, res) => {
  const { resName } = req.params;
  const { newRestaurantName, newLocation } = req.body;
  const restaurantImage = req.file ? req.file.buffer : null;

  try {
    // Find the restaurant by name
    let restaurant = await Restaurant.findOne({ restaurantName: resName });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Update the restaurant details
    if (newRestaurantName) {
      restaurant.restaurantName = newRestaurantName;

      // Update the owner's firstname with the new restaurant name
      const email = `${newRestaurantName.replace(/\s+/g, '')}@layla.com`;

      await Ownerr.findOneAndUpdate(
        { firstname: resName }, // Query to find the owner by the current restaurant name
        { 
          firstname: newRestaurantName, // Update the owner's firstname with the new restaurant name
        },
        { new: true } // To return the updated document
      );   
      await Favorite.updateMany(
        { restaurantName: resName }, // Match documents with the current restaurant name
        {
          $set: { restaurantName: newRestaurantName } // Update the restaurant name
        },
        { new: true } // Optionally return the modified documents (not necessary with updateMany)
      );   
    }
   

    if (restaurantImage) {
      // Handle image update
      try {
        // Extract the public ID from the existing image URL
        const existingImageUrl = restaurant.picture;
        const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|webp)$/;
        const match = existingImageUrl ? existingImageUrl.match(regex) : null;
        let publicId = null;

        if (match) {
          publicId = match[1]; // Extract the public ID
        }

        if (publicId) {
          // Update the image
          const updatedImage = await cloudinaryService.updateImage(publicId, restaurantImage);
          restaurant.picture = updatedImage.secure_url;
        } else {
          // Upload new image if no public ID found
          const result = await cloudinaryService.addImage(restaurantImage);
          restaurant.picture = result.secure_url;
        }
      } catch (error) {
        console.error('Error updating image:', error);
        return res.status(500).json({ error: "Error updating image" });
      }
    }

    if (newLocation) {
      restaurant.location = newLocation;
    }

    // Save the updated restaurant
    await restaurant.save();

    return res.status(200).json({ status: "ok", message: "Restaurant updated successfully", resName: newRestaurantName || resName });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



// API endpoint to add dishes and menu items to an existing restaurant
// app.post("/add-menu-to-restaurant/:restaurantName", async (req, res) => {
//   const { restaurantName } = req.params;
//   const { menu } = req.body;

//   try {
//     // Find the restaurant by name
//     const existingRestaurant = await Restaurant.findOne({ restaurantName });

//     if (!existingRestaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     // Construct menu categories with dishes
//     const menuCategories = await Promise.all(menu && menu.map(async category => {
//       const dishes = await Promise.all(category.dishes && category.dishes.map(async dishData => {
//         const dishOptionalExtras = dishData.optionalExtras && dishData.optionalExtras.map(optionalExtra => ({
//           name: optionalExtra.name,
//           price: optionalExtra.price
//         }));
//         const dishRequiredExtras = dishData.requiredExtras && dishData.requiredExtras.map(requiredExtra => ({
//           name: requiredExtra.name,
//           price: requiredExtra.price
//         }));

//         const dish = new Dish({
//           name: dishData.name,
//           price: dishData.price,
//           dishImage: dishData.dishImage,
//           description: dishData.description,
//           extras: {
//             requiredExtras: dishRequiredExtras,
//             optionalExtras: dishOptionalExtras,
//           }
//         });

//         await dish.save();
//         return dish;
//       }));

//       const menuCategory = new MenuCategory({
//         categoryName: category.categoryName,
//         dishes: dishes
//       });
//       await menuCategory.save();

//       return menuCategory;
//     }));

//     // Add new menu categories to the existing restaurant
//     existingRestaurant.menu.push(...menuCategories);
//     await existingRestaurant.save();

//     return res.status(201).json({
//       status: "ok",
//       message: "Menu items added to the restaurant successfully"
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });


// app.post("/add-menu-to-restaurant/:restaurantName", async (req, res) => {
//   const { restaurantName } = req.params;
//   const { menu } = req.body;

//   try {
//     // Find the restaurant by name
//     const existingRestaurant = await Restaurant.findOne({ restaurantName });

//     if (!existingRestaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     // Check if menu is provided
//     if (!menu || !Array.isArray(menu)) {
//       return res.status(400).json({ error: "Invalid menu format" });
//     }

//     // Construct menu categories without dishes
//     const menuCategories = await Promise.all(menu.map(async category => {
//       if (!category || !category.categoryName) {
//         // Skip if category or categoryName is not provided
//         return null;
//       }

//       const menuCategory = new MenuCategory({
//         categoryName: category.categoryName,
//         categoryImage: category.categoryImage,
//       });
      
//       await menuCategory.save();
//       return menuCategory;
//     }));

//     // Remove any null values from the array (categories with no valid data)
//     const validMenuCategories = menuCategories.filter(category => category !== null);

//     // Add new menu categories to the existing restaurant
//     existingRestaurant.menu.push(...validMenuCategories);
//     await existingRestaurant.save();

//     return res.status(201).json({
//       status: "ok",
//       message: "Menu categories added to the restaurant successfully"
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });


app.post("/add-menu-to-restaurant/:restaurantName", upload.array('categoryImages'), async (req, res) => {
  const { restaurantName } = req.params;
  let menu;

  try {
    // Parse menu data from request
    if (typeof req.body.menu === 'string') {
      menu = JSON.parse(req.body.menu);
    } else {
      menu = req.body.menu;
    }

    // Find the restaurant by name
    const existingRestaurant = await Restaurant.findOne({ restaurantName });

    if (!existingRestaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Check if menu is provided
    if (!menu || !Array.isArray(menu)) {
      return res.status(400).json({ error: "Invalid menu format" });
    }

    // Construct menu categories with category images
    const menuCategories = await Promise.all(menu.map(async (category, index) => {
      if (!category || !category.categoryName) {
        // Skip if category or categoryName is not provided
        return null;
      }

      // Handle category image upload
      let categoryImageUrl;
      if (req.files && req.files[index]) {
        const result = await cloudinaryService.addImage(req.files[index].buffer);
        categoryImageUrl = result.secure_url;
      }

      const menuCategory = new MenuCategory({
        categoryName: category.categoryName,
        categoryImage: categoryImageUrl
      });

      await menuCategory.save();
      return menuCategory;
    }));

    // Remove any null values from the array (categories with no valid data)
    const validMenuCategories = menuCategories.filter(category => category !== null);

    // Add new menu categories to the existing restaurant
    existingRestaurant.menu.push(...validMenuCategories);
    await existingRestaurant.save();

    return res.status(201).json({
      status: "ok",
      message: "Menu categories added to the restaurant successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update category endpoint
// app.put("/update-category/:restaurantName/:categoryName", async (req, res) => {
//   const { restaurantName, categoryName } = req.params;
//   const { newCategoryName, categoryImage } = req.body;

//   try {
//     console.log('Restaurant Name',restaurantName);
//     console.log('Category Name',categoryName);
//     console.log('New Category Name',newCategoryName);
//     // Find the restaurant by name
//     const existingRestaurant = await Restaurant.findOne({ restaurantName });

//     if (!existingRestaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     // Find the category by name
//     const category = existingRestaurant.menu.find(cat => cat.categoryName === categoryName);

//     if (!category) {
//       return res.status(404).json({ error: "Category not found" });
//     }

//     // Update category details
//     category.categoryName = newCategoryName || category.categoryName;
//     category.categoryImage = categoryImage || category.categoryImage;

//     await existingRestaurant.save();

//     return res.status(200).json({
//       status: "ok",
//       message: "Category updated successfully"
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });


app.put("/update-category/:restaurantName/:categoryName", upload.single('categoryImage'), async (req, res) => {
  const { restaurantName, categoryName } = req.params;
  const { newCategoryName, existingImageUrl } = req.body;

  try {
    console.log('Restaurant Name:', restaurantName);
    console.log('Category Name:', categoryName);
    console.log('New Category Name:', newCategoryName);
    console.log('Existing Image URL:', existingImageUrl);

    // Extract public ID from the existing categoryImage URL if available
    let publicId = null;
    if (existingImageUrl) {
      console.log('Extracting public ID from image URL:', existingImageUrl);
      const regex = /\/v(\d+)\/(.*)\.(\w+)$/;
      const match = existingImageUrl.match(regex);
      if (match) {
        publicId = match[2];
      }
    }

    // Find the restaurant by name
    const existingRestaurant = await Restaurant.findOne({ restaurantName });

    if (!existingRestaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Find the category by name
    const category = existingRestaurant.menu.find(cat => cat.categoryName === categoryName);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Update category details
    category.categoryName = newCategoryName || category.categoryName;

    // Handle category image update if a new file is uploaded
    if (req.file) {
      if (publicId) {
        // Update existing image
        console.log('Public ID:', publicId);
        const result = await cloudinaryService.updateImage(publicId, req.file.buffer);
        category.categoryImage = result.secure_url;
      } else {
        // Add new image
        const result = await cloudinaryService.addImage(req.file.buffer);
        category.categoryImage = result.secure_url;
      }
    }

    await existingRestaurant.save();

    return res.status(200).json({
      status: "ok",
      message: "Category updated successfully",
      categoryImage: category.categoryImage
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// Delete category endpoint
app.delete("/delete-category/:restaurantName/:categoryName", async (req, res) => {
  const { restaurantName, categoryName } = req.params;

  try {
    // Find the restaurant by name
    const existingRestaurant = await Restaurant.findOne({ restaurantName });

    if (!existingRestaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const categoryToDelete = existingRestaurant.menu.find(cat => cat.categoryName === categoryName);

    if (!categoryToDelete) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete the image from Cloudinary
    if (categoryToDelete.categoryImage) { // Ensure the image URL is present
      try {
        // Extract the public ID from the image URL
        const imageUrl = categoryToDelete.categoryImage;
        console.log('Extracting public ID from image URL:', imageUrl);
        const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|webp)$/;
        const match = imageUrl.match(regex);
    
        if (match) {
          const publicId = match[1]; // Extract the public ID
          console.log('Public ID:', publicId);
          
          // Call the deleteImage function
          await cloudinaryService.deleteImage(publicId);
        } else {
          console.log('No public ID found in the image URL');
        }
      } catch (error) {
        console.error('Error extracting public ID or deleting image:', error);
      }
    }
    
    // Find and remove the category by name
    existingRestaurant.menu = existingRestaurant.menu.filter(cat => cat.categoryName !== categoryName);

    await existingRestaurant.save();

    return res.status(200).json({
      status: "ok",
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});




// app.put("/update-dish/:resName/:categoryName/:dishId", authenticateUser, refreshAuthToken, async (req, res) => {
//   const { resName, categoryName, dishId } = req.params;
//   const { name, price, description, dishImage } = req.body;

//   try {
//     // Find the restaurant by name
//     let restaurant = await Restaurant.findOne({ restaurantName: resName });
//     if (!restaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     // Find the menu category by category name
//     let category = restaurant.menu.find((cat) => cat.categoryName === categoryName);
//     if (!category) {
//       return res.status(404).json({ error: "Category not found" });
//     }

//     // Find the dish in the category's dishes array by dish id
//     let dish = category.dishes.id(dishId);
//     if (!dish) {
//       return res.status(404).json({ error: "Dish not found" });
//     }

//     // Update the dish details
//     if (name) {
//       dish.name = name;
//     }
//     if (price) {
//       dish.price = price;
//     }
//     if (description) {
//       dish.description = description;
//     }
//     if (dishImage) {
//       dish.dishImage = dishImage;
//     }

//     // Save the updated restaurant
//     await restaurant.save();

//     return res.status(200).json({ status: "ok", message: "Dish updated successfully", data: dish });
//   } catch (error) {
//     console.error("Error updating dish:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }

// });


app.put("/update-dish/:resName/:categoryName/:dishId", authenticateUser, refreshAuthToken, upload.single('dishImage'), async (req, res) => {
  const { resName, categoryName, dishId } = req.params;
  const { name, price, description } = req.body;
  const dishImage = req.file; // Access the uploaded file from req.file

  try {
    // Find the restaurant by name
    let restaurant = await Restaurant.findOne({ restaurantName: resName });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Find the menu category by category name
    let category = restaurant.menu.find((cat) => cat.categoryName === categoryName);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Find the dish in the category's dishes array by dish id
    let dish = category.dishes.id(dishId);
    if (!dish) {
      return res.status(404).json({ error: "Dish not found" });
    }

    // Update the dish details
    if (name) {
      dish.name = name;
    }
    if (price) {
      dish.price = price;
    }
    if (description) {
      dish.description = description;
    }

    // Handle dish image update
    if (dishImage) {
      try {
        // Extract the public ID from the existing image URL
        const existingImageUrl = dish.dishImage;
        const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|webp)$/;
        const match = existingImageUrl.match(regex);
        let publicId = null;

        if (match) {
          publicId = match[1]; // Extract the public ID
        }

        if (publicId) {
          // Update the image on Cloudinary
          const updatedImage = await cloudinaryService.updateImage(publicId, dishImage.buffer);
          dish.dishImage = updatedImage.secure_url;
        } else {
          // Upload a new image to Cloudinary
          const result = await cloudinaryService.addImage(dishImage.buffer);
          dish.dishImage = result.secure_url;
        }
      } catch (error) {
        console.error('Error updating image:', error);
        return res.status(500).json({ error: "Error updating image" });
      }
    }

    // Save the updated restaurant
    await restaurant.save();

    return res.status(200).json({ status: "ok", message: "Dish updated successfully", data: dish });
  } catch (error) {
    console.error("Error updating dish:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/delete-dish/:resName/:categoryName/:dishId", async (req, res) => {
  const { resName, categoryName, dishId } = req.params;

  try {
    // Find the restaurant by name
    let restaurant = await Restaurant.findOne({ restaurantName: resName });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Find the category by name
    let category = restaurant.menu.find((cat) => cat.categoryName === categoryName);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }


    // Find the dish index in the category's dishes array
    let dishIndex = category.dishes.findIndex((d) => d._id.toString() === dishId);
    if (dishIndex === -1) {
      return res.status(404).json({ error: "Dish not found" });
    }
    const dishToRemove = category.dishes[dishIndex];

    // Delete the dish from the category's dishes array
    category.dishes.splice(dishIndex, 1);

    // Save the updated restaurant
    await restaurant.save();
    if (dishToRemove.dishImage) {
      try {
        // Extract the public ID from the image URL
        const imageUrl = dishToRemove.dishImage
        console.log('Extracting public ID from image URL:', imageUrl);
        const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|webp)$/;
        const match = imageUrl.match(regex);
    
        if (match) {
          const publicId = match[1]; // Extract the public ID
          console.log('Public ID:', publicId);
          
          // Call the deleteImage function
          await cloudinaryService.deleteImage(publicId);
        } else {
          console.log('No public ID found in the image URL');
        }
      } catch (error) {
        console.error('Error extracting public ID or deleting image:', error);
      }
    }

    return res.status(200).json({ status: "ok", message: "Dish deleted successfully" });
  } catch (error) {
    console.error("Error deleting dish:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }

});







// delete restaurant
// Route to delete a restaurant by name
// app.delete("/delete-restaurant/:resName", async (req, res) => {
//   const { resName } = req.params;

//   try {
//     // Find the restaurant by name
//     const restaurant = await Restaurant.findOne({ restaurantName: resName });
//     if (!restaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     // Delete the restaurant
//     await restaurant.remove();

//     // If you have any additional cleanup or cascade delete operations, you can perform them here

//     return res.status(200).json({ status: "ok", message: "Restaurant deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting restaurant:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });


// app.delete("/delete-restaurant/:resName", async (req, res) => {
//   const { resName } = req.params;

//   try {
//     // Find the restaurant by name
//     const restaurant = await Restaurant.findOne({ restaurantName: resName });
//     if (!restaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     // Find the owner by restaurant name and delete the owner
//     await Ownerr.deleteOne({ firstname: resName });

//     // Delete the restaurant
//     await Restaurant.deleteOne({ restaurantName: resName });

//     // If you have any additional cleanup or cascade delete operations, you can perform them here

//     return res.status(200).json({ status: "ok", message: "Restaurant deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting restaurant:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });


app.delete("/delete-restaurant/:resName", async (req, res) => {
  const { resName } = req.params;

  try {
    // Find the restaurant by name
    const restaurant = await Restaurant.findOne({ restaurantName: resName });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Extract the public ID from the existing image URL
    const existingImageUrl = restaurant.picture;
    const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|webp)$/;
    const match = existingImageUrl ? existingImageUrl.match(regex) : null;
    let publicId = null;

    if (match) {
      publicId = match[1]; // Extract the public ID
    }

    // Delete the image from Cloudinary if a public ID is found
    if (publicId) {
      try {
        await cloudinaryService.deleteImage(publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        return res.status(500).json({ error: "Error deleting image" });
      }
    }

    // Find the owner by restaurant name and delete the owner
    await Ownerr.deleteOne({ firstname: resName });
    await Favorite.deleteMany(
      { restaurantName: resName } // Match documents with the specific restaurant name
    );
    
    // Delete the restaurant
    await Restaurant.deleteOne({ restaurantName: resName });

    // If you have any additional cleanup or cascade delete operations, you can perform them here

    return res.status(200).json({ status: "ok", message: "Restaurant deleted successfully" });
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/get-one-res/:resName", authenticateUser, async (req, res) => {
  const { resName } = req.params;
  console.log("Received resName:", resName); // Log the received resName
  try {
    const restaurant = await Restaurant.findOne({ restaurantName: resName });
    if (!restaurant) {
      return res.status(404).json({error: "Restaurant not found" });
    }
    res.status(200).json({ status: "ok", data: restaurant });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/get-restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    return res.status(200).json({ status: "ok", data: restaurants });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An error occurred while getting restaurants" });
  }
});

app.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q || 'pizza'; // Default search term is "pizza"
    
    // Query to search for restaurants
    const restaurants = await Restaurant.find({
      $or: [
        { 'menu.categoryName': new RegExp(searchTerm, 'i') },
        { 'menu.dishes.name': new RegExp(searchTerm, 'i') },
        { 'menu.dishes.description': new RegExp(searchTerm, 'i') },
        {'restaurantName':new RegExp(searchTerm, 'i')}
      ]
    });

    res.status(200).json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// const CartSchema = new mongoose.Schema({
//   customerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Customer',
//     required: true
//   },
//   products: [{
//     productId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product',
//       required: true
//     },
//     quantity: {
//       type: Number,
//       required: true
//     },
//     name: {
//       type: String,
//       required: true
//     },
//     price: {
//       type: Number,
//       required: true
//     }
//   }],
// });
// const Cart = mongoose.model("Cart", CartSchema);
// app.post("/add-to-cart/:customerId", async (req, res) => {
//   const { productId, quantity, name, description, price } = req.body;
//   const { customerId } = req.params;

//   try {
//     let cart = await Cart.findOne({ customerId });
//     if (!cart) {
//       cart = new Cart({ customerId, products: [] });
//     }

//     const existingProductIndex = cart.products.findIndex(product => product.productId.toString() === productId);
//     if (existingProductIndex !== -1) {
//       // If product exists, update its quantity
//       cart.products[existingProductIndex].quantity += quantity;
//     } else {
//       // If product does not exist, add it with given quantity, name, description, and price
//       cart.products.push({ productId, quantity, name, description, price });
//     }

//     await cart.save();

//     res.status(200).json({ status: "ok", message: "Product added to cart", id: cart.customerId, products: cart.products });
//   } catch (error) {
//     console.error("Error adding product to cart:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

const CartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  coordinates: {
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false }
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    orderFrom: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    dishImage:{
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    extras: {
      type: [{
        name: String,
        price: Number
      }],
      default: []
    }
  }],
});
const Cart = mongoose.model("Cart", CartSchema);

app.post("/add-to-cart/:customerId", async (req, res) => {
  const { productId,dishImage, quantity, name, description, price, extras,orderFrom,coordinates } = req.body;
  const { customerId } = req.params;
console.log('Res Name',orderFrom);
  try {
    let cart = await Cart.findOne({ customerId, orderFrom });
    if (!cart) {
      cart = new Cart({ customerId,coordinates ,products: [] });
    }

    const existingProductIndex = cart.products.findIndex(product => product.productId.toString() === productId);
    if (existingProductIndex !== -1) {
      // If product exists, update its quantity
      cart.products[existingProductIndex].quantity += quantity;
    } else {
      // If product does not exist, add it with given quantity, name, description, price, and extras
      cart.products.push({ productId, quantity,dishImage,orderFrom, name, description, price, extras });
    }

    await cart.save();

    broadcastCartUpdated();


    res.status(200).json({ status: "ok", message: "Product added to cart", id: cart.customerId, products: cart.products });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




///clear
// authenticateUser, refreshAuthToken
app.delete("/clear-cart/:customerId", async (req, res) => {
  const { customerId } = req.params;

  try {
    // Find and delete all carts for the given customer
    const result = await Cart.deleteMany({ customerId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "No carts found for this customer" });
    }

    res.status(200).json({ status: "ok", message: "All carts cleared successfully" });
  } catch (error) {
    console.error("Error clearing carts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// delete from cart
app.delete("/remove-from-cart/:productId/:customerId", async (req, res) => {
  const { productId, customerId } = req.params;

  try {
    // Find all carts for the given customer
    const carts = await Cart.find({ customerId });
    if (carts.length === 0) {
      return res.status(404).json({ error: "No carts found for this customer" });
    }

    let productRemoved = false;

    // Iterate through each cart to find and remove the product
    for (let cart of carts) {
      const productIndex = cart.products.findIndex(product => product._id.toString() === productId);

      if (productIndex !== -1) {
        cart.products.splice(productIndex, 1);
        await cart.save();
        productRemoved = true;
      }
    }

    if (!productRemoved) {
      return res.status(404).json({ error: "Product not found in any cart" });
    }

    res.status(200).json({ status: "ok", message: "Product removed from all carts", customerId });
  } catch (error) {
    console.error("Error removing product from carts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// app.get("/get-cart/:customerId", async (req, res) => {
//   const { customerId } = req.params;

//   // const customerId = req.customerId; // Assuming you pass the customerId as a query parameter

//   try {
//     const cart = await Cart.findOne({ customerId });
//     if (!cart) {
//       return res.status(404).json({ error: "Cart not found" });
//     }
//     const totalItemsCount = cart.products.reduce((acc, product) => acc + product.quantity, 0);

//     res.status(200).json({ cart, totalItemsCount });
//   } catch (error) {
//     console.error("Error fetching cart:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.get("/get-cart/:customerId", async (req, res) => {
  const { customerId } = req.params;

  try {
    // Find all carts for the customerId
    const cart = await Cart.find({ customerId });

    if (cart.length === 0) {
      return res.status(404).json({ error: "No carts found for this customer" });
    }

    // Calculate the total number of items across all carts
    const totalItemsCount = cart.reduce((totalCount, carts) => {
      return totalCount + carts.products.reduce((acc, product) => acc + product.quantity, 0);
    }, 0);

    // Send WebSocket message to notify clients of cart update
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('cartUpdated');
      }
    });

    res.status(200).json({ cart, totalItemsCount });
  } catch (error) {
    console.error("Error fetching carts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.put('/update-cart/:productId', async (req, res) => {
  const { productId } = req.params; // Get productId from request params
  const { quantity, customerId } = req.body; // Get the updated quantity and customerId from the request body

  console.log('Received productId:', productId);
  console.log('Received quantity:', quantity);
  console.log('Received customerId:', customerId);

  if (!quantity || !customerId) {
    console.error('Missing quantity or customerId');
    return res.status(400).json({ error: 'Quantity and customerId are required' });
  }

  try {
    // Find all carts for the given customer
    const carts = await Cart.find({ customerId });
    if (carts.length === 0) {
      console.error('No carts found for customerId:', customerId);
      return res.status(404).json({ error: 'No carts found for this customer' });
    }

    let updated = false;

    // Iterate through each cart to find and update the product
    for (let cart of carts) {
      const product = cart.products.find(p => p._id.toString() === productId);

      if (product) {
        // Update the quantity of the found product
        product.quantity = quantity;
        await cart.save();
        updated = true;
      }
    }

    if (!updated) {
      console.error('Product not found in any cart with productId:', productId);
      return res.status(404).json({ error: 'Product not found in any cart' });
    }

    res.status(200).json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






//get dish by its id
//get dish by its id
// Endpoint to get a dish by its ID
app.get("/dishes/:dishId", async (req, res) => {
  const { dishId } = req.params;

  try {
    // Find the dish by its ID
    const dish = await Dish.findById(dishId);

    if (!dish) {
      return res.status(404).json({ error: "Dish not found" });
    }

    return res.status(200).json({ status: "ok", data: dish });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "An error occurred while fetching the dish" });
  }
});
// orders proccessing
// Define Order Schema
// Define Order Schema
const OrderSchema = new mongoose.Schema({
  orderId: String,
  restaurantId: String, // Added restaurantId field
  customerId: String,
  products: [{
    productId: String,
    quantity: Number,
    orderFrom: String,
    price: Number,
    name: String,
    extras: {
      type: [{
        name: String,
        price: Number
      }],
      default: []
    }
  }],
  status: String,
  shippingOption: String, // Added shippingOption field
  shippingInfo: {
    name: String,
    email: String,
    phoneNumber1: String,
    phoneNumber2: String
  },
  orderLocation: { // Added orderLocation field
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  preparingTime: Number,
  preparingStartedAt: Date,
  tableNumber: Number,
  createdAt: { type: Date, default: Date.now },
  orderTime: Date,
  completedAt: Date,
  declinedAt: Date
});

OrderSchema.index({ orderLocation: "2dsphere" }); // Add geospatial index for orderLocation


OrderSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next();
  }
  this.orderTime = new Date();
  next();
});

OrderSchema.statics.updateOrderStatus = async function (orderId, newStatus) {
  try {
    const order = await this.findOneAndUpdate({ orderId }, { status: newStatus }, { new: true });
    if (!order) {
      throw new Error('Order not found');
    }
    return { message: 'Order status updated successfully' };
  } catch (error) {
    throw error;
  }
};

OrderSchema.statics.checkOrderStatus = async function (orderId) {
  try {
    const order = await this.findOne({ orderId });
    if (!order) {
      throw new Error('Order not found');
    }
    return { orderId: order.orderId, status: order.status };
  } catch (error) {
    throw error;
  }
};

// Create Order model
const Order = mongoose.model("Order", OrderSchema);


// Endpoint to create an order
// app.post("/create-order/:customerId", async (req, res) => {
//   const { customerId } = req.params;

//   try {
//     const { products, shippingInfo, shippingOption, userLocation } = req.body;
//     let orderLocation;
// const status = '';
//     // Fetch the restaurant details from the database
//     const restaurant = await Restaurant.findOne({ restaurantName: { $regex: new RegExp(`^${resName}$`, 'i') } });
//     if (!restaurant) {
//       console.log('restaurant not found');
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     // Get the restaurant coordinates
//     const restaurantCoordinates = [restaurant.coordinates.latitude, restaurant.coordinates.longitude];
//     if (shippingOption === 'dine-in' && req.body.tableNumber) {
//       // Check if the table number is already reserved
      // const existingOrder = await Order.findOne({
      //   resName: resName,
      //   tableNumber: req.body.tableNumber,
      //   status: { $nin: ['Completed', 'Not Approved','Delivered'] } 
      // });

      // if (existingOrder) {
      //   return res.status(400).json({ error: "Table number is already reserved." });
      // }
//     }
//     // Determine the order location based on the shipping option
//     if (shippingOption === 'self-pickup' || shippingOption === 'dine-in') {
//       orderLocation = {
//         type: 'Point',
//         coordinates: restaurantCoordinates
//       };
//     }    
//     else if (shippingOption === 'delivery') {
//       if (!userLocation) {
//         return res.status(400).json({ error: "User location is required for delivery option" });
//       }
//       try {
//         const address = `${userLocation.lat},${userLocation.lng}`;
//         const geocodingResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`);
//         const { results } = geocodingResponse.data;
//         if (!results || results.length === 0) {
//           throw new Error('Geocoding failed or no results found');
//         }
//         const location = results[0].geometry.location;
//         orderLocation = {
//           type: 'Point',
//           coordinates: [location.lng, location.lat]
//         };
//       } catch (error) {
//         console.error('Geocoding error:', error);
//         return res.status(500).json({ error: "Failed to get user location" });
//       }
//     } else {
//       return res.status(400).json({ error: "Invalid shipping option" });
//     }

//     const orderId = generateRandomOrderId(); // Assuming generateRandomOrderId is defined elsewhere
//     const orderDataToSave = {
//       orderId: orderId,
//       customerId: customerId,
//       products: products,
//       status: status,
//       shippingInfo: shippingInfo,
//       shippingOption: shippingOption,
//       orderLocation: orderLocation,
//       createdAt: new Date(),
//       orderTime: new Date()
//     };

//     if (shippingOption === 'dine-in' && req.body.tableNumber) {
//       orderDataToSave.tableNumber = req.body.tableNumber;
//     }
//     const order = new Order(orderDataToSave);

//     await order.save();

//     await Cart.deleteOne({ customerId: customerId });

//     // Broadcast 'newOrderReceived' message to all clients (including the restaurant owner)
//     broadcastNewOrderReceived(resName);
//     broadcastCartUpdated();

//     return res.status(201).json({ status: "ok", message: "Order created successfully", order });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });


// app.post("/create-order/:customerId", async (req, res) => {
//   const { customerId } = req.params;

//   try {
//     let { products, shippingInfo, shippingOption, userLocation } = req.body;

//     // Check if products is an object with an 'undefined' key
//     if (products && typeof products === 'object' && products.hasOwnProperty('undefined')) {
//       console.log('Products object received:', products);
//       products = products.undefined; // Reassign products to the array under 'undefined' key
//     }

//     console.log('Products: ', products);

//     // Ensure products is an array
//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ error: "Products array is empty or not provided" });
//     }

//     const uniqueRestaurants = new Set();
//     products.forEach((product, index) => {
//       console.log(`Product ${index}:`, product);
//       if (product.products && product.products.length > 0) {
//         product.products.forEach(p => {
//           if (p.orderFrom) {
//             uniqueRestaurants.add(p.orderFrom);
//           }
//         });
//       } else {
//         console.warn('Product missing products field:', product);
//       }
//     });
//     console.log('Unique Restaurants:', uniqueRestaurants);

//     if (uniqueRestaurants.size === 0) {
//       return res.status(400).json({ error: "No valid restaurants found in products" });
//     }

//     const ordersToSave = [];
//     for (const resName of uniqueRestaurants) {
//       const orderProducts = products
//         .filter(product => product.products && product.products.some(p => p.orderFrom === resName))
//         .flatMap(product => product.products.filter(p => p.orderFrom === resName));

//       const restaurant = await Restaurant.findOne({ restaurantName: { $regex: new RegExp(`^${resName}$`, 'i') } });
//       if (!restaurant) {
//         console.log('Restaurant not found for:', resName);
//         continue;
//       }

//       const restaurantCoordinates = [restaurant.coordinates.latitude, restaurant.coordinates.longitude];

//       let orderLocation;
//       if (shippingOption === 'self-pickup' || shippingOption === 'dine-in') {
//         orderLocation = {
//           type: 'Point',
//           coordinates: restaurantCoordinates
//         };
//       } else if (shippingOption === 'delivery') {
//         if (!userLocation) {
//           return res.status(400).json({ error: "User location is required for delivery option" });
//         }
//         try {
//           const address = `${userLocation.lat},${userLocation.lng}`;
//           const geocodingResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`);
//           const { results } = geocodingResponse.data;
//           if (!results || results.length === 0) {
//             throw new Error('Geocoding failed or no results found');
//           }
//           const location = results[0].geometry.location;
//           orderLocation = {
//             type: 'Point',
//             coordinates: [location.lng, location.lat]
//           };
//         } catch (error) {
//           console.error('Geocoding error:', error);
//           return res.status(500).json({ error: "Failed to get user location" });
//         }
//       } else {
//         return res.status(400).json({ error: "Invalid shipping option" });
//       }

//       const orderId = generateRandomOrderId(); // Ensure this function is defined
//       const orderDataToSave = {
//         orderId: orderId,
//         customerId: customerId,
//         products: orderProducts,
//         status: '', // Set an appropriate status
//         shippingInfo: shippingInfo,
//         shippingOption: shippingOption,
//         orderLocation: orderLocation,
//         createdAt: new Date(),
//         orderTime: new Date()
//       };

//       if (shippingOption === 'dine-in' && req.body.tableNumber) {
//         orderDataToSave.tableNumber = req.body.tableNumber;
//       }

//       const order = new Order(orderDataToSave);
//       ordersToSave.push(order);
//     }

//     await Order.insertMany(ordersToSave);
//     await Cart.deleteMany({ customerId: customerId });

//     uniqueRestaurants.forEach(resName => {
//       broadcastNewOrderReceived(resName);
//     });
//     broadcastCartUpdated();

//     return res.status(201).json({ status: "ok", message: "Order(s) created successfully", orders: ordersToSave });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.post("/create-order/:customerId", async (req, res) => {
  const { customerId } = req.params;

  try {
    let { products, shippingInfo, shippingOption, userLocation, tableNumber } = req.body;

    if (products && typeof products === 'object' && products.hasOwnProperty('undefined')) {
      products = products.undefined;
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products array is empty or not provided" });
    }

    const uniqueRestaurants = new Set();
    products.forEach((product) => {
      if (product.products && product.products.length > 0) {
        product.products.forEach(p => {
          if (p.orderFrom) {
            uniqueRestaurants.add(p.orderFrom);
          }
        });
      }
    });

    if (uniqueRestaurants.size === 0) {
      return res.status(400).json({ error: "No valid restaurants found in products" });
    }

    const ordersToSave = [];
    const productIdsToRemove = [];
    const errors = [];
    const successfulRestaurants = new Set(); // Track restaurants for which orders were successfully created

    for (const resName of uniqueRestaurants) {
      const restaurant = await Restaurant.findOne({ restaurantName: { $regex: new RegExp(`^${resName}$`, 'i') } });
    
      if (!restaurant) {
        errors.push({ error: "Restaurant not found", resName: resName });
        continue;
      }
    
      if (restaurant.status !== 'open') {
        errors.push({ error: `Restaurant is ${restaurant.status}`, resName: resName });
        continue;
      }
    
      if (shippingOption === 'dine-in') {
        const existingOrder = await Order.findOne({
          'products.orderFrom': resName, // Check if any product is ordered from this restaurant
          tableNumber: tableNumber,
          status: { $nin: ['Completed', 'Not Approved', 'Delivered'] }
        });
    
        if (existingOrder) {
          errors.push({ error: "Table number is already reserved", resName: resName });
          continue;
        }
      }    

      const orderProducts = products
        .filter(product => product.products && product.products.some(p => p.orderFrom === resName))
        .flatMap(product => product.products.filter(p => p.orderFrom === resName));

      const restaurantCoordinates = [restaurant.coordinates.latitude, restaurant.coordinates.longitude];
      let orderLocation;

      if (shippingOption === 'self-pickup' || shippingOption === 'dine-in') {
        orderLocation = {
          type: 'Point',
          coordinates: restaurantCoordinates
        };
      } else if (shippingOption === 'delivery') {
        if (!userLocation) {
          return res.status(400).json({ error: "User location is required for delivery option" });
        }

        try {
          const address = `${userLocation.lat},${userLocation.lng}`;
          const geocodingResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`);
          const { results } = geocodingResponse.data;
          if (!results || results.length === 0) {
            throw new Error('Geocoding failed or no results found');
          }
          const location = results[0].geometry.location;
          orderLocation = {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          };
        } catch (error) {
          console.error('Geocoding error:', error);
          return res.status(500).json({ error: "Failed to get user location" });
        }
      } else {
        return res.status(400).json({ error: "Invalid shipping option" });
      }

      const orderId = generateRandomOrderId();
      const orderDataToSave = {
        orderId: orderId,
        customerId: customerId,
        products: orderProducts,
        status: '',
        shippingInfo: shippingInfo,
        shippingOption: shippingOption,
        orderLocation: orderLocation,
        createdAt: new Date(),
        orderTime: new Date()
      };

      if (shippingOption === 'dine-in' && tableNumber) {
        orderDataToSave.tableNumber = tableNumber;
      }

      const order = new Order(orderDataToSave);
      ordersToSave.push(order);
      productIdsToRemove.push(...orderProducts.map(p => p._id));

      // Add the restaurant name to the successfulRestaurants set
      successfulRestaurants.add(resName);
    }

    if (ordersToSave.length === 0) {
      return res.status(400).json({ error: "No orders could be created", details: errors });
    }

    await Order.insertMany(ordersToSave);

    const carts = await Cart.find({ customerId: customerId });
    for (const cart of carts) {
      cart.products = cart.products.filter(product => !productIdsToRemove.includes(product._id.toString()));

      if (cart.products.length === 0) {
        await Cart.deleteOne({ _id: cart._id });
      } else {
        await cart.save();
      }
    }

    // Broadcast only for the restaurants that had orders created
    successfulRestaurants.forEach(resName => {
      broadcastNewOrderReceived(resName);
    });

    broadcastCartUpdated();

    return res.status(201).json({ status: "ok", message: "Order(s) created successfully", orders: ordersToSave });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});








function generateRandomOrderId() {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substr(2, 5);
  return timestamp + randomString;
}


// Endpoint to get all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    return res.status(200).json({ status: "ok", orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get orders by resName
// app.get("/orders/:resName", async (req, res) => {
//   const { resName } = req.params;
// console.log('Res Name passing in backend for fetching res specific order',resName);
//   try {
//     const orders = await Order.find({ resName });
//     console.log('Order found', orders);
//     if (orders.length === 0) {
//       console.log('No orders found');
//       return res.status(404).json({ status: "error", message: "No orders found for the specified restaurant name" });
//     }
//     return res.status(200).json({ status: "ok", orders });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });
app.get("/orders/:resName", async (req, res) => {
  const { resName } = req.params;
  console.log('Res Name passing in backend for fetching res specific order', resName);
  
  try {
    const orders = await Order.find({ 'products.orderFrom': { $regex: new RegExp(`^${resName}$`, 'i') } });
    if (orders.length === 0) {
      console.log('No orders found');
      return res.status(404).json({ status: "error", message: "No orders found for the specified restaurant name" });
    }
    return res.status(200).json({ status: "ok", orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// Endpoint to get orders by customer ID
// Assuming you have a route for getting orders
app.get('/order/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const orders = await Order.find({ customerId });

    // Add orderTime field to each order object
    const ordersWithTime = orders.map(order => ({
      ...order.toJSON(),
      orderTime: order.createdAt // Assuming createdAt is the timestamp of when the order was created
    }));

    res.json({ orders: ordersWithTime });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Endpoint to update an order status
// app.put("/orders/:orderId", async (req, res) => {
//   const { orderId } = req.params;
//   const { status } = req.body;
//   try {
//     await Order.findOneAndUpdate({ orderId }, { status });
//     return res.status(200).json({ status: "ok", message: "Order status updated successfully" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.put("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status, preparingTime } = req.body; // Add preparingTime to the request body
  try {
    let updateData = { status };
    // If the status is "Preparing," update the preparingTime and set preparingStartedAt
    if (status === "Preparing" && preparingTime) {
      updateData.preparingTime = preparingTime;
      updateData.preparingStartedAt = new Date(); // Set preparingStartedAt to the current date/time
    }
    if (status === "Completed") {
      updateData.completedAt = new Date(); // Set preparingStartedAt to the current date/time
    }
    if (status === "Not Approved") {
      updateData.declinedAt = new Date(); // Set preparingStartedAt to the current date/time
    }
    await Order.findOneAndUpdate({ orderId }, updateData);
    return res.status(200).json({ status: "ok", message: "Order status updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



// Endpoint to delete an order
app.delete("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    await Order.findOneAndDelete({ orderId });
    return res.status(200).json({ status: "ok", message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
//categories
app.get("/restaurant-categories/:restaurantName", async (req, res) => {
  const { restaurantName } = req.params;
  try {
    const restaurant = await Restaurant.findOne({ restaurantName });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    
    const restaurantImage = restaurant.picture; // Assuming dishes are the products


    const categories = restaurant.menu.map(category => ({
      categoryName: category.categoryName,
      categoryImage: category.categoryImage
    }));
    
    // Find the category by categoryName
    const category = restaurant.menu.find(category => category.categoryName === categories[0].categoryName);
    
    if (!category) {
      return res.status(201).json({ status: "notfound", restaurantImage });
    }

    return res.status(200).json({ status: "ok", categories,restaurantImage });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//products in specific category
// Endpoint to get products of a specific category in a specific restaurant
app.get("/restaurant/:restaurantName/category/:categoryName/dishes", async (req, res) => {
  const { restaurantName, categoryName } = req.params;
  try {
    const restaurant = await Restaurant.findOne({ restaurantName });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    const restaurantImage = restaurant.picture;
    console.log('Restaurant Image',restaurantImage);
    const category = restaurant.menu.find(category => category.categoryName === categoryName);
    if (!category) {
      return res.status(201).json({ restaurantImage });
    }

    const products = category.dishes; // Assuming dishes are the products
    const categoryImage = category.categoryImage; // Get category image

    console.log(category)

    return res.status(200).json({ status: "ok", products,restaurantImage,categoryImage });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});




// Endpoint to add a dish to a specific category in a specific restaurant
// app.post("/restaurant/:restaurantName/category/:categoryName/add-dish", async (req, res) => {
//   const { restaurantName, categoryName } = req.params;
//   const { name, price, dishImage, description } = req.body;

//   try {
//     const restaurant = await Restaurant.findOne({ restaurantName });
//     if (!restaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     const categoryIndex = restaurant.menu.findIndex(category => category.categoryName === categoryName);
//     if (categoryIndex === -1) {
//       return res.status(404).json({ error: "Category not found in the specified restaurant" });
//     }

//     const newDish = {
//       name,
//       price,
//       dishImage,
//       description
//     };

//     restaurant.menu[categoryIndex].dishes.push(newDish);
//     await restaurant.save();

//     return res.status(201).json({ status: "ok", message: "Dish added successfully", dish: newDish });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// app.post("/restaurant/:restaurantName/category/:categoryName/add-dish", async (req, res) => {
//   const { restaurantName, categoryName } = req.params;
//   const { name, price, dishImage, description, extras } = req.body;
//   const { requiredExtras, optionalExtras } = extras;

//   try {
//     const restaurant = await Restaurant.findOne({ restaurantName });
//     if (!restaurant) {
//       return res.status(404).json({ error: "Restaurant not found" });
//     }

//     const categoryIndex = restaurant.menu.findIndex(category => category.categoryName === categoryName);
//     if (categoryIndex === -1) {
//       return res.status(404).json({ error: "Category not found in the specified restaurant" });
//     }

//     const validRequiredExtras = Array.isArray(requiredExtras)
//       ? requiredExtras
//           .filter(extra => extra.name && extra.price != null)  // Filter out empty name or null price
//           .map(extra => ({
//             name: extra.name,
//             price: extra.price
//           }))
//       : undefined;

//     const validOptionalExtras = Array.isArray(optionalExtras)
//       ? optionalExtras
//           .filter(extra => extra.name && extra.price != null)  // Filter out empty name or null price
//           .map(extra => ({
//             name: extra.name,
//             price: extra.price
//           }))
//       : undefined;

//     const newDish = new Dish({
//       name,
//       price,
//       dishImage,
//       description,
//       extras: {
//         requiredExtras: validRequiredExtras && validRequiredExtras.length > 0 ? validRequiredExtras : undefined,
//         optionalExtras: validOptionalExtras && validOptionalExtras.length > 0 ? validOptionalExtras : undefined
//       }
//     });

//     await newDish.save();

//     // Push the new dish to the specified category in the menu
//     restaurant.menu[categoryIndex].dishes.push(newDish);
    
//     // Update the menu in the database
//     await Restaurant.findByIdAndUpdate(restaurant._id, { menu: restaurant.menu });

//     // Update the MenuCategory table
//     await MenuCategory.findOneAndUpdate(
//       { categoryName: categoryName },
//       { $push: { dishes: newDish } }
//     );

//     return res.status(201).json({ status: "ok", message: "Dish added successfully", dish: newDish });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.post("/restaurant/:restaurantName/category/:categoryName/add-dish", upload.single('dishImage'), async (req, res) => {
  const { restaurantName, categoryName } = req.params;
  const { name, price, description} = req.body;
  const dishImage = req.file; // Access the uploaded file from multer

  try {
    let extras = req.body.extras;

    // Parse extras if it's a string
    if (typeof extras === 'string') {
      extras = JSON.parse(extras);
    }

    const { requiredExtras, optionalExtras } = extras || {};
  
    const restaurant = await Restaurant.findOne({ restaurantName });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const categoryIndex = restaurant.menu.findIndex(category => category.categoryName === categoryName);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: "Category not found in the specified restaurant" });
    }

    const validRequiredExtras = Array.isArray(requiredExtras)
      ? requiredExtras
          .filter(extra => extra.name && extra.price != null)  // Filter out empty name or null price
          .map(extra => ({
            name: extra.name,
            price: extra.price
          }))
      : undefined;

    const validOptionalExtras = Array.isArray(optionalExtras)
      ? optionalExtras
          .filter(extra => extra.name && extra.price != null)  // Filter out empty name or null price
          .map(extra => ({
            name: extra.name,
            price: extra.price
          }))
      : undefined;

    // Upload the image to Cloudinary
    let imageUrl = null;
    if (dishImage) {
      const result = await cloudinaryService.addImage(dishImage.buffer);
      imageUrl = result.secure_url;
    }

    const newDish = new Dish({
      name,
      price,
      dishImage: imageUrl,
      description,
      extras: {
        requiredExtras: validRequiredExtras && validRequiredExtras.length > 0 ? validRequiredExtras : undefined,
        optionalExtras: validOptionalExtras && validOptionalExtras.length > 0 ? validOptionalExtras : undefined
      }
    });

    await newDish.save();

    // Push the new dish to the specified category in the menu
    restaurant.menu[categoryIndex].dishes.push(newDish);
    
    // Update the menu in the database
    await Restaurant.findByIdAndUpdate(restaurant._id, { menu: restaurant.menu });

    // Update the MenuCategory table
    await MenuCategory.findOneAndUpdate(
      { categoryName: categoryName },
      { $push: { dishes: newDish } }
    );

    return res.status(201).json({ status: "ok", message: "Dish added successfully", dish: newDish });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



// Endpoint to delete a dish from a specific category in a specific restaurant
app.delete("/restaurant/:restaurantName/category/:categoryName/delete-dish/:dishId", async (req, res) => {
  const { restaurantName, categoryName, dishId } = req.params;

  try {
    const restaurant = await Restaurant.findOne({ restaurantName });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const categoryIndex = restaurant.menu.findIndex(category => category.categoryName === categoryName);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: "Category not found in the specified restaurant" });
    }

    const dishIndex = restaurant.menu[categoryIndex].dishes.findIndex(dish => dish._id.toString() === dishId);
    if (dishIndex === -1) {
      return res.status(404).json({ error: "Dish not found in the specified category" });
    }
    // Remove the dish from the category
    restaurant.menu[categoryIndex].dishes.splice(dishIndex, 1);
    await restaurant.save();

   

    return res.status(200).json({ status: "ok", message: "Dish deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// API for restaurant owner to update order status
app.post('/update-order-status', async (req, res) => {
  const { orderId, newStatus } = req.body;
  try {
    const response = await Order.updateOrderStatus(orderId, newStatus);
    res.json(response);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});


app.get('/check-order-status/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const response = await Order.checkOrderStatus(orderId);
    res.json(response);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});



const extrasSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
});

// Create the Extras model
const Extras = mongoose.model('Extras', extrasSchema);



app.post('/add-required-extras/:dishId', async (req, res) => {
  const { name, price } = req.body;
  const dishId = req.params.dishId;
  try {
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ error: 'Dish not found' });
    }
    const newExtra = await Extras.create({ name, price });
    dish.requiredExtras.push(newExtra);
    await dish.save();
    res.json({ message: 'Required extra added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API to add optional extras to a dish
app.post('/add-optional-extras/:dishId', async (req, res) => {
  const { name, price } = req.body;
  const dishId = req.params.dishId;
  try {
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ error: 'Dish not found' });
    }
    const newExtra = await Extras.create({ name, price });
    dish.optionalExtras.push(newExtra);
    await dish.save();
    res.json({ message: 'Optional extra added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});





// API to get extras offered with a meal
app.get('/get-extras/:dishId', async (req, res) => {
  const dishId = req.params.dishId;
  try {
    const dish = await Dish.findById(dishId).populate('requiredExtras optionalExtras');
    if (!dish) {
      return res.status(404).json({ error: 'Dish not found' });
    }
    res.json({ requiredExtras: dish.requiredExtras, optionalExtras: dish.optionalExtras });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API to buy extras with a meal
app.post('/buy-extras/:dishId', async (req, res) => {
  const { extras } = req.body;
  const dishId = req.params.dishId;
  try {
    const dish = await Dish.findById(dishId).populate('requiredExtras optionalExtras');
    if (!dish) {
      return res.status(404).json({ error: 'Dish not found' });
    }
    // Calculate the total price including selected extras
    let totalPrice = dish.price;
    extras.forEach(extraId => {
      const extra = dish.requiredExtras.find(extra => extra._id.equals(extraId)) || dish.optionalExtras.find(extra => extra._id.equals(extraId));
      if (extra) {
        totalPrice += extra.price || 0;
      }
    });
    // Return the total price
    res.json({ totalPrice });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// const moment = require('moment');
app.post('/api/orders/completed', async (req, res) => {
  try {
    const { period, restaurantName } = req.body;
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = moment().startOf('day').toDate();
        endDate = moment().endOf('day').toDate();
        break;
      case 'yesterday':
        startDate = moment().subtract(1, 'days').startOf('day').toDate();
        endDate = moment().subtract(1, 'days').endOf('day').toDate();
        break;
      case 'thisWeek':
        startDate = moment().startOf('week').toDate();
        endDate = moment().endOf('day').toDate();
        break;
      case 'lastWeek':
        startDate = moment().subtract(1, 'week').startOf('week').toDate();
        endDate = moment().subtract(1, 'week').endOf('week').toDate();
        break;
      case 'thisMonth':
        startDate = moment().startOf('month').toDate();
        endDate = moment().endOf('day').toDate();
        break;
      case 'lastMonth':
        startDate = moment().subtract(1, 'month').startOf('month').toDate();
        endDate = moment().subtract(1, 'month').endOf('month').toDate();
        break;
      case 'lastTwoMonths':
        startDate = moment().subtract(2, 'months').startOf('month').toDate();
        endDate = moment().subtract(1, 'months').endOf('month').toDate();
        break;
      default:
        throw new Error('Invalid period');
    }

    const query = {
      status: 'Completed',
      completedAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (restaurantName) {
      query['products.orderFrom'] = new RegExp(`^${restaurantName}$`, 'i');
    }

    const filteredOrders = await Order.find(query);

    res.json(filteredOrders);
  } catch (err) {
    console.error('Error retrieving completed orders:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/revenue', async (req, res) => {
  try {
    const { period, restaurantName } = req.body;
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = moment().startOf('day').toDate();
        endDate = moment().endOf('day').toDate();
        break;
      case 'yesterday':
        startDate = moment().subtract(1, 'days').startOf('day').toDate();
        endDate = moment().subtract(1, 'days').endOf('day').toDate();
        break;
      case 'thisWeek':
        startDate = moment().startOf('week').toDate();
        endDate = moment().endOf('day').toDate();
        break;
      case 'lastWeek':
        startDate = moment().subtract(1, 'week').startOf('week').toDate();
        endDate = moment().subtract(1, 'week').endOf('week').toDate();
        break;
      case 'thisMonth':
        startDate = moment().startOf('month').toDate();
        endDate = moment().endOf('day').toDate();
        break;
      case 'lastMonth':
        startDate = moment().subtract(1, 'month').startOf('month').toDate();
        endDate = moment().subtract(1, 'month').endOf('month').toDate();
        break;
      case 'lastTwoMonths':
        startDate = moment().subtract(2, 'months').startOf('month').toDate();
        endDate = moment().subtract(1, 'months').endOf('month').toDate();
        break;
      default:
        throw new Error('Invalid period');
    }

    const query = {
      status: 'Completed',
      completedAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (restaurantName) {
      query['products.orderFrom'] = new RegExp(`^${restaurantName}$`, 'i');
    }

    const orders = await Order.find(query);

    if (orders.length === 0) {
      return res.json({ message: 'No completed orders found in this date range' });
    }

    const orderDetails = orders.map(order => {
      const orderTotalPrice = order.products.reduce((total, product) => {
        let totalPrice = product.quantity * product.price;
        if (product.extras && product.extras.length > 0) {
          totalPrice += product.quantity * product.extras.reduce((acc, extra) => acc + extra.price, 0);
        }
        return total + totalPrice;
      }, 0);

      return { orderId: order.orderId, revenue: orderTotalPrice.toFixed(2) };
    });

    const totalRevenue = orderDetails.reduce((total, order) => total + parseFloat(order.revenue), 0).toFixed(2);

    res.json({ orderDetails, totalRevenue });

  } catch (err) {
    console.error('Error calculating total revenue:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/api/orders/rejected', async (req, res) => {
  try {
    const { period, restaurantName } = req.body;
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = moment().startOf('day').toDate();
        endDate = moment().endOf('day').toDate();
        break;
      case 'yesterday':
        startDate = moment().subtract(1, 'days').startOf('day').toDate();
        endDate = moment().subtract(1, 'days').endOf('day').toDate();
        break;
      case 'thisWeek':
        startDate = moment().startOf('week').toDate();
        endDate = moment().endOf('day').toDate();
        break;
      case 'lastWeek':
        startDate = moment().subtract(1, 'week').startOf('week').toDate();
        endDate = moment().subtract(1, 'week').endOf('week').toDate();
        break;
      case 'thisMonth':
        startDate = moment().startOf('month').toDate();
        endDate = moment().endOf('day').toDate();
        break;
      case 'lastMonth':
        startDate = moment().subtract(1, 'month').startOf('month').toDate();
        endDate = moment().subtract(1, 'month').endOf('month').toDate();
        break;
      case 'lastTwoMonths':
        startDate = moment().subtract(2, 'months').startOf('month').toDate();
        endDate = moment().subtract(1, 'months').endOf('month').toDate();
        break;
      default:
        throw new Error('Invalid period');
    }

    const query = {
      status: 'Not Approved',
      declinedAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (restaurantName) {
      query.resName = restaurantName;
    }

    const rejectedOrders = await Order.find(query);

    res.json(rejectedOrders);
  } catch (err) {
    console.error('Error retrieving rejected orders:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// API to send a verification code to reset password
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Clientt.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a random verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = verificationCode;
    await user.save();

    // Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: 'help.layla.restaurant@gmail.com', // Your Gmail email address
        pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password
      }
    });

    // Configure email options
    const mailOptions = {
      from: 'YazanRestaurant@gmail.com',
      to: email,
      subject: 'Password Reset Verification Code',
      text: `Here's your requested Layla password reset code: ${verificationCode}. Please do not share this code with anyone, use this code to continue with setting your new password. It will expire in 30 minutes for security purposes. If you didn't request this, please disregard this message and notify our support team immediately. Best regards, Layla Security Team`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to send verification code' });
      } else {
        res.json({ message: 'Verification code sent successfully' });
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.post('/forgot-password-owner', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Ownerr.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    // Generate a random verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = verificationCode;
    await user.save();

    // Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: 'help.layla.restaurant@gmail.com', // Your Gmail email address
        pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password
      }
    });

    // Configure email options
    const mailOptions = {
      from: 'YazanRestaurant@gmail.com',
      to: email,
      subject: 'Password Reset Verification Code',
      text: `Hey ${user.firstname}, here's your requested Layla password reset code: ${verificationCode}. Please do not share this code with anyone, use this code to continue with setting your new password. It will expire in 30 minutes for security purposes. If you didn't request this, please disregard this message and notify our support team immediately. Best regards, Layla Security Team`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to send verification code' });
      } else {
        res.json({ message: 'Verification code sent successfully' });
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// API to reset password using verification code
app.post('/reset-password', async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;
  try {
    const user = await Clientt.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the verification code matches
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    user.password = encryptedPassword;
    // Clear the verification code
    user.verificationCode = null;
    await user.save();

    // Send email notification
    const transporter = nodemailer.createTransport({
    //   host: 'layla-res.com',
    // port: 465,
    // secure: true, // Use true for 465, false for other ports
    // auth: {
    //     user: 'help@layla-res.com',
    //     pass: 'Laylar@010'
    // }
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'help.layla.restaurant@gmail.com', // Your Gmail email address
      pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password
    }
    });

    const mailOptions = {
      from: 'YazanRestaurant@gmail.com',
      to: email,
      subject: 'Password Changed Successfully',
      text: 'Your Layla account password has been successfully changed. If you did not initiate this change, please contact support immediately.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to send password change notification' });
      } else {
        res.json({ message: 'Password reset successfully. Notification sent to your email.' });
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.post('/reset-password-owner', async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;
  try {
    const user = await Ownerr.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    // Check if the verification code matches
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    user.password = encryptedPassword;
    // Clear the verification code
    user.verificationCode = null;
    await user.save();

    // Send email notification
    const transporter = nodemailer.createTransport({
    //   host: 'layla-res.com',
    // port: 465,
    // secure: true, // Use true for 465, false for other ports
    // auth: {
    //     user: 'help@layla-res.com',
    //     pass: 'Laylar@010'
    // }
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'help.layla.restaurant@gmail.com', // Your Gmail email address
      pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password
    }
    });

    const mailOptions = {
      from: 'YazanRestaurant@gmail.com',
      to: email,
      subject: 'Password Changed Successfully',
      text: `Hey ${user.firstname}, your Layla account password has been successfully changed. If you did not initiate this change, please contact support immediately.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to send password change notification' });
      } else {
        res.json({ message: 'Password reset successfully. Notification sent to your email.' });
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/logged-in-users", async (req, res) => {
  try {
    // Find all clients where isLoggedIn is true
    const loggedInUsers = await Clientt.find({ isLoggedIn: true });

    // If no logged-in users found, return empty array
    if (!loggedInUsers || loggedInUsers.length === 0) {
      return res.status(200).json({ message: "No logged-in users found", users: [] });
    }

    // If logged-in users found, return the list
    return res.status(200).json({ message: "Logged-in users found", users: loggedInUsers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/all-users", async (req, res) => {
  try {
    // Find all registered clients
    const allUsers = await ClientInfo.find();

    // If no users found, return empty array
    if (!allUsers || allUsers.length === 0) {
      return res.status(200).json({ message: "No users found", users: [] });
    }

    // If users found, return the list
    return res.status(200).json({ message: "Users found", users: allUsers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
