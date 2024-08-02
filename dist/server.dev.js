"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var express = require("express");

var mongoose = require("mongoose");

require("dotenv").config();

var cors = require("cors");

var app = express();

var _require = require('mongodb'),
  ObjectId = _require.ObjectId;

var PORT = process.env.PORT | 5002;

var bodyParser = require('body-parser');

var bcrypt = require("bcryptjs");

var jwt = require('jsonwebtoken');

var WebSocket = require('ws');

var wss = new WebSocket.Server({
  port: 8080
});

var nodemailer = require('nodemailer');

var clients = [];
wss.on('connection', function connection(ws) {
  // Add the new client to the list of clients
  clients.push(ws); // Log if it's a new client

  console.log('Client connected. Total clients:', clients.length);
  ws.on('close', function () {
    // Remove the disconnected client from the list of clients
    clients = clients.filter(function (client) {
      return client !== ws;
    }); // Log if it was the last client

    console.log('Client disconnected. Total clients:', clients.length);
  }); // Handle messages from clients (if needed)

  ws.on('message', function incoming(message) {// Handle incoming messages if required
  });
}); // Use this function to broadcast 'cartUpdated' message to all clients

function broadcastCartUpdated() {
  clients.forEach(function (client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send('cartUpdated');
    }
  });
} // Use this function to broadcast 'favoritesUpdated' message to all clients


function broadcastFavoritesUpdated() {
  clients.forEach(function (client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send('favoritesUpdated');
    }
  });
}

app.use(bodyParser.json({
  limit: '50mb'
})); // Adjust the limit as needed

app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}));
app.use(express.json());
app.use(cors());
app.get("/", function (req, res) {
  res.send(process.env.MONGO_URI);
});
mongoose.connect(process.env.MONGO_URI).then(function () {
  return console.log("MongoDb connected");
})["catch"](function (error) {
  return console.log(error);
});
app.listen(PORT, function () {
  return console.log("listening at ".concat(PORT));
}); // Middleware to refresh JWT token before expiration

var refreshAuthToken = function refreshAuthToken(req, res, next) {
  var authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: "Unauthorized: Bearer token not provided"
    });
  }

  var token = authorizationHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        var newToken = generateToken(decoded.userId);
        res.setHeader('Authorization', "Bearer ".concat(newToken));
      } else {
        return res.status(401).json({
          error: "Unauthorized: Invalid token"
        });
      }
    } else {
      req.userId = decoded.userId;
    }

    next();
  });
}; // app.use(refreshAuthToken);
// Middleware to authenticate user with JWT token


var authenticateUser = function authenticateUser(req, res, next) {
  // Get token from request headers
  var authorizationHeader = req.headers.authorization; // Check if authorization header is provided

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: "Unauthorized: Bearer token not provided"
    });
  } // Extract token from authorization header


  var token = authorizationHeader.split(' ')[1]; // Verify the token

  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).json({
        error: "Unauthorized: Invalid token"
      });
    } // If token is valid, attach decoded data to request object


    req.userId = decoded.userId;
    next(); // Proceed to the next middleware or route handler
  });
}; // Function to generate JWT token


var generateToken = function generateToken(userId) {
  return jwt.sign({
    userId: userId
  }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
};

require("./ownerDetails");

var Ownerr = mongoose.model("OwnerInfo");
app.post("/login-owner", function _callee(req, res) {
  var _req$body, email, password, owner, isPasswordValid, restaurant, token;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _req$body = req.body, email = _req$body.email, password = _req$body.password;
          _context.prev = 1;
          _context.next = 4;
          return regeneratorRuntime.awrap(Ownerr.findOne({
            email: email
          }));

        case 4:
          owner = _context.sent;

          if (owner) {
            _context.next = 7;
            break;
          }

          return _context.abrupt("return", res.json({
            error: "User not found"
          }));

        case 7:
          _context.next = 9;
          return regeneratorRuntime.awrap(bcrypt.compare(password, owner.password));

        case 9:
          isPasswordValid = _context.sent;

          if (isPasswordValid) {
            _context.next = 12;
            break;
          }

          return _context.abrupt("return", res.json({
            error: "Invalid password"
          }));

        case 12:
          _context.next = 14;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: owner.firstname
          }));

        case 14:
          restaurant = _context.sent;

          if (restaurant) {
            _context.next = 17;
            break;
          }

          return _context.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 17:
          token = generateToken(owner._id);
          return _context.abrupt("return", res.json({
            status: "ok",
            id: owner._id,
            token: token,
            resName: owner.firstname,
            restaurantId: restaurant._id,
            name: owner.firstname + " " + owner.lastname
          }));

        case 21:
          _context.prev = 21;
          _context.t0 = _context["catch"](1);
          return _context.abrupt("return", res.json({
            status: _context.t0.message
          }));

        case 24:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 21]]);
}); // Get owner by ID

app.get("/owner/:id", authenticateUser, function _callee2(req, res) {
  var ownerId, owner;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          ownerId = req.params.id;
          _context2.prev = 1;
          _context2.next = 4;
          return regeneratorRuntime.awrap(Ownerr.findById(ownerId));

        case 4:
          owner = _context2.sent;

          if (owner) {
            _context2.next = 7;
            break;
          }

          return _context2.abrupt("return", res.status(404).json({
            error: "Owner not found"
          }));

        case 7:
          return _context2.abrupt("return", res.json({
            id: owner._id
          }));

        case 10:
          _context2.prev = 10;
          _context2.t0 = _context2["catch"](1);
          return _context2.abrupt("return", res.status(500).json({
            error: _context2.t0.message
          }));

        case 13:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); //client

require("./clientDetails");

var Clientt = mongoose.model("ClientInfo");

var generateVerificationCode = function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit code
}; // Register client endpoint


app.post("/register-client", function _callee3(req, res) {
  var _req$body2, firstname, lastname, email, password, oldClient, verificationCode, encryptedPassword, newClient, transporter, mailOptions;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _req$body2 = req.body, firstname = _req$body2.firstname, lastname = _req$body2.lastname, email = _req$body2.email, password = _req$body2.password;
          _context3.prev = 1;
          _context3.next = 4;
          return regeneratorRuntime.awrap(Clientt.findOne({
            email: email
          }));

        case 4:
          oldClient = _context3.sent;

          if (!oldClient) {
            _context3.next = 7;
            break;
          }

          return _context3.abrupt("return", res.status(400).send({
            error: "User with the same email address already exists"
          }));

        case 7:
          verificationCode = generateVerificationCode(); // Generate verification code

          _context3.next = 10;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 10:
          encryptedPassword = _context3.sent;
          _context3.next = 13;
          return regeneratorRuntime.awrap(Clientt.create({
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: encryptedPassword,
            verificationCode: verificationCode,
            // Save verification code
            verificationCodeExpires: Date.now() + 30 * 60 * 1000 // Set expiration time (30 minutes)

          }));

        case 13:
          newClient = _context3.sent;
          // Send verification code to the user's email
          transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
              user: 'help.layla.restaurant@gmail.com',
              // Your Gmail email address
              pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password

            }
          }); // Configure email options

          mailOptions = {
            from: 'YazanResturant@gmail.com',
            to: email,
            subject: 'Account Verification',
            text: "Hello, Your verification code is: ".concat(verificationCode, ". Please use this code to complete your registration. It will expire in 30 minutes. If you didn't initiate this request, please ignore this message. Thank you, Layla Security Team.")
          }; // Send email

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
              res.status(500).json({
                error: 'Failed to send verification code'
              });
            } else {
              res.json({
                message: 'Verification code sent successfully'
              });
            }
          });
          return _context3.abrupt("return", res.send({
            status: "ok",
            message: "Verification code sent to your email"
          }));

        case 20:
          _context3.prev = 20;
          _context3.t0 = _context3["catch"](1);
          return _context3.abrupt("return", res.send({
            error: _context3.t0.message
          }));

        case 23:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[1, 20]]);
}); // Verify code endpoint

app.post("/verify-code/:email", function _callee4(req, res) {
  var verificationCode, email, client, token;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          verificationCode = req.body.verificationCode;
          email = req.params.email;
          _context4.prev = 2;
          _context4.next = 5;
          return regeneratorRuntime.awrap(Clientt.findOne({
            email: email
          }));

        case 5:
          client = _context4.sent;

          if (client) {
            _context4.next = 8;
            break;
          }

          return _context4.abrupt("return", res.status(404).json({
            error: "Client not found"
          }));

        case 8:
          if (!(client.verificationCode !== verificationCode)) {
            _context4.next = 10;
            break;
          }

          return _context4.abrupt("return", res.status(401).json({
            error: "Invalid verification code"
          }));

        case 10:
          if (!(client.verificationCodeExpires < Date.now())) {
            _context4.next = 12;
            break;
          }

          return _context4.abrupt("return", res.status(402).json({
            error: "Verification code has expired"
          }));

        case 12:
          // Update isCodeVerified field to true
          client.isCodeVerified = true;
          _context4.next = 15;
          return regeneratorRuntime.awrap(client.save());

        case 15:
          // Generate JWT token for the verified client
          token = jwt.sign({
            userId: client._id
          }, process.env.JWT_SECRET, {
            expiresIn: "1h"
          }); // Clear verification code and expiration

          client.verificationCode = undefined;
          client.verificationCodeExpires = undefined;
          _context4.next = 20;
          return regeneratorRuntime.awrap(client.save());

        case 20:
          return _context4.abrupt("return", res.send({
            status: "ok",
            token: token
          }));

        case 23:
          _context4.prev = 23;
          _context4.t0 = _context4["catch"](2);
          return _context4.abrupt("return", res.send({
            error: _context4.t0.message
          }));

        case 26:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[2, 23]]);
}); // Resend verification code endpoint

app.post("/resend-verification-code", function _callee5(req, res) {
  var email, client, verificationCode, transporter, mailOptions;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          email = req.body.email;
          _context5.prev = 1;
          _context5.next = 4;
          return regeneratorRuntime.awrap(Clientt.findOne({
            email: email
          }));

        case 4:
          client = _context5.sent;

          if (client) {
            _context5.next = 7;
            break;
          }

          return _context5.abrupt("return", res.status(404).json({
            error: "Client not found"
          }));

        case 7:
          // Generate a new verification code
          verificationCode = generateVerificationCode(); // Update the client's verification code and expiration

          client.verificationCode = verificationCode;
          client.verificationCodeExpires = Date.now() + 30 * 60 * 1000; // Set expiration time (30 minutes)

          _context5.next = 12;
          return regeneratorRuntime.awrap(client.save());

        case 12:
          // Send the new verification code to the user's email
          transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
              user: 'help.layla.restaurant@gmail.com',
              // Your Gmail email address
              pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password

            }
          }); // Configure email options

          mailOptions = {
            from: 'YazanResturant@gmail.com',
            to: email,
            subject: 'New Verification Code',
            text: "Hello, Your new verification code is: ".concat(verificationCode, ". Please use this code to complete your registration. It will expire in 30 minutes. If you didn't initiate this request, please ignore this message. Thank you, Layla Security Team.")
          }; // Send email

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
              res.status(500).json({
                error: 'Failed to send verification code'
              });
            } else {
              res.json({
                message: 'New verification code sent successfully'
              });
            }
          });
          _context5.next = 20;
          break;

        case 17:
          _context5.prev = 17;
          _context5.t0 = _context5["catch"](1);
          return _context5.abrupt("return", res.status(500).json({
            error: _context5.t0.message
          }));

        case 20:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[1, 17]]);
}); //login for the res owner

