const mongoose = require("mongoose");

const clientDetailsSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: { 
        type: String, 
        unique: true 
    },
    phoneNumber:{ type: String, unique: true},
    password: String,
    verificationCode: String, // Field to store verification code
    verificationCodeSentAt: { 
        type: Date 
    }, 
    isCodeVerified: { 
        type: Boolean, 
        default: true 
    }, // Field to indicate whether code is verified or not, default to false
    isLoggedIn: { 
        type: Boolean, 
        default: false 
    }, // Field to indicate whether the user is logged in or not, default to false
    fcmToken: String // Field to store FCM token
}, {
    collection: "clientInfo"
});

module.exports = mongoose.model("ClientInfo", clientDetailsSchema);
