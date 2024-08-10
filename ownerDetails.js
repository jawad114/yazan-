const mongoose = require("mongoose");
const ownerDetailsSchema = new mongoose.Schema(
    {
        firstname: String, 
        lastname: String,
        email: { type: String, unique: true },
        verificationCode: String,
        emailChanged:Boolean,
        password: String
    },{
        collection: "ownerInfo"
    });
mongoose.model("OwnerInfo", ownerDetailsSchema);