app.post("/login-client", function _callee6(req, res) {
  var _req$body3, email, password, client, isPasswordValid, token;

  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _req$body3 = req.body, email = _req$body3.email, password = _req$body3.password;
          _context6.prev = 1;
          _context6.next = 4;
          return regeneratorRuntime.awrap(Clientt.findOne({
            email: email
          }));

        case 4:
          client = _context6.sent;

          if (client) {
            _context6.next = 7;
            break;
          }

          return _context6.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 7:
          if (client.isCodeVerified) {
            _context6.next = 9;
            break;
          }

          return _context6.abrupt("return", res.status(403).json({
            error: "Verification code is not verified. Please verify your code first."
          }));

        case 9:
          _context6.next = 11;
          return regeneratorRuntime.awrap(bcrypt.compare(password, client.password));

        case 11:
          isPasswordValid = _context6.sent;

          if (isPasswordValid) {
            _context6.next = 14;
            break;
          }

          return _context6.abrupt("return", res.status(401).json({
            error: "Invalid password"
          }));

        case 14:
          _context6.next = 16;
          return regeneratorRuntime.awrap(Clientt.updateOne({
            email: email
          }, {
            isLoggedIn: true
          }));

        case 16:
          // Generate JWT token
          token = generateToken(client._id); // Send token in response

          return _context6.abrupt("return", res.status(200).json({
            status: "ok",
            token: token,
            userId: client._id,
            name: client.firstname + " " + client.lastname
          }));

        case 20:
          _context6.prev = 20;
          _context6.t0 = _context6["catch"](1);
          console.error(_context6.t0);
          return _context6.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 24:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[1, 20]]);
});
app.post('/check-email-exists', function _callee7(req, res) {
  var email, existingClient;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          email = req.body.email;
          _context7.prev = 1;
          _context7.next = 4;
          return regeneratorRuntime.awrap(Clientt.findOne({
            email: email
          }));

        case 4:
          existingClient = _context7.sent;

          if (!existingClient) {
            _context7.next = 7;
            break;
          }

          return _context7.abrupt("return", res.status(200).json({
            exists: true
          }));

        case 7:
          return _context7.abrupt("return", res.status(200).json({
            exists: false
          }));

        case 10:
          _context7.prev = 10;
          _context7.t0 = _context7["catch"](1);
          return _context7.abrupt("return", res.status(500).json({
            error: _context7.t0.message
          }));

        case 13:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); //admin processing

app.post("/admin/login", function _callee8(req, res) {
  var _req$body4, email, password, token;

  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _req$body4 = req.body, email = _req$body4.email, password = _req$body4.password;

          if (!(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD)) {
            _context8.next = 6;
            break;
          }

          token = generateToken(process.env.ADMIN_EMAIL);
          return _context8.abrupt("return", res.json({
            status: "ok",
            message: "Admin authenticated successfully",
            token: token
          }));

        case 6:
          return _context8.abrupt("return", res.status(401).json({
            error: "Invalid credentials"
          }));

        case 7:
        case "end":
          return _context8.stop();
      }
    }
  });
}); // Define middleware function to check admin authentication

var authenticateAdmin = function authenticateAdmin(req, res, next) {
  var _req$body5 = req.body,
    email = _req$body5.email,
    password = _req$body5.password;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    return res.status(401).json({
      error: "Unauthorized: Admin credentials required"
    });
  }
}; // heeere wee generate a random password


var generateRandomPassword = function generateRandomPassword() {
  // Generate a random string of 8 characters
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var password = '';

  for (var i = 0; i < 8; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return password;
}; // const Dish = mongoose.model("DishInfo");
// const MenuCategory = mongoose.model("MenuCategory");
// Middleware to add restaurant owner after adding a restaurant


var addRestaurantOwner = function addRestaurantOwner(req, res, next) {
  var restaurantName, password, email, encryptedPassword, owner;
  return regeneratorRuntime.async(function addRestaurantOwner$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          restaurantName = req.body.restaurantName;
          _context9.prev = 1;
          password = generateRandomPassword();
          email = "".concat(restaurantName.replace(/\s+/g, ''), "@delivery.com");
          _context9.next = 6;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 6:
          encryptedPassword = _context9.sent;
          // Create admin user for the restaurant
          owner = new Ownerr({
            firstname: restaurantName,
            // You can use restaurant name as owner's firstname
            lastname: "Owner",
            email: email,
            password: encryptedPassword
          });
          _context9.next = 10;
          return regeneratorRuntime.awrap(owner.save());

        case 10:
          req.generatedEmail = email;
          req.generatedPassword = password;
          next();
          _context9.next = 19;
          break;

        case 15:
          _context9.prev = 15;
          _context9.t0 = _context9["catch"](1);
          console.error(_context9.t0);
          return _context9.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 19:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[1, 15]]);
};

var favoriteSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  }
});
var Favorite = mongoose.model("Favorite", favoriteSchema);
module.exports = Favorite; // Create Restaurant model
// const Restaurant = mongoose.model("Restaurant", RestaurantSchema);
// Route to add a restaurant
// app.post("/add-restaurant", addRestaurantOwner, async (req, res) => {
//   const { restaurantName, base64Image, location, menu } = req.body;
//   console.log(req.body.menu[0].dishes[0]);
//   try {
//     const existingRestaurant = await Restaurant.findOne({ restaurantName });
//     if (existingRestaurant) {
//       return res.status(400).json({ error: "Restaurant with the same name already exists" });
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
//           optionalExtras: dishOptionalExtras,
//           requiredExtras: dishRequiredExtras // Add requiredExtras field
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
//     // Create a new restaurant instance
// const newRestaurant = new Restaurant({
//   restaurantName,
//   picture: base64Image,
//   location,
//   menu: menuCategories,
//   generatedEmail: req.generatedEmail,
//   generatedPassword: req.generatedPassword
// });
// // Save the new restaurant to the database
// await newRestaurant.save();
//     return res.status(201).json({
//       status: "ok",
//       message: "Restaurant added successfully",
// generatedEmail: req.generatedEmail,
// generatedPassword: req.generatedPassword
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// Define Dish Schema

var DishSchema = new mongoose.Schema({
  name: String,
  price: Number,
  dishImage: String,
  description: String,
  extras: {
    requiredExtras: [{
      name: String,
      price: Number
    }],
    optionalExtras: [{
      name: String,
      price: Number
    }]
  }
}); // Define Menu Category Schema
// Define Menu Category Schema

var MenuCategorySchema = new mongoose.Schema({
  categoryName: String,
  dishes: [{
    name: String,
    price: Number,
    dishImage: String,
    description: String,
    extras: {
      requiredExtras: [{
        name: String,
        price: Number
      }],
      optionalExtras: [{
        name: String,
        price: Number
      }]
    }
  }]
}); // Define Restaurant Schema

var RestaurantsSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: true
  },
  picture: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  coordinates: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  menu: [MenuCategorySchema],
  generatedEmail: {
    type: String,
    required: true
  },
  generatedPassword: {
    type: String,
    required: true
  },
  openingHours: {
    sunday: {
      open: {
        type: String,
        "default": "00:00"
      },
      // Default to midnight if not specified
      close: {
        type: String,
        "default": "00:00"
      } // Default to midnight if not specified

    },
    monday: {
      open: {
        type: String,
        "default": "00:00"
      },
      close: {
        type: String,
        "default": "00:00"
      }
    },
    tuesday: {
      open: {
        type: String,
        "default": "00:00"
      },
      close: {
        type: String,
        "default": "00:00"
      }
    },
    wednesday: {
      open: {
        type: String,
        "default": "00:00"
      },
      close: {
        type: String,
        "default": "00:00"
      }
    },
    thursday: {
      open: {
        type: String,
        "default": "00:00"
      },
      close: {
        type: String,
        "default": "00:00"
      }
    },
    friday: {
      open: {
        type: String,
        "default": "00:00"
      },
      close: {
        type: String,
        "default": "00:00"
      }
    },
    saturday: {
      open: {
        type: String,
        "default": "00:00"
      },
      close: {
        type: String,
        "default": "00:00"
      }
    }
  },
  // Status of the restaurant (open, close, busy, etc.)
  status: {
    type: String,
    "enum": ['open', 'closed', 'busy'],
    "default": 'open'
  }
}, {
  collection: "restaurantInfo"
});
var Restaurant = mongoose.model("RestaurantInfo", RestaurantsSchema); // Create Dish model

var Dish = mongoose.model("Dish", DishSchema); // Create Menu Category model
// const MenuCategory = mongoose.model("MenuCategory"\, MenuCategorySchema);

var MenuCategory = mongoose.model("MenuCategory", MenuCategorySchema);

var cron = require('node-cron'); // Import necessary modules
// Import the moment-timezone library


var moment = require('moment-timezone'); // Define the server timezone (e.g., 'Asia/Bahrain')


var serverTimezone = 'Asia/Bahrain'; // Set up the cron job to run every 3 minutes

cron.schedule('*/3 * * * *', function _callee9() {
  var currentTime, currentDay, currentHour, restaurants, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, restaurant, openingHours, open, close, openHour, closeHour;

  return regeneratorRuntime.async(function _callee9$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          // Get the current time in the server's timezone
          currentTime = moment().tz(serverTimezone); // Get the current day and hour

          currentDay = currentTime.format("dddd").toLowerCase();
          currentHour = currentTime.hour();
          console.log(currentHour); // Find all restaurants

          _context10.next = 7;
          return regeneratorRuntime.awrap(Restaurant.find());

        case 7:
          restaurants = _context10.sent;
          // Loop through each restaurant
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context10.prev = 11;
          _iterator = restaurants[Symbol.iterator]();

        case 13:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context10.next = 36;
            break;
          }

          restaurant = _step.value;
          // Check if the restaurant has opening hours for the current day
          openingHours = restaurant.openingHours[currentDay];

          if (!openingHours) {
            _context10.next = 33;
            break;
          }

          // Extract the open and close hours
          open = openingHours.open, close = openingHours.close; // Convert opening and closing hours to numerical values

          openHour = parseInt(open.split(":")[0], 10);
          closeHour = parseInt(close.split(":")[0], 10); // Update the status based on the current time

          if (!(currentHour >= openHour && currentHour < closeHour)) {
            _context10.next = 28;
            break;
          }

          if (!(restaurant.status !== 'open')) {
            _context10.next = 26;
            break;
          }

          restaurant.status = 'open';
          _context10.next = 25;
          return regeneratorRuntime.awrap(restaurant.save());

        case 25:
          console.log("Restaurant ".concat(restaurant.restaurantName, " is now open."));

        case 26:
          _context10.next = 33;
          break;

        case 28:
          if (!(restaurant.status !== 'closed')) {
            _context10.next = 33;
            break;
          }

          restaurant.status = 'closed';
          _context10.next = 32;
          return regeneratorRuntime.awrap(restaurant.save());

        case 32:
          console.log("Restaurant ".concat(restaurant.restaurantName, " is now closed."));

        case 33:
          _iteratorNormalCompletion = true;
          _context10.next = 13;
          break;

        case 36:
          _context10.next = 42;
          break;

        case 38:
          _context10.prev = 38;
          _context10.t0 = _context10["catch"](11);
          _didIteratorError = true;
          _iteratorError = _context10.t0;

        case 42:
          _context10.prev = 42;
          _context10.prev = 43;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 45:
          _context10.prev = 45;

          if (!_didIteratorError) {
            _context10.next = 48;
            break;
          }

          throw _iteratorError;

        case 48:
          return _context10.finish(45);

        case 49:
          return _context10.finish(42);

        case 50:
          _context10.next = 55;
          break;

        case 52:
          _context10.prev = 52;
          _context10.t1 = _context10["catch"](0);
          console.error('Error updating restaurant statuses:', _context10.t1);

        case 55:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[0, 52], [11, 38, 42, 50], [43, , 45, 49]]);
}); // API endpoint to change restaurant status to "busy"

app.put("/change-restaurant-status/:restaurantName/:status", function _callee10(req, res) {
  var _req$params, restaurantName, status, currentTime, currentDay, restaurant;

  return regeneratorRuntime.async(function _callee10$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _req$params = req.params, restaurantName = _req$params.restaurantName, status = _req$params.status;
          currentTime = moment().tz(serverTimezone);
          currentDay = currentTime.format("dddd");
          currentDay = currentDay.toLowerCase();
          console.log(currentDay);
          _context11.prev = 5;
          _context11.next = 8;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: restaurantName
          }));

        case 8:
          restaurant = _context11.sent;

          if (restaurant) {
            _context11.next = 11;
            break;
          }

          return _context11.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 11:
          // Change status to "busy"
          restaurant.status = status;
          _context11.next = 14;
          return regeneratorRuntime.awrap(restaurant.save());

        case 14:
          return _context11.abrupt("return", res.status(200).json({
            message: "Restaurant status changed to ".concat(status)
          }));

        case 17:
          _context11.prev = 17;
          _context11.t0 = _context11["catch"](5);
          console.error(_context11.t0);
          return _context11.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 21:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[5, 17]]);
}); // Define a route to retrieve the status of a restaurant

