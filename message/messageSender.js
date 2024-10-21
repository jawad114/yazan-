// const admin = require('firebase-admin');
// const mongoose = require('mongoose');
// const serviceAccount = require('./laylamp-95cda-firebase-adminsdk-p0do0-7a36bb076e.json'); 
// require("../clientDetails");
// const Clientt = mongoose.model("ClientInfo");


// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const sendFCMMessage = async (phoneNumber, message) => {
//   try {
//     // Construct the message payload
//     const payload = {
//       notification: {
//         title: 'Important Notification',
//         body: message,
//       },
//       // You might want to add more details depending on your use case
//     };

//     // Get the FCM token for the phone number
//     const token = await getTokenForPhoneNumber(phoneNumber);

//     if (!token) {
//       throw new Error('FCM token not found for the phone number');
//     }

//     // Send the message using Firebase Admin SDK
//     const response = await admin.messaging().sendToDevice(token, payload);
//     console.log('Successfully sent message:', response);
//     return response;
//   } catch (error) {
//     console.error('Error sending message:', error);
//     throw error;
//   }
// };

// // Function to get FCM token for a phone number from MongoDB
// const getTokenForPhoneNumber = async (phoneNumber) => {
//   try {
//     // Find the client with the given phone number
//     const client = await Clientt.findOne({ phoneNumber});
    
//     if (!client) {
//       throw new Error('Client not found');
//     }

//     // Return the FCM token
//     return client.fcmToken;
//   } catch (error) {
//     console.error('Error fetching token:', error);
//     throw error;
//   }
// };

// module.exports = { sendFCMMessage };
