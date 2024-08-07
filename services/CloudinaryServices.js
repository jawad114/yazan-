const cloudinary = require('../config/CloudinaryConfig');

const addImage = async (fileBuffer) => {
  try {
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${fileBuffer.toString('base64')}`, {
      resource_type: 'image'
    });
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteImage = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateImage = async (public_id, fileBuffer) => {
  try {
    // First, delete the existing image
    await cloudinary.uploader.destroy(public_id);

    // Then, upload the new image
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${fileBuffer.toString('base64')}`, {
      public_id,
      resource_type: 'image'
    });
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};
module.exports = {
  addImage,
  deleteImage,
  updateImage,
};