app.get("/restaurant-status/:restaurantName", function _callee11(req, res) {
  var restaurantName, restaurant, status;
  return regeneratorRuntime.async(function _callee11$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          restaurantName = req.params.restaurantName;
          _context12.prev = 1;
          _context12.next = 4;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: restaurantName
          }));

        case 4:
          restaurant = _context12.sent;

          if (restaurant) {
            _context12.next = 7;
            break;
          }

          return _context12.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 7:
          // Extract and return the status of the restaurant
          status = restaurant.status;
          return _context12.abrupt("return", res.status(200).json({
            status: status
          }));

        case 11:
          _context12.prev = 11;
          _context12.t0 = _context12["catch"](1);
          console.error(_context12.t0);
          return _context12.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 15:
        case "end":
          return _context12.stop();
      }
    }
  }, null, null, [[1, 11]]);
});
app.get("/all-restaurant-status", function _callee12(req, res) {
  var restaurants, restaurantStatuses;
  return regeneratorRuntime.async(function _callee12$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          _context13.prev = 0;
          _context13.next = 3;
          return regeneratorRuntime.awrap(Restaurant.find());

        case 3:
          restaurants = _context13.sent;

          if (!(!restaurants || restaurants.length === 0)) {
            _context13.next = 6;
            break;
          }

          return _context13.abrupt("return", res.status(404).json({
            error: "Restaurants not found"
          }));

        case 6:
          // Extract and return the status of each restaurant
          restaurantStatuses = restaurants.map(function (restaurant) {
            return {
              restaurantName: restaurant.restaurantName,
              status: restaurant.status
            };
          });
          return _context13.abrupt("return", res.status(200).json(restaurantStatuses));

        case 10:
          _context13.prev = 10;
          _context13.t0 = _context13["catch"](0);
          console.error(_context13.t0);
          return _context13.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 14:
        case "end":
          return _context13.stop();
      }
    }
  }, null, null, [[0, 10]]);
}); // Define a route to update the opening hours and status of a restaurant for any day

app.put("/update-opening-hours/:restaurantName/:day", function _callee13(req, res) {
  var _req$params2, restaurantName, day, _req$body6, open, close, validDays, restaurant;

  return regeneratorRuntime.async(function _callee13$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          _req$params2 = req.params, restaurantName = _req$params2.restaurantName, day = _req$params2.day;
          _req$body6 = req.body, open = _req$body6.open, close = _req$body6.close; // Define array of valid day values

          validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']; // Check if the provided day is a valid day

          if (validDays.includes(day)) {
            _context14.next = 5;
            break;
          }

          return _context14.abrupt("return", res.status(400).json({
            error: "Invalid day value"
          }));

        case 5:
          _context14.prev = 5;
          _context14.next = 8;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: restaurantName
          }));

        case 8:
          restaurant = _context14.sent;

          if (restaurant) {
            _context14.next = 11;
            break;
          }

          return _context14.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 11:
          // Update the opening hours for the specified day
          restaurant.openingHours[day] = {
            open: open,
            close: close
          }; // Save the updated restaurant document

          _context14.next = 14;
          return regeneratorRuntime.awrap(restaurant.save());

        case 14:
          return _context14.abrupt("return", res.status(200).json({
            message: "Opening hours for ".concat(day, " updated successfully")
          }));

        case 17:
          _context14.prev = 17;
          _context14.t0 = _context14["catch"](5);
          console.error(_context14.t0);
          return _context14.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 21:
        case "end":
          return _context14.stop();
      }
    }
  }, null, null, [[5, 17]]);
});

var axios = require('axios');

