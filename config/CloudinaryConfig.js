const cloudinary = require('cloudinary').v2;

console.log('cloud name',process.env.CLOUDINARY_CLOUD_NAME);
console.log('api key',process.env.CLOUDINARY_API_KEY);
console.log('secret key',process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