app.post("/add-restaurant", addRestaurantOwner, function _callee16(req, res) {
  var _req$body7, restaurantName, base64Image, location, menu, existingRestaurant, geocodingResponse, results, coordinates, menuCategories, newRestaurant;

  return regeneratorRuntime.async(function _callee16$(_context17) {
    while (1) {
      switch (_context17.prev = _context17.next) {
        case 0:
          _req$body7 = req.body, restaurantName = _req$body7.restaurantName, base64Image = _req$body7.base64Image, location = _req$body7.location, menu = _req$body7.menu;
          _context17.prev = 1;
          _context17.next = 4;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: restaurantName
          }));

        case 4:
          existingRestaurant = _context17.sent;

          if (!existingRestaurant) {
            _context17.next = 7;
            break;
          }

          return _context17.abrupt("return", res.status(400).json({
            error: "Restaurant with the same name already exists"
          }));

        case 7:
          _context17.next = 9;
          return regeneratorRuntime.awrap(axios.get("https://maps.googleapis.com/maps/api/geocode/json?address=".concat(encodeURIComponent(location), "&key=AIzaSyAS3sYiLZxlLVObHv7zP2Rrdcz3T2Sc6Vs")));

        case 9:
          geocodingResponse = _context17.sent;
          console.log(geocodingResponse.data);
          results = geocodingResponse.data.results;
          coordinates = results[0].geometry.location;
          _context17.next = 15;
          return regeneratorRuntime.awrap(Promise.all(menu && menu.map(function _callee15(categoryData) {
            var dishes, menuCategory;
            return regeneratorRuntime.async(function _callee15$(_context16) {
              while (1) {
                switch (_context16.prev = _context16.next) {
                  case 0:
                    _context16.next = 2;
                    return regeneratorRuntime.awrap(Promise.all(categoryData.dishes.map(function _callee14(dishData) {
                      var dish;
                      return regeneratorRuntime.async(function _callee14$(_context15) {
                        while (1) {
                          switch (_context15.prev = _context15.next) {
                            case 0:
                              dish = new Dish({
                                name: dishData.name,
                                price: dishData.price,
                                dishImage: dishData.dishImage,
                                description: dishData.description,
                                extras: {
                                  requiredExtras: dishData.requiredExtras,
                                  optionalExtras: dishData.optionalExtras
                                }
                              });
                              _context15.next = 3;
                              return regeneratorRuntime.awrap(dish.save());

                            case 3:
                              return _context15.abrupt("return", dish);

                            case 4:
                            case "end":
                              return _context15.stop();
                          }
                        }
                      });
                    })));

                  case 2:
                    dishes = _context16.sent;
                    menuCategory = new MenuCategory({
                      categoryName: categoryData.categoryName,
                      dishes: dishes
                    });
                    _context16.next = 6;
                    return regeneratorRuntime.awrap(menuCategory.save());

                  case 6:
                    return _context16.abrupt("return", menuCategory);

                  case 7:
                  case "end":
                    return _context16.stop();
                }
              }
            });
          })));

        case 15:
          menuCategories = _context17.sent;
          newRestaurant = new Restaurant({
            restaurantName: restaurantName,
            picture: base64Image,
            location: location,
            coordinates: {
              latitude: coordinates.lat,
              longitude: coordinates.lng
            },
            menu: menuCategories,
            generatedEmail: req.generatedEmail,
            generatedPassword: req.generatedPassword
          }); // Save the new restaurant to the database

          _context17.next = 19;
          return regeneratorRuntime.awrap(newRestaurant.save());

        case 19:
          return _context17.abrupt("return", res.status(201).json({
            status: "ok",
            message: "Restaurant added successfully",
            generatedEmail: req.generatedEmail,
            generatedPassword: req.generatedPassword
          }));

        case 22:
          _context17.prev = 22;
          _context17.t0 = _context17["catch"](1);
          console.error(_context17.t0);
          return _context17.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 26:
        case "end":
          return _context17.stop();
      }
    }
  }, null, null, [[1, 22]]);
});
app.post("/add-to-favorites/:customerId", function _callee17(req, res) {
  var customerId, restaurantName, existingFavorite, favorite;
  return regeneratorRuntime.async(function _callee17$(_context18) {
    while (1) {
      switch (_context18.prev = _context18.next) {
        case 0:
          _context18.prev = 0;
          customerId = req.params.customerId;
          restaurantName = req.body.restaurantName;
          _context18.next = 5;
          return regeneratorRuntime.awrap(Favorite.findOne({
            restaurantName: restaurantName,
            customerId: customerId
          }));

        case 5:
          existingFavorite = _context18.sent;

          if (!existingFavorite) {
            _context18.next = 8;
            break;
          }

          return _context18.abrupt("return", res.status(400).json({
            error: "Restaurant already in favorites"
          }));

        case 8:
          favorite = new Favorite({
            customerId: customerId,
            restaurantName: restaurantName
          });
          _context18.next = 11;
          return regeneratorRuntime.awrap(favorite.save());

        case 11:
          broadcastFavoritesUpdated();
          res.status(201).send(favorite);
          _context18.next = 18;
          break;

        case 15:
          _context18.prev = 15;
          _context18.t0 = _context18["catch"](0);
          res.status(500).send(_context18.t0.message);

        case 18:
        case "end":
          return _context18.stop();
      }
    }
  }, null, null, [[0, 15]]);
});
app.get("/favorites/:customerId", function _callee18(req, res) {
  var customerId, favorites;
  return regeneratorRuntime.async(function _callee18$(_context19) {
    while (1) {
      switch (_context19.prev = _context19.next) {
        case 0:
          _context19.prev = 0;
          customerId = req.params.customerId;
          _context19.next = 4;
          return regeneratorRuntime.awrap(Favorite.find({
            customerId: customerId
          }));

        case 4:
          favorites = _context19.sent;
          res.send(favorites);
          _context19.next = 11;
          break;

        case 8:
          _context19.prev = 8;
          _context19.t0 = _context19["catch"](0);
          res.status(500).send(_context19.t0.message);

        case 11:
        case "end":
          return _context19.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
app["delete"]("/remove-from-favorites/:customerId", function _callee19(req, res) {
  var customerId, restaurantName;
  return regeneratorRuntime.async(function _callee19$(_context20) {
    while (1) {
      switch (_context20.prev = _context20.next) {
        case 0:
          _context20.prev = 0;
          customerId = req.params.customerId;
          restaurantName = req.body.restaurantName;
          _context20.next = 5;
          return regeneratorRuntime.awrap(Favorite.findOneAndDelete({
            customerId: customerId,
            restaurantName: restaurantName
          }));

        case 5:
          // Use an object to specify the query
          res.send({
            message: "Favorite removed successfully"
          });
          _context20.next = 11;
          break;

        case 8:
          _context20.prev = 8;
          _context20.t0 = _context20["catch"](0);
          res.status(500).send(_context20.t0.message);

        case 11:
        case "end":
          return _context20.stop();
      }
    }
  }, null, null, [[0, 8]]);
}); //update restaurant
// Route to update a restaurant

app.put("/update-restaurant/:resName", function _callee22(req, res) {
  var resName, _req$body8, newRestaurantName, newBase64Image, newLocation, newMenu, restaurant, owner, menuCategories;

  return regeneratorRuntime.async(function _callee22$(_context23) {
    while (1) {
      switch (_context23.prev = _context23.next) {
        case 0:
          resName = req.params.resName;
          _req$body8 = req.body, newRestaurantName = _req$body8.newRestaurantName, newBase64Image = _req$body8.newBase64Image, newLocation = _req$body8.newLocation, newMenu = _req$body8.newMenu;
          _context23.prev = 2;
          _context23.next = 5;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: resName
          }));

        case 5:
          restaurant = _context23.sent;

          if (restaurant) {
            _context23.next = 8;
            break;
          }

          return _context23.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 8:
          if (!newRestaurantName) {
            _context23.next = 13;
            break;
          }

          restaurant.restaurantName = newRestaurantName; // Update the owner's firstname with the new restaurant name

          _context23.next = 12;
          return regeneratorRuntime.awrap(Ownerr.findOneAndUpdate({
            firstname: resName
          }, // Query to find the owner by the current restaurant name
            {
              firstname: newRestaurantName
            }, // Update the owner's firstname with the new restaurant name
            {
              "new": true
            } // To return the updated document
          ));

        case 12:
          owner = _context23.sent;

        case 13:
          if (newBase64Image) {
            restaurant.picture = newBase64Image;
          }

          if (newLocation) {
            restaurant.location = newLocation;
          }

          if (!newMenu) {
            _context23.next = 21;
            break;
          }

          // Clear existing menu categories and dishes
          restaurant.menu = []; // Construct new menu categories with dishes

          _context23.next = 19;
          return regeneratorRuntime.awrap(Promise.all(newMenu.map(function _callee21(category) {
            var dishes, menuCategory;
            return regeneratorRuntime.async(function _callee21$(_context22) {
              while (1) {
                switch (_context22.prev = _context22.next) {
                  case 0:
                    _context22.next = 2;
                    return regeneratorRuntime.awrap(Promise.all(category.dishes.map(function _callee20(dishData) {
                      var dishExtras, dish;
                      return regeneratorRuntime.async(function _callee20$(_context21) {
                        while (1) {
                          switch (_context21.prev = _context21.next) {
                            case 0:
                              dishExtras = dishData.extras && dishData.extras.map(function (extra) {
                                return {
                                  name: extra.name,
                                  price: extra.price
                                };
                              });
                              dish = new Dish({
                                name: dishData.name,
                                price: dishData.price,
                                dishImage: dishData.dishImage,
                                description: dishData.description,
                                extras: dishExtras
                              });
                              _context21.next = 4;
                              return regeneratorRuntime.awrap(dish.save());

                            case 4:
                              return _context21.abrupt("return", dish);

                            case 5:
                            case "end":
                              return _context21.stop();
                          }
                        }
                      });
                    })));

                  case 2:
                    dishes = _context22.sent;
                    menuCategory = new MenuCategory({
                      categoryName: category.categoryName,
                      dishes: dishes
                    });
                    _context22.next = 6;
                    return regeneratorRuntime.awrap(menuCategory.save());

                  case 6:
                    return _context22.abrupt("return", menuCategory);

                  case 7:
                  case "end":
                    return _context22.stop();
                }
              }
            });
          })));

        case 19:
          menuCategories = _context23.sent;
          restaurant.menu = menuCategories;

        case 21:
          _context23.next = 23;
          return regeneratorRuntime.awrap(restaurant.save());

        case 23:
          return _context23.abrupt("return", res.status(200).json({
            status: "ok",
            message: "Restaurant updated successfully",
            resName: newRestaurantName,
            name: newRestaurantName + " " + "Owner"
          }));

        case 26:
          _context23.prev = 26;
          _context23.t0 = _context23["catch"](2);
          console.error("Error updating restaurant:", _context23.t0);
          return _context23.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 30:
        case "end":
          return _context23.stop();
      }
    }
  }, null, null, [[2, 26]]);
}); // API endpoint to add dishes and menu items to an existing restaurant

app.post("/add-menu-to-restaurant/:restaurantName", function _callee25(req, res) {
  var restaurantName, menu, _existingRestaurant$m, existingRestaurant, menuCategories;

  return regeneratorRuntime.async(function _callee25$(_context26) {
    while (1) {
      switch (_context26.prev = _context26.next) {
        case 0:
          restaurantName = req.params.restaurantName;
          menu = req.body.menu;
          _context26.prev = 2;
          _context26.next = 5;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: restaurantName
          }));

        case 5:
          existingRestaurant = _context26.sent;

          if (existingRestaurant) {
            _context26.next = 8;
            break;
          }

          return _context26.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 8:
          _context26.next = 10;
          return regeneratorRuntime.awrap(Promise.all(menu && menu.map(function _callee24(category) {
            var dishes, menuCategory;
            return regeneratorRuntime.async(function _callee24$(_context25) {
              while (1) {
                switch (_context25.prev = _context25.next) {
                  case 0:
                    _context25.next = 2;
                    return regeneratorRuntime.awrap(Promise.all(category.dishes && category.dishes.map(function _callee23(dishData) {
                      var dishOptionalExtras, dishRequiredExtras, dish;
                      return regeneratorRuntime.async(function _callee23$(_context24) {
                        while (1) {
                          switch (_context24.prev = _context24.next) {
                            case 0:
                              dishOptionalExtras = dishData.optionalExtras && dishData.optionalExtras.map(function (optionalExtra) {
                                return {
                                  name: optionalExtra.name,
                                  price: optionalExtra.price
                                };
                              });
                              dishRequiredExtras = dishData.requiredExtras && dishData.requiredExtras.map(function (requiredExtra) {
                                return {
                                  name: requiredExtra.name,
                                  price: requiredExtra.price
                                };
                              });
                              dish = new Dish({
                                name: dishData.name,
                                price: dishData.price,
                                dishImage: dishData.dishImage,
                                description: dishData.description,
                                optionalExtras: dishOptionalExtras,
                                requiredExtras: dishRequiredExtras // Add requiredExtras field

                              });
                              _context24.next = 5;
                              return regeneratorRuntime.awrap(dish.save());

                            case 5:
                              return _context24.abrupt("return", dish);

                            case 6:
                            case "end":
                              return _context24.stop();
                          }
                        }
                      });
                    })));

                  case 2:
                    dishes = _context25.sent;
                    menuCategory = new MenuCategory({
                      categoryName: category.categoryName,
                      dishes: dishes
                    });
                    _context25.next = 6;
                    return regeneratorRuntime.awrap(menuCategory.save());

                  case 6:
                    return _context25.abrupt("return", menuCategory);

                  case 7:
                  case "end":
                    return _context25.stop();
                }
              }
            });
          })));

        case 10:
          menuCategories = _context26.sent;

          // Add new menu categories to the existing restaurant
          (_existingRestaurant$m = existingRestaurant.menu).push.apply(_existingRestaurant$m, _toConsumableArray(menuCategories));

          _context26.next = 14;
          return regeneratorRuntime.awrap(existingRestaurant.save());

        case 14:
          return _context26.abrupt("return", res.status(201).json({
            status: "ok",
            message: "Menu items added to the restaurant successfully"
          }));

        case 17:
          _context26.prev = 17;
          _context26.t0 = _context26["catch"](2);
          console.error(_context26.t0);
          return _context26.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 21:
        case "end":
          return _context26.stop();
      }
    }
  }, null, null, [[2, 17]]);
});
app.put("/update-dish/:resName/:categoryName/:dishId", authenticateUser, refreshAuthToken, function _callee26(req, res) {
  var _req$params3, resName, categoryName, dishId, _req$body9, name, price, description, dishImage, restaurant, category, dish;

  return regeneratorRuntime.async(function _callee26$(_context27) {
    while (1) {
      switch (_context27.prev = _context27.next) {
        case 0:
          _req$params3 = req.params, resName = _req$params3.resName, categoryName = _req$params3.categoryName, dishId = _req$params3.dishId;
          _req$body9 = req.body, name = _req$body9.name, price = _req$body9.price, description = _req$body9.description, dishImage = _req$body9.dishImage;
          _context27.prev = 2;
          _context27.next = 5;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: resName
          }));

        case 5:
          restaurant = _context27.sent;

          if (restaurant) {
            _context27.next = 8;
            break;
          }

          return _context27.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 8:
          // Find the menu category by category name
          category = restaurant.menu.find(function (cat) {
            return cat.categoryName === categoryName;
          });

          if (category) {
            _context27.next = 11;
            break;
          }

          return _context27.abrupt("return", res.status(404).json({
            error: "Category not found"
          }));

        case 11:
          // Find the dish in the category's dishes array by dish id
          dish = category.dishes.id(dishId);

          if (dish) {
            _context27.next = 14;
            break;
          }

          return _context27.abrupt("return", res.status(404).json({
            error: "Dish not found"
          }));

        case 14:
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

          if (dishImage) {
            dish.dishImage = dishImage;
          } // Save the updated restaurant


          _context27.next = 20;
          return regeneratorRuntime.awrap(restaurant.save());

        case 20:
          return _context27.abrupt("return", res.status(200).json({
            status: "ok",
            message: "Dish updated successfully",
            data: dish
          }));

        case 23:
          _context27.prev = 23;
          _context27.t0 = _context27["catch"](2);
          console.error("Error updating dish:", _context27.t0);
          return _context27.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 27:
        case "end":
          return _context27.stop();
      }
    }
  }, null, null, [[2, 23]]);
});
app["delete"]("/delete-dish/:resName/:categoryName/:dishId", function _callee27(req, res) {
  var _req$params4, resName, categoryName, dishId, restaurant, category, dishIndex;

  return regeneratorRuntime.async(function _callee27$(_context28) {
    while (1) {
      switch (_context28.prev = _context28.next) {
        case 0:
          _req$params4 = req.params, resName = _req$params4.resName, categoryName = _req$params4.categoryName, dishId = _req$params4.dishId;
          _context28.prev = 1;
          _context28.next = 4;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: resName
          }));

        case 4:
          restaurant = _context28.sent;

          if (restaurant) {
            _context28.next = 7;
            break;
          }

          return _context28.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 7:
          // Find the category by name
          category = restaurant.menu.find(function (cat) {
            return cat.categoryName === categoryName;
          });

          if (category) {
            _context28.next = 10;
            break;
          }

          return _context28.abrupt("return", res.status(404).json({
            error: "Category not found"
          }));

        case 10:
          // Find the dish index in the category's dishes array
          dishIndex = category.dishes.findIndex(function (d) {
            return d._id.toString() === dishId;
          });

          if (!(dishIndex === -1)) {
            _context28.next = 13;
            break;
          }

          return _context28.abrupt("return", res.status(404).json({
            error: "Dish not found"
          }));

        case 13:
          // Delete the dish from the category's dishes array
          category.dishes.splice(dishIndex, 1); // Save the updated restaurant

          _context28.next = 16;
          return regeneratorRuntime.awrap(restaurant.save());

        case 16:
          return _context28.abrupt("return", res.status(200).json({
            status: "ok",
            message: "Dish deleted successfully"
          }));

        case 19:
          _context28.prev = 19;
          _context28.t0 = _context28["catch"](1);
          console.error("Error deleting dish:", _context28.t0);
          return _context28.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 23:
        case "end":
          return _context28.stop();
      }
    }
  }, null, null, [[1, 19]]);
}); // delete restaurant
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

app["delete"]("/delete-restaurant/:resName", function _callee28(req, res) {
  var resName, restaurant;
  return regeneratorRuntime.async(function _callee28$(_context29) {
    while (1) {
      switch (_context29.prev = _context29.next) {
        case 0:
          resName = req.params.resName;
          _context29.prev = 1;
          _context29.next = 4;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: resName
          }));

        case 4:
          restaurant = _context29.sent;

          if (restaurant) {
            _context29.next = 7;
            break;
          }

          return _context29.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 7:
          _context29.next = 9;
          return regeneratorRuntime.awrap(Ownerr.deleteOne({
            firstname: resName
          }));

        case 9:
          _context29.next = 11;
          return regeneratorRuntime.awrap(Restaurant.deleteOne({
            restaurantName: resName
          }));

        case 11:
          return _context29.abrupt("return", res.status(200).json({
            status: "ok",
            message: "Restaurant deleted successfully"
          }));

        case 14:
          _context29.prev = 14;
          _context29.t0 = _context29["catch"](1);
          console.error("Error deleting restaurant:", _context29.t0);
          return _context29.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 18:
        case "end":
          return _context29.stop();
      }
    }
  }, null, null, [[1, 14]]);
});
app.get("/get-one-res/:resName", authenticateUser, refreshAuthToken, function _callee29(req, res) {
  var resName, restaurant;
  return regeneratorRuntime.async(function _callee29$(_context30) {
    while (1) {
      switch (_context30.prev = _context30.next) {
        case 0:
          resName = req.params.resName;
          console.log("Received resName:", resName); // Log the received resName

          _context30.prev = 2;
          _context30.next = 5;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: resName
          }));

        case 5:
          restaurant = _context30.sent;

          if (restaurant) {
            _context30.next = 8;
            break;
          }

          return _context30.abrupt("return", res.status(404).json({
            status: "error",
            message: "Restaurant not found"
          }));

        case 8:
          res.status(200).json({
            status: "ok",
            data: restaurant
          });
          _context30.next = 15;
          break;

        case 11:
          _context30.prev = 11;
          _context30.t0 = _context30["catch"](2);
          console.error("Error fetching restaurant:", _context30.t0);
          res.status(500).json({
            status: "error",
            message: "Internal Server Error"
          });

        case 15:
        case "end":
          return _context30.stop();
      }
    }
  }, null, null, [[2, 11]]);
});
app.get("/get-restaurants", function _callee30(req, res) {
  var restaurants;
  return regeneratorRuntime.async(function _callee30$(_context31) {
    while (1) {
      switch (_context31.prev = _context31.next) {
        case 0:
          _context31.prev = 0;
          _context31.next = 3;
          return regeneratorRuntime.awrap(Restaurant.find());

        case 3:
          restaurants = _context31.sent;
          return _context31.abrupt("return", res.status(200).json({
            status: "ok",
            data: restaurants
          }));

        case 7:
          _context31.prev = 7;
          _context31.t0 = _context31["catch"](0);
          console.error(_context31.t0);
          return _context31.abrupt("return", res.status(500).json({
            status: "error",
            message: "An error occurred while getting restaurants"
          }));

        case 11:
        case "end":
          return _context31.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); // const CartSchema = new mongoose.Schema({
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

var CartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
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
      "default": []
    }
  }]
});
var Cart = mongoose.model("Cart", CartSchema);
app.post("/add-to-cart/:customerId", function _callee31(req, res) {
  var _req$body10, productId, quantity, name, description, price, extras, customerId, cart, existingProductIndex;

  return regeneratorRuntime.async(function _callee31$(_context32) {
    while (1) {
      switch (_context32.prev = _context32.next) {
        case 0:
          _req$body10 = req.body, productId = _req$body10.productId, quantity = _req$body10.quantity, name = _req$body10.name, description = _req$body10.description, price = _req$body10.price, extras = _req$body10.extras;
          customerId = req.params.customerId;
          _context32.prev = 2;
          _context32.next = 5;
          return regeneratorRuntime.awrap(Cart.findOne({
            customerId: customerId
          }));

        case 5:
          cart = _context32.sent;

          if (!cart) {
            cart = new Cart({
              customerId: customerId,
              products: []
            });
          }

          existingProductIndex = cart.products.findIndex(function (product) {
            return product.productId.toString() === productId;
          });

          if (existingProductIndex !== -1) {
            // If product exists, update its quantity
            cart.products[existingProductIndex].quantity += quantity;
          } else {
            // If product does not exist, add it with given quantity, name, description, price, and extras
            cart.products.push({
              productId: productId,
              quantity: quantity,
              name: name,
              description: description,
              price: price,
              extras: extras
            });
          }

          _context32.next = 11;
          return regeneratorRuntime.awrap(cart.save());

        case 11:
          broadcastCartUpdated();
          res.status(200).json({
            status: "ok",
            message: "Product added to cart",
            id: cart.customerId,
            products: cart.products
          });
          _context32.next = 19;
          break;

        case 15:
          _context32.prev = 15;
          _context32.t0 = _context32["catch"](2);
          console.error("Error adding product to cart:", _context32.t0);
          res.status(500).json({
            error: "Internal Server Error"
          });

        case 19:
        case "end":
          return _context32.stop();
      }
    }
  }, null, null, [[2, 15]]);
}); ///clear
// authenticateUser, refreshAuthToken

app["delete"]("/clear-cart/:customerId", function _callee32(req, res) {
  var customerId, cart;
  return regeneratorRuntime.async(function _callee32$(_context33) {
    while (1) {
      switch (_context33.prev = _context33.next) {
        case 0:
          customerId = req.params.customerId;
          _context33.prev = 1;
          _context33.next = 4;
          return regeneratorRuntime.awrap(Cart.findOne({
            customerId: customerId
          }));

        case 4:
          cart = _context33.sent;

          if (cart) {
            _context33.next = 7;
            break;
          }

          return _context33.abrupt("return", res.status(404).json({
            error: "Cart not found"
          }));

        case 7:
          // Clear all products from the cart
          cart.products = [];
          _context33.next = 10;
          return regeneratorRuntime.awrap(cart.save());

        case 10:
          res.status(200).json({
            status: "ok",
            message: "Cart cleared successfully"
          });
          _context33.next = 17;
          break;

        case 13:
          _context33.prev = 13;
          _context33.t0 = _context33["catch"](1);
          console.error("Error clearing cart:", _context33.t0);
          res.status(500).json({
            error: "Internal Server Error"
          });

        case 17:
        case "end":
          return _context33.stop();
      }
    }
  }, null, null, [[1, 13]]);
}); // delete from cart

app["delete"]("/remove-from-cart/:productId/:customerId", function _callee33(req, res) {
  var _req$params5, productId, customerId, cart, productIndex;

  return regeneratorRuntime.async(function _callee33$(_context34) {
    while (1) {
      switch (_context34.prev = _context34.next) {
        case 0:
          _req$params5 = req.params, productId = _req$params5.productId, customerId = _req$params5.customerId;
          _context34.prev = 1;
          _context34.next = 4;
          return regeneratorRuntime.awrap(Cart.findOne({
            customerId: customerId
          }));

        case 4:
          cart = _context34.sent;

          if (cart) {
            _context34.next = 7;
            break;
          }

          return _context34.abrupt("return", res.status(404).json({
            error: "Cart not found"
          }));

        case 7:
          productIndex = cart.products.findIndex(function (product) {
            return product.productId.toString() === productId;
          });

          if (!(productIndex === -1)) {
            _context34.next = 10;
            break;
          }

          return _context34.abrupt("return", res.status(404).json({
            error: "Product not found in the cart"
          }));

        case 10:
          cart.products.splice(productIndex, 1);
          _context34.next = 13;
          return regeneratorRuntime.awrap(cart.save());

        case 13:
          res.status(200).json({
            status: "ok",
            message: "Product removed from cart",
            id: cart.customerId,
            products: cart.products
          });
          _context34.next = 20;
          break;

        case 16:
          _context34.prev = 16;
          _context34.t0 = _context34["catch"](1);
          console.error("Error removing product from cart:", _context34.t0);
          res.status(500).json({
            error: "Internal Server Error"
          });

        case 20:
        case "end":
          return _context34.stop();
      }
    }
  }, null, null, [[1, 16]]);
}); // app.get("/get-cart/:customerId", async (req, res) => {
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

app.get("/get-cart/:customerId", function _callee34(req, res) {
  var customerId, cart, totalItemsCount;
  return regeneratorRuntime.async(function _callee34$(_context35) {
    while (1) {
      switch (_context35.prev = _context35.next) {
        case 0:
          customerId = req.params.customerId;
          _context35.prev = 1;
          _context35.next = 4;
          return regeneratorRuntime.awrap(Cart.findOne({
            customerId: customerId
          }));

        case 4:
          cart = _context35.sent;

          if (cart) {
            _context35.next = 7;
            break;
          }

          return _context35.abrupt("return", res.status(404).json({
            error: "Cart not found"
          }));

        case 7:
          totalItemsCount = cart.products.reduce(function (acc, product) {
            return acc + product.quantity;
          }, 0); // Send WebSocket message to notify clients of cart update

          wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send('cartUpdated');
            }
          });
          res.status(200).json({
            cart: cart,
            totalItemsCount: totalItemsCount
          });
          _context35.next = 16;
          break;

        case 12:
          _context35.prev = 12;
          _context35.t0 = _context35["catch"](1);
          console.error("Error fetching cart:", _context35.t0);
          res.status(500).json({
            error: "Internal Server Error"
          });

        case 16:
        case "end":
          return _context35.stop();
      }
    }
  }, null, null, [[1, 12]]);
}); //get dish by its id
//get dish by its id
// Endpoint to get a dish by its ID

app.get("/dishes/:dishId", function _callee35(req, res) {
  var dishId, dish;
  return regeneratorRuntime.async(function _callee35$(_context36) {
    while (1) {
      switch (_context36.prev = _context36.next) {
        case 0:
          dishId = req.params.dishId;
          _context36.prev = 1;
          _context36.next = 4;
          return regeneratorRuntime.awrap(Dish.findById(dishId));

        case 4:
          dish = _context36.sent;

          if (dish) {
            _context36.next = 7;
            break;
          }

          return _context36.abrupt("return", res.status(404).json({
            error: "Dish not found"
          }));

        case 7:
          return _context36.abrupt("return", res.status(200).json({
            status: "ok",
            data: dish
          }));

        case 10:
          _context36.prev = 10;
          _context36.t0 = _context36["catch"](1);
          console.error(_context36.t0);
          return _context36.abrupt("return", res.status(500).json({
            status: "error",
            message: "An error occurred while fetching the dish"
          }));

        case 14:
        case "end":
          return _context36.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); // orders proccessing
// Define Order Schema
// Define Order Schema

var OrderSchema = new mongoose.Schema({
  orderId: String,
  restaurantId: String,
  // Added restaurantId field
  resName: String,
  customerId: String,
  products: [{
    productId: String,
    quantity: Number,
    price: Number,
    name: String,
    extras: {
      type: [{
        name: String,
        price: Number
      }],
      "default": []
    }
  }],
  status: String,
  shippingOption: String,
  // Added shippingOption field
  orderLocation: {
    // Added orderLocation field
    type: {
      type: String,
      "enum": ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  preparingTime: Number,
  preparingStartedAt: Date,
  createdAt: {
    type: Date,
    "default": Date.now
  },
  orderTime: Date,
  completedAt: Date,
  declinedAt: Date
});
OrderSchema.index({
  orderLocation: "2dsphere"
}); // Add geospatial index for orderLocation

OrderSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next();
  }

  this.orderTime = new Date();
  next();
});

OrderSchema.statics.updateOrderStatus = function _callee36(orderId, newStatus) {
  var order;
  return regeneratorRuntime.async(function _callee36$(_context37) {
    while (1) {
      switch (_context37.prev = _context37.next) {
        case 0:
          _context37.prev = 0;
          _context37.next = 3;
          return regeneratorRuntime.awrap(this.findOneAndUpdate({
            orderId: orderId
          }, {
            status: newStatus
          }, {
            "new": true
          }));

        case 3:
          order = _context37.sent;

          if (order) {
            _context37.next = 6;
            break;
          }

          throw new Error('Order not found');

        case 6:
          return _context37.abrupt("return", {
            message: 'Order status updated successfully'
          });

        case 9:
          _context37.prev = 9;
          _context37.t0 = _context37["catch"](0);
          throw _context37.t0;

        case 12:
        case "end":
          return _context37.stop();
      }
    }
  }, null, this, [[0, 9]]);
};

OrderSchema.statics.checkOrderStatus = function _callee37(orderId) {
  var order;
  return regeneratorRuntime.async(function _callee37$(_context38) {
    while (1) {
      switch (_context38.prev = _context38.next) {
        case 0:
          _context38.prev = 0;
          _context38.next = 3;
          return regeneratorRuntime.awrap(this.findOne({
            orderId: orderId
          }));

        case 3:
          order = _context38.sent;

          if (order) {
            _context38.next = 6;
            break;
          }

          throw new Error('Order not found');

        case 6:
          return _context38.abrupt("return", {
            orderId: order.orderId,
            status: order.status
          });

        case 9:
          _context38.prev = 9;
          _context38.t0 = _context38["catch"](0);
          throw _context38.t0;

        case 12:
        case "end":
          return _context38.stop();
      }
    }
  }, null, this, [[0, 9]]);
}; // Create Order model


var Order = mongoose.model("Order", OrderSchema); // Endpoint to create an order

app.post("/create-order/:customerId", function _callee38(req, res) {
  var customerId, _req$body11, products, status, shippingOption, resName, orderLocation, restaurant, restaurantCoordinates, geocodingResponse, results, orderId, order;

  return regeneratorRuntime.async(function _callee38$(_context39) {
    while (1) {
      switch (_context39.prev = _context39.next) {
        case 0:
          customerId = req.params.customerId;
          _context39.prev = 1;
          _req$body11 = req.body, products = _req$body11.products, status = _req$body11.status, shippingOption = _req$body11.shippingOption, resName = _req$body11.resName;
          _context39.next = 5;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: resName
          }));

        case 5:
          restaurant = _context39.sent;

          if (restaurant) {
            _context39.next = 8;
            break;
          }

          return _context39.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 8:
          // Get the restaurant coordinates
          restaurantCoordinates = restaurant.coordinates; // Determine the order location based on the shipping option

          if (!(shippingOption === 'self-pickup')) {
            _context39.next = 13;
            break;
          }

          // Set the order location as the restaurant coordinates for self-pickup
          orderLocation = restaurantCoordinates;
          _context39.next = 22;
          break;

        case 13:
          if (!(shippingOption === 'delivery')) {
            _context39.next = 21;
            break;
          }

          _context39.next = 16;
          return regeneratorRuntime.awrap(axios.get("https://maps.googleapis.com/maps/api/geocode/json?address=".concat(encodeURIComponent(req.body.userLocation), "&key=AIzaSyAS3sYiLZxlLVObHv7zP2Rrdcz3T2Sc6Vs")));

        case 16:
          geocodingResponse = _context39.sent;
          results = geocodingResponse.data.results;
          orderLocation = results[0].geometry.location;
          _context39.next = 22;
          break;

        case 21:
          return _context39.abrupt("return", res.status(400).json({
            error: "Invalid shipping option"
          }));

        case 22:
          orderId = generateRandomOrderId(); // Generate a random orderId

          order = new Order({
            orderId: orderId,
            resName: resName,
            customerId: customerId,
            products: products,
            status: status,
            shippingOption: shippingOption,
            orderLocation: orderLocation,
            // Store the order location
            createdAt: new Date(),
            // Set createdAt field to current date and time
            orderTime: new Date() // Set orderTime field to current date and time

          });
          _context39.next = 26;
          return regeneratorRuntime.awrap(order.save());

        case 26:
          _context39.next = 28;
          return regeneratorRuntime.awrap(Cart.deleteOne({
            customerId: customerId
          }));

        case 28:
          return _context39.abrupt("return", res.status(201).json({
            status: "ok",
            message: "Order created successfully",
            order: order
          }));

        case 31:
          _context39.prev = 31;
          _context39.t0 = _context39["catch"](1);
          console.error(_context39.t0);
          return _context39.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 35:
        case "end":
          return _context39.stop();
      }
    }
  }, null, null, [[1, 31]]);
});

function generateRandomOrderId() {
  var timestamp = Date.now().toString(36);
  var randomString = Math.random().toString(36).substr(2, 5);
  return timestamp + randomString;
} // Endpoint to get all orders


app.get("/orders", function _callee39(req, res) {
  var orders;
  return regeneratorRuntime.async(function _callee39$(_context40) {
    while (1) {
      switch (_context40.prev = _context40.next) {
        case 0:
          _context40.prev = 0;
          _context40.next = 3;
          return regeneratorRuntime.awrap(Order.find());

        case 3:
          orders = _context40.sent;
          return _context40.abrupt("return", res.status(200).json({
            status: "ok",
            orders: orders
          }));

        case 7:
          _context40.prev = 7;
          _context40.t0 = _context40["catch"](0);
          console.error(_context40.t0);
          return _context40.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 11:
        case "end":
          return _context40.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); //get owner orders of his restaurant
// Endpoint to get orders by resName

app.get("/orders/:resName", function _callee40(req, res) {
  var resName, orders;
  return regeneratorRuntime.async(function _callee40$(_context41) {
    while (1) {
      switch (_context41.prev = _context41.next) {
        case 0:
          resName = req.params.resName;
          _context41.prev = 1;
          _context41.next = 4;
          return regeneratorRuntime.awrap(Order.find({
            resName: resName
          }));

        case 4:
          orders = _context41.sent;

          if (!(orders.length === 0)) {
            _context41.next = 7;
            break;
          }

          return _context41.abrupt("return", res.status(404).json({
            status: "error",
            message: "No orders found for the specified restaurant name"
          }));

        case 7:
          return _context41.abrupt("return", res.status(200).json({
            status: "ok",
            orders: orders
          }));

        case 10:
          _context41.prev = 10;
          _context41.t0 = _context41["catch"](1);
          console.error(_context41.t0);
          return _context41.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 14:
        case "end":
          return _context41.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); // Endpoint to get orders by customer ID
// Assuming you have a route for getting orders

app.get('/order/:customerId', function _callee41(req, res) {
  var customerId, orders, ordersWithTime;
  return regeneratorRuntime.async(function _callee41$(_context42) {
    while (1) {
      switch (_context42.prev = _context42.next) {
        case 0:
          _context42.prev = 0;
          customerId = req.params.customerId;
          _context42.next = 4;
          return regeneratorRuntime.awrap(Order.find({
            customerId: customerId
          }));

        case 4:
          orders = _context42.sent;
          // Add orderTime field to each order object
          ordersWithTime = orders.map(function (order) {
            return _objectSpread({}, order.toJSON(), {
              orderTime: order.createdAt // Assuming createdAt is the timestamp of when the order was created

            });
          });
          res.json({
            orders: ordersWithTime
          });
          _context42.next = 13;
          break;

        case 9:
          _context42.prev = 9;
          _context42.t0 = _context42["catch"](0);
          console.error('Error fetching orders:', _context42.t0);
          res.status(500).json({
            error: 'Internal Server Error'
          });

        case 13:
        case "end":
          return _context42.stop();
      }
    }
  }, null, null, [[0, 9]]);
}); // Endpoint to update an order status
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

app.put("/orders/:orderId", function _callee42(req, res) {
  var orderId, _req$body12, status, preparingTime, updateData;

  return regeneratorRuntime.async(function _callee42$(_context43) {
    while (1) {
      switch (_context43.prev = _context43.next) {
        case 0:
          orderId = req.params.orderId;
          _req$body12 = req.body, status = _req$body12.status, preparingTime = _req$body12.preparingTime; // Add preparingTime to the request body

          _context43.prev = 2;
          updateData = {
            status: status
          }; // If the status is "Preparing," update the preparingTime and set preparingStartedAt

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

          _context43.next = 9;
          return regeneratorRuntime.awrap(Order.findOneAndUpdate({
            orderId: orderId
          }, updateData));

        case 9:
          return _context43.abrupt("return", res.status(200).json({
            status: "ok",
            message: "Order status updated successfully"
          }));

        case 12:
          _context43.prev = 12;
          _context43.t0 = _context43["catch"](2);
          console.error(_context43.t0);
          return _context43.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 16:
        case "end":
          return _context43.stop();
      }
    }
  }, null, null, [[2, 12]]);
}); // Endpoint to delete an order

app["delete"]("/orders/:orderId", function _callee43(req, res) {
  var orderId;
  return regeneratorRuntime.async(function _callee43$(_context44) {
    while (1) {
      switch (_context44.prev = _context44.next) {
        case 0:
          orderId = req.params.orderId;
          _context44.prev = 1;
          _context44.next = 4;
          return regeneratorRuntime.awrap(Order.findOneAndDelete({
            orderId: orderId
          }));

        case 4:
          return _context44.abrupt("return", res.status(200).json({
            status: "ok",
            message: "Order deleted successfully"
          }));

        case 7:
          _context44.prev = 7;
          _context44.t0 = _context44["catch"](1);
          console.error(_context44.t0);
          return _context44.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 11:
        case "end":
          return _context44.stop();
      }
    }
  }, null, null, [[1, 7]]);
}); //categories

app.get("/restaurant-categories/:restaurantName", function _callee44(req, res) {
  var restaurantName, restaurant, categories;
  return regeneratorRuntime.async(function _callee44$(_context45) {
    while (1) {
      switch (_context45.prev = _context45.next) {
        case 0:
          restaurantName = req.params.restaurantName;
          _context45.prev = 1;
          _context45.next = 4;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: restaurantName
          }));

        case 4:
          restaurant = _context45.sent;

          if (restaurant) {
            _context45.next = 7;
            break;
          }

          return _context45.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 7:
          categories = restaurant.menu.map(function (category) {
            return category.categoryName;
          });
          return _context45.abrupt("return", res.status(200).json({
            status: "ok",
            categories: categories
          }));

        case 11:
          _context45.prev = 11;
          _context45.t0 = _context45["catch"](1);
          console.error(_context45.t0);
          return _context45.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 15:
        case "end":
          return _context45.stop();
      }
    }
  }, null, null, [[1, 11]]);
}); //products in specific category
// Endpoint to get products of a specific category in a specific restaurant

app.get("/restaurant/:restaurantName/category/:categoryName/dishes", function _callee45(req, res) {
  var _req$params6, restaurantName, categoryName, restaurant, category, products;

  return regeneratorRuntime.async(function _callee45$(_context46) {
    while (1) {
      switch (_context46.prev = _context46.next) {
        case 0:
          _req$params6 = req.params, restaurantName = _req$params6.restaurantName, categoryName = _req$params6.categoryName;
          _context46.prev = 1;
          _context46.next = 4;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: restaurantName
          }));

        case 4:
          restaurant = _context46.sent;

          if (restaurant) {
            _context46.next = 7;
            break;
          }

          return _context46.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 7:
          category = restaurant.menu.find(function (category) {
            return category.categoryName === categoryName;
          });

          if (category) {
            _context46.next = 10;
            break;
          }

          return _context46.abrupt("return", res.status(404).json({
            error: "Category not found in the specified restaurant"
          }));

        case 10:
          products = category.dishes; // Assuming dishes are the products

          console.log(category);
          return _context46.abrupt("return", res.status(200).json({
            status: "ok",
            products: products
          }));

        case 15:
          _context46.prev = 15;
          _context46.t0 = _context46["catch"](1);
          console.error(_context46.t0);
          return _context46.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 19:
        case "end":
          return _context46.stop();
      }
    }
  }, null, null, [[1, 15]]);
}); // Endpoint to add a dish to a specific category in a specific restaurant

app.post("/restaurant/:restaurantName/category/:categoryName/add-dish", function _callee46(req, res) {
  var _req$params7, restaurantName, categoryName, _req$body13, name, price, dishImage, description, restaurant, categoryIndex, newDish;

  return regeneratorRuntime.async(function _callee46$(_context47) {
    while (1) {
      switch (_context47.prev = _context47.next) {
        case 0:
          _req$params7 = req.params, restaurantName = _req$params7.restaurantName, categoryName = _req$params7.categoryName;
          _req$body13 = req.body, name = _req$body13.name, price = _req$body13.price, dishImage = _req$body13.dishImage, description = _req$body13.description;
          _context47.prev = 2;
          _context47.next = 5;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: restaurantName
          }));

        case 5:
          restaurant = _context47.sent;

          if (restaurant) {
            _context47.next = 8;
            break;
          }

          return _context47.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 8:
          categoryIndex = restaurant.menu.findIndex(function (category) {
            return category.categoryName === categoryName;
          });

          if (!(categoryIndex === -1)) {
            _context47.next = 11;
            break;
          }

          return _context47.abrupt("return", res.status(404).json({
            error: "Category not found in the specified restaurant"
          }));

        case 11:
          newDish = {
            name: name,
            price: price,
            dishImage: dishImage,
            description: description
          };
          restaurant.menu[categoryIndex].dishes.push(newDish);
          _context47.next = 15;
          return regeneratorRuntime.awrap(restaurant.save());

        case 15:
          return _context47.abrupt("return", res.status(201).json({
            status: "ok",
            message: "Dish added successfully",
            dish: newDish
          }));

        case 18:
          _context47.prev = 18;
          _context47.t0 = _context47["catch"](2);
          console.error(_context47.t0);
          return _context47.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 22:
        case "end":
          return _context47.stop();
      }
    }
  }, null, null, [[2, 18]]);
}); // Endpoint to delete a dish from a specific category in a specific restaurant

app["delete"]("/restaurant/:restaurantName/category/:categoryName/delete-dish/:dishId", function _callee47(req, res) {
  var _req$params8, restaurantName, categoryName, dishId, restaurant, categoryIndex, dishIndex;

  return regeneratorRuntime.async(function _callee47$(_context48) {
    while (1) {
      switch (_context48.prev = _context48.next) {
        case 0:
          _req$params8 = req.params, restaurantName = _req$params8.restaurantName, categoryName = _req$params8.categoryName, dishId = _req$params8.dishId;
          _context48.prev = 1;
          _context48.next = 4;
          return regeneratorRuntime.awrap(Restaurant.findOne({
            restaurantName: restaurantName
          }));

        case 4:
          restaurant = _context48.sent;

          if (restaurant) {
            _context48.next = 7;
            break;
          }

          return _context48.abrupt("return", res.status(404).json({
            error: "Restaurant not found"
          }));

        case 7:
          categoryIndex = restaurant.menu.findIndex(function (category) {
            return category.categoryName === categoryName;
          });

          if (!(categoryIndex === -1)) {
            _context48.next = 10;
            break;
          }

          return _context48.abrupt("return", res.status(404).json({
            error: "Category not found in the specified restaurant"
          }));

        case 10:
          dishIndex = restaurant.menu[categoryIndex].dishes.findIndex(function (dish) {
            return dish._id.toString() === dishId;
          });

          if (!(dishIndex === -1)) {
            _context48.next = 13;
            break;
          }

          return _context48.abrupt("return", res.status(404).json({
            error: "Dish not found in the specified category"
          }));

        case 13:
          // Remove the dish from the category
          restaurant.menu[categoryIndex].dishes.splice(dishIndex, 1);
          _context48.next = 16;
          return regeneratorRuntime.awrap(restaurant.save());

        case 16:
          return _context48.abrupt("return", res.status(200).json({
            status: "ok",
            message: "Dish deleted successfully"
          }));

        case 19:
          _context48.prev = 19;
          _context48.t0 = _context48["catch"](1);
          console.error(_context48.t0);
          return _context48.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 23:
        case "end":
          return _context48.stop();
      }
    }
  }, null, null, [[1, 19]]);
}); // API for restaurant owner to update order status

app.post('/update-order-status', function _callee48(req, res) {
  var _req$body14, orderId, newStatus, response;

  return regeneratorRuntime.async(function _callee48$(_context49) {
    while (1) {
      switch (_context49.prev = _context49.next) {
        case 0:
          _req$body14 = req.body, orderId = _req$body14.orderId, newStatus = _req$body14.newStatus;
          _context49.prev = 1;
          _context49.next = 4;
          return regeneratorRuntime.awrap(Order.updateOrderStatus(orderId, newStatus));

        case 4:
          response = _context49.sent;
          res.json(response);
          _context49.next = 11;
          break;

        case 8:
          _context49.prev = 8;
          _context49.t0 = _context49["catch"](1);
          res.status(404).json({
            error: _context49.t0.message
          });

        case 11:
        case "end":
          return _context49.stop();
      }
    }
  }, null, null, [[1, 8]]);
});
app.get('/check-order-status/:orderId', function _callee49(req, res) {
  var orderId, response;
  return regeneratorRuntime.async(function _callee49$(_context50) {
    while (1) {
      switch (_context50.prev = _context50.next) {
        case 0:
          orderId = req.params.orderId;
          _context50.prev = 1;
          _context50.next = 4;
          return regeneratorRuntime.awrap(Order.checkOrderStatus(orderId));

        case 4:
          response = _context50.sent;
          res.json(response);
          _context50.next = 11;
          break;

        case 8:
          _context50.prev = 8;
          _context50.t0 = _context50["catch"](1);
          res.status(404).json({
            error: _context50.t0.message
          });

        case 11:
        case "end":
          return _context50.stop();
      }
    }
  }, null, null, [[1, 8]]);
});
var extrasSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
}); // Create the Extras model

var Extras = mongoose.model('Extras', extrasSchema);
app.post('/add-required-extras/:dishId', function _callee50(req, res) {
  var _req$body15, name, price, dishId, dish, newExtra;

  return regeneratorRuntime.async(function _callee50$(_context51) {
    while (1) {
      switch (_context51.prev = _context51.next) {
        case 0:
          _req$body15 = req.body, name = _req$body15.name, price = _req$body15.price;
          dishId = req.params.dishId;
          _context51.prev = 2;
          _context51.next = 5;
          return regeneratorRuntime.awrap(Dish.findById(dishId));

        case 5:
          dish = _context51.sent;

          if (dish) {
            _context51.next = 8;
            break;
          }

          return _context51.abrupt("return", res.status(404).json({
            error: 'Dish not found'
          }));

        case 8:
          _context51.next = 10;
          return regeneratorRuntime.awrap(Extras.create({
            name: name,
            price: price
          }));

        case 10:
          newExtra = _context51.sent;
          dish.requiredExtras.push(newExtra);
          _context51.next = 14;
          return regeneratorRuntime.awrap(dish.save());

        case 14:
          res.json({
            message: 'Required extra added successfully'
          });
          _context51.next = 20;
          break;

        case 17:
          _context51.prev = 17;
          _context51.t0 = _context51["catch"](2);
          res.status(400).json({
            error: _context51.t0.message
          });

        case 20:
        case "end":
          return _context51.stop();
      }
    }
  }, null, null, [[2, 17]]);
}); // API to add optional extras to a dish

app.post('/add-optional-extras/:dishId', function _callee51(req, res) {
  var _req$body16, name, price, dishId, dish, newExtra;

  return regeneratorRuntime.async(function _callee51$(_context52) {
    while (1) {
      switch (_context52.prev = _context52.next) {
        case 0:
          _req$body16 = req.body, name = _req$body16.name, price = _req$body16.price;
          dishId = req.params.dishId;
          _context52.prev = 2;
          _context52.next = 5;
          return regeneratorRuntime.awrap(Dish.findById(dishId));

        case 5:
          dish = _context52.sent;

          if (dish) {
            _context52.next = 8;
            break;
          }

          return _context52.abrupt("return", res.status(404).json({
            error: 'Dish not found'
          }));

        case 8:
          _context52.next = 10;
          return regeneratorRuntime.awrap(Extras.create({
            name: name,
            price: price
          }));

        case 10:
          newExtra = _context52.sent;
          dish.optionalExtras.push(newExtra);
          _context52.next = 14;
          return regeneratorRuntime.awrap(dish.save());

        case 14:
          res.json({
            message: 'Optional extra added successfully'
          });
          _context52.next = 20;
          break;

        case 17:
          _context52.prev = 17;
          _context52.t0 = _context52["catch"](2);
          res.status(400).json({
            error: _context52.t0.message
          });

        case 20:
        case "end":
          return _context52.stop();
      }
    }
  }, null, null, [[2, 17]]);
}); // API to get extras offered with a meal

app.get('/get-extras/:dishId', function _callee52(req, res) {
  var dishId, dish;
  return regeneratorRuntime.async(function _callee52$(_context53) {
    while (1) {
      switch (_context53.prev = _context53.next) {
        case 0:
          dishId = req.params.dishId;
          _context53.prev = 1;
          _context53.next = 4;
          return regeneratorRuntime.awrap(Dish.findById(dishId).populate('requiredExtras optionalExtras'));

        case 4:
          dish = _context53.sent;

          if (dish) {
            _context53.next = 7;
            break;
          }

          return _context53.abrupt("return", res.status(404).json({
            error: 'Dish not found'
          }));

        case 7:
          res.json({
            requiredExtras: dish.requiredExtras,
            optionalExtras: dish.optionalExtras
          });
          _context53.next = 13;
          break;

        case 10:
          _context53.prev = 10;
          _context53.t0 = _context53["catch"](1);
          res.status(400).json({
            error: _context53.t0.message
          });

        case 13:
        case "end":
          return _context53.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); // API to buy extras with a meal

app.post('/buy-extras/:dishId', function _callee53(req, res) {
  var extras, dishId, dish, totalPrice;
  return regeneratorRuntime.async(function _callee53$(_context54) {
    while (1) {
      switch (_context54.prev = _context54.next) {
        case 0:
          extras = req.body.extras;
          dishId = req.params.dishId;
          _context54.prev = 2;
          _context54.next = 5;
          return regeneratorRuntime.awrap(Dish.findById(dishId).populate('requiredExtras optionalExtras'));

        case 5:
          dish = _context54.sent;

          if (dish) {
            _context54.next = 8;
            break;
          }

          return _context54.abrupt("return", res.status(404).json({
            error: 'Dish not found'
          }));

        case 8:
          // Calculate the total price including selected extras
          totalPrice = dish.price;
          extras.forEach(function (extraId) {
            var extra = dish.requiredExtras.find(function (extra) {
              return extra._id.equals(extraId);
            }) || dish.optionalExtras.find(function (extra) {
              return extra._id.equals(extraId);
            });

            if (extra) {
              totalPrice += extra.price || 0;
            }
          }); // Return the total price

          res.json({
            totalPrice: totalPrice
          });
          _context54.next = 16;
          break;

        case 13:
          _context54.prev = 13;
          _context54.t0 = _context54["catch"](2);
          res.status(400).json({
            error: _context54.t0.message
          });

        case 16:
        case "end":
          return _context54.stop();
      }
    }
  }, null, null, [[2, 13]]);
}); // const moment = require('moment');

app.post('/api/orders/completed', function _callee54(req, res) {
  var _req$body17, period, restaurantName, startDate, endDate, query, filteredOrders;

  return regeneratorRuntime.async(function _callee54$(_context55) {
    while (1) {
      switch (_context55.prev = _context55.next) {
        case 0:
          _context55.prev = 0;
          _req$body17 = req.body, period = _req$body17.period, restaurantName = _req$body17.restaurantName;
          _context55.t0 = period;
          _context55.next = _context55.t0 === 'today' ? 5 : _context55.t0 === 'yesterday' ? 8 : _context55.t0 === 'thisWeek' ? 11 : _context55.t0 === 'lastWeek' ? 14 : _context55.t0 === 'thisMonth' ? 17 : _context55.t0 === 'lastMonth' ? 20 : _context55.t0 === 'lastTwoMonths' ? 23 : 26;
          break;

        case 5:
          startDate = moment().startOf('day').toDate();
          endDate = moment().endOf('day').toDate();
          return _context55.abrupt("break", 27);

        case 8:
          startDate = moment().subtract(1, 'days').startOf('day').toDate();
          endDate = moment().subtract(1, 'days').endOf('day').toDate();
          return _context55.abrupt("break", 27);

        case 11:
          startDate = moment().startOf('week').toDate();
          endDate = moment().endOf('day').toDate();
          return _context55.abrupt("break", 27);

        case 14:
          startDate = moment().subtract(1, 'week').startOf('week').toDate();
          endDate = moment().subtract(1, 'week').endOf('week').toDate();
          return _context55.abrupt("break", 27);

        case 17:
          startDate = moment().startOf('month').toDate();
          endDate = moment().endOf('day').toDate();
          return _context55.abrupt("break", 27);

        case 20:
          startDate = moment().subtract(1, 'month').startOf('month').toDate();
          endDate = moment().subtract(1, 'month').endOf('month').toDate();
          return _context55.abrupt("break", 27);

        case 23:
          startDate = moment().subtract(2, 'months').startOf('month').toDate();
          endDate = moment().subtract(1, 'months').endOf('month').toDate();
          return _context55.abrupt("break", 27);

        case 26:
          throw new Error('Invalid period');

        case 27:
          query = {
            status: 'Completed',
            completedAt: {
              $gte: startDate,
              $lte: endDate
            }
          };

          if (restaurantName) {
            query.resName = restaurantName;
          }

          _context55.next = 31;
          return regeneratorRuntime.awrap(Order.find(query));

        case 31:
          filteredOrders = _context55.sent;
          res.json(filteredOrders);
          _context55.next = 39;
          break;

        case 35:
          _context55.prev = 35;
          _context55.t1 = _context55["catch"](0);
          console.error('Error retrieving completed orders:', _context55.t1);
          res.status(500).json({
            error: 'Internal Server Error'
          });

        case 39:
        case "end":
          return _context55.stop();
      }
    }
  }, null, null, [[0, 35]]);
});
app.post('/api/revenue', function _callee55(req, res) {
  var _req$body18, period, restaurantName, startDate, endDate, query, orders, orderDetails, totalRevenue;

  return regeneratorRuntime.async(function _callee55$(_context56) {
    while (1) {
      switch (_context56.prev = _context56.next) {
        case 0:
          _context56.prev = 0;
          _req$body18 = req.body, period = _req$body18.period, restaurantName = _req$body18.restaurantName;
          _context56.t0 = period;
          _context56.next = _context56.t0 === 'today' ? 5 : _context56.t0 === 'yesterday' ? 8 : _context56.t0 === 'thisWeek' ? 11 : _context56.t0 === 'lastWeek' ? 14 : _context56.t0 === 'thisMonth' ? 17 : _context56.t0 === 'lastMonth' ? 20 : _context56.t0 === 'lastTwoMonths' ? 23 : 26;
          break;

        case 5:
          startDate = moment().startOf('day').toDate();
          endDate = moment().endOf('day').toDate();
          return _context56.abrupt("break", 27);

        case 8:
          startDate = moment().subtract(1, 'days').startOf('day').toDate();
          endDate = moment().subtract(1, 'days').endOf('day').toDate();
          return _context56.abrupt("break", 27);

        case 11:
          startDate = moment().startOf('week').toDate();
          endDate = moment().endOf('day').toDate();
          return _context56.abrupt("break", 27);

        case 14:
          startDate = moment().subtract(1, 'week').startOf('week').toDate();
          endDate = moment().subtract(1, 'week').endOf('week').toDate();
          return _context56.abrupt("break", 27);

        case 17:
          startDate = moment().startOf('month').toDate();
          endDate = moment().endOf('day').toDate();
          return _context56.abrupt("break", 27);

        case 20:
          startDate = moment().subtract(1, 'month').startOf('month').toDate();
          endDate = moment().subtract(1, 'month').endOf('month').toDate();
          return _context56.abrupt("break", 27);

        case 23:
          startDate = moment().subtract(2, 'months').startOf('month').toDate();
          endDate = moment().subtract(1, 'months').endOf('month').toDate();
          return _context56.abrupt("break", 27);

        case 26:
          throw new Error('Invalid period');

        case 27:
          query = {
            status: 'Completed',
            completedAt: {
              $gte: startDate,
              $lte: endDate
            }
          };

          if (restaurantName) {
            query.resName = restaurantName;
          }

          _context56.next = 31;
          return regeneratorRuntime.awrap(Order.find(query));

        case 31:
          orders = _context56.sent;

          if (!(orders.length === 0)) {
            _context56.next = 34;
            break;
          }

          return _context56.abrupt("return", res.json({
            message: 'No completed orders found in this date range'
          }));

        case 34:
          orderDetails = orders.map(function (order) {
            var orderTotalPrice = order.products.reduce(function (total, product) {
              var totalPrice = product.price * product.quantity;

              if (product.extras && product.extras.length > 0) {
                totalPrice += product.extras.reduce(function (acc, extra) {
                  return acc + extra.price;
                }, 0);
              }

              return total + totalPrice;
            }, 0);
            return {
              orderId: order.orderId,
              revenue: orderTotalPrice.toFixed(2)
            };
          });
          totalRevenue = orderDetails.reduce(function (total, order) {
            return total + parseFloat(order.revenue);
          }, 0).toFixed(2);
          res.json({
            orderDetails: orderDetails,
            totalRevenue: totalRevenue
          });
          _context56.next = 43;
          break;

        case 39:
          _context56.prev = 39;
          _context56.t1 = _context56["catch"](0);
          console.error('Error calculating total revenue:', _context56.t1);
          res.status(500).json({
            error: 'Internal Server Error'
          });

        case 43:
        case "end":
          return _context56.stop();
      }
    }
  }, null, null, [[0, 39]]);
});
app.post('/api/orders/rejected', function _callee56(req, res) {
  var _req$body19, period, restaurantName, startDate, endDate, query, rejectedOrders;

  return regeneratorRuntime.async(function _callee56$(_context57) {
    while (1) {
      switch (_context57.prev = _context57.next) {
        case 0:
          _context57.prev = 0;
          _req$body19 = req.body, period = _req$body19.period, restaurantName = _req$body19.restaurantName;
          _context57.t0 = period;
          _context57.next = _context57.t0 === 'today' ? 5 : _context57.t0 === 'yesterday' ? 8 : _context57.t0 === 'thisWeek' ? 11 : _context57.t0 === 'lastWeek' ? 14 : _context57.t0 === 'thisMonth' ? 17 : _context57.t0 === 'lastMonth' ? 20 : _context57.t0 === 'lastTwoMonths' ? 23 : 26;
          break;

        case 5:
          startDate = moment().startOf('day').toDate();
          endDate = moment().endOf('day').toDate();
          return _context57.abrupt("break", 27);

        case 8:
          startDate = moment().subtract(1, 'days').startOf('day').toDate();
          endDate = moment().subtract(1, 'days').endOf('day').toDate();
          return _context57.abrupt("break", 27);

        case 11:
          startDate = moment().startOf('week').toDate();
          endDate = moment().endOf('day').toDate();
          return _context57.abrupt("break", 27);

        case 14:
          startDate = moment().subtract(1, 'week').startOf('week').toDate();
          endDate = moment().subtract(1, 'week').endOf('week').toDate();
          return _context57.abrupt("break", 27);

        case 17:
          startDate = moment().startOf('month').toDate();
          endDate = moment().endOf('day').toDate();
          return _context57.abrupt("break", 27);

        case 20:
          startDate = moment().subtract(1, 'month').startOf('month').toDate();
          endDate = moment().subtract(1, 'month').endOf('month').toDate();
          return _context57.abrupt("break", 27);

        case 23:
          startDate = moment().subtract(2, 'months').startOf('month').toDate();
          endDate = moment().subtract(1, 'months').endOf('month').toDate();
          return _context57.abrupt("break", 27);

        case 26:
          throw new Error('Invalid period');

        case 27:
          query = {
            status: 'Not Approved',
            declinedAt: {
              $gte: startDate,
              $lte: endDate
            }
          };

          if (restaurantName) {
            query.resName = restaurantName;
          }

          _context57.next = 31;
          return regeneratorRuntime.awrap(Order.find(query));

        case 31:
          rejectedOrders = _context57.sent;
          res.json(rejectedOrders);
          _context57.next = 39;
          break;

        case 35:
          _context57.prev = 35;
          _context57.t1 = _context57["catch"](0);
          console.error('Error retrieving rejected orders:', _context57.t1);
          res.status(500).json({
            error: 'Internal Server Error'
          });

        case 39:
        case "end":
          return _context57.stop();
      }
    }
  }, null, null, [[0, 35]]);
}); // API to send a verification code to reset password

app.post('/forgot-password', function _callee57(req, res) {
  var email, user, verificationCode, transporter, mailOptions;
  return regeneratorRuntime.async(function _callee57$(_context58) {
    while (1) {
      switch (_context58.prev = _context58.next) {
        case 0:
          email = req.body.email;
          _context58.prev = 1;
          _context58.next = 4;
          return regeneratorRuntime.awrap(Clientt.findOne({
            email: email
          }));

        case 4:
          user = _context58.sent;

          if (user) {
            _context58.next = 7;
            break;
          }

          return _context58.abrupt("return", res.status(404).json({
            error: 'User not found'
          }));

        case 7:
          // Generate a random verification code
          verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
          user.verificationCode = verificationCode;
          _context58.next = 11;
          return regeneratorRuntime.awrap(user.save());

        case 11:
          // Create a transporter using Gmail SMTP
          transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
              user: 'help.layla.restaurant@gmail.com',
              // Your Gmail email address
              pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password

            }
          }); // Configure email options

          mailOptions = {
            from: 'YazanRestaurant@gmail.com',
            to: email,
            subject: 'Password Reset Verification Code',
            text: "Here's your requested Layla password reset code: ".concat(verificationCode, ". Please do not share this code with anyone, use this code to continue with setting your new password. It will expire in 30 minutes for security purposes. If you didn't request this, please disregard this message and notify our support team immediately. Best regards, Layla Security Team")
          }; // Send email

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
              res.status(500).json({
                error: 'Failed to send verification code'
              });
            } else {
              res.json({
                message: 'Verification code sent successfully'
              });
            }
          });
          _context58.next = 19;
          break;

        case 16:
          _context58.prev = 16;
          _context58.t0 = _context58["catch"](1);
          res.status(400).json({
            error: _context58.t0.message
          });

        case 19:
        case "end":
          return _context58.stop();
      }
    }
  }, null, null, [[1, 16]]);
}); // API to reset password using verification code

app.post('/reset-password', function _callee58(req, res) {
  var _req$body20, email, verificationCode, newPassword, user, encryptedPassword, transporter, mailOptions;

  return regeneratorRuntime.async(function _callee58$(_context59) {
    while (1) {
      switch (_context59.prev = _context59.next) {
        case 0:
          _req$body20 = req.body, email = _req$body20.email, verificationCode = _req$body20.verificationCode, newPassword = _req$body20.newPassword;
          _context59.prev = 1;
          _context59.next = 4;
          return regeneratorRuntime.awrap(Clientt.findOne({
            email: email
          }));

        case 4:
          user = _context59.sent;

          if (user) {
            _context59.next = 7;
            break;
          }

          return _context59.abrupt("return", res.status(404).json({
            error: 'User not found'
          }));

        case 7:
          if (!(user.verificationCode !== verificationCode)) {
            _context59.next = 9;
            break;
          }

          return _context59.abrupt("return", res.status(400).json({
            error: 'Invalid verification code'
          }));

        case 9:
          _context59.next = 11;
          return regeneratorRuntime.awrap(bcrypt.hash(newPassword, 10));

        case 11:
          encryptedPassword = _context59.sent;
          // Update the password
          user.password = encryptedPassword; // Clear the verification code

          user.verificationCode = null;
          _context59.next = 16;
          return regeneratorRuntime.awrap(user.save());

        case 16:
          // Send email notification
          transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
              user: 'help.layla.restaurant@gmail.com',
              // Your Gmail email address
              pass: 'fjrmzlkpibbguedt' // Your Gmail password or App Password

            }
          });
          mailOptions = {
            from: 'YazanRestaurant@gmail.com',
            to: email,
            subject: 'Password Changed Successfully',
            text: 'Your Layla account password has been successfully changed. If you did not initiate this change, please contact support immediately.'
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
              res.status(500).json({
                error: 'Failed to send password change notification'
              });
            } else {
              res.json({
                message: 'Password reset successfully. Notification sent to your email.'
              });
            }
          });
          _context59.next = 24;
          break;

        case 21:
          _context59.prev = 21;
          _context59.t0 = _context59["catch"](1);
          res.status(400).json({
            error: _context59.t0.message
          });

        case 24:
        case "end":
          return _context59.stop();
      }
    }
  }, null, null, [[1, 21]]);
});
app.get("/logged-in-users", function _callee59(req, res) {
  var loggedInUsers;
  return regeneratorRuntime.async(function _callee59$(_context60) {
    while (1) {
      switch (_context60.prev = _context60.next) {
        case 0:
          _context60.prev = 0;
          _context60.next = 3;
          return regeneratorRuntime.awrap(Clientt.find({
            isLoggedIn: true
          }));

        case 3:
          loggedInUsers = _context60.sent;

          if (!(!loggedInUsers || loggedInUsers.length === 0)) {
            _context60.next = 6;
            break;
          }

          return _context60.abrupt("return", res.status(200).json({
            message: "No logged-in users found",
            users: []
          }));

        case 6:
          return _context60.abrupt("return", res.status(200).json({
            message: "Logged-in users found",
            users: loggedInUsers
          }));

        case 9:
          _context60.prev = 9;
          _context60.t0 = _context60["catch"](0);
          console.error(_context60.t0);
          return _context60.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 13:
        case "end":
          return _context60.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
app.get("/all-users", function _callee60(req, res) {
  var allUsers;
  return regeneratorRuntime.async(function _callee60$(_context61) {
    while (1) {
      switch (_context61.prev = _context61.next) {
        case 0:
          _context61.prev = 0;
          _context61.next = 3;
          return regeneratorRuntime.awrap(ClientInfo.find());

        case 3:
          allUsers = _context61.sent;

          if (!(!allUsers || allUsers.length === 0)) {
            _context61.next = 6;
            break;
          }

          return _context61.abrupt("return", res.status(200).json({
            message: "No users found",
            users: []
          }));

        case 6:
          return _context61.abrupt("return", res.status(200).json({
            message: "Users found",
            users: allUsers
          }));

        case 9:
          _context61.prev = 9;
          _context61.t0 = _context61["catch"](0);
          console.error(_context61.t0);
          return _context61.abrupt("return", res.status(500).json({
            error: "Internal Server Error"
          }));

        case 13:
        case "end":
          return _context61.stop();
      }
    }
  }, null, null, [[0, 9]]);
});