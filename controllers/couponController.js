const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant'); // Adjust path as necessary


// Function to generate a unique coupon code
const generateUniqueCouponCode = async () => {
  const length = 8; // Define the length of the coupon code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let code = '';
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const existingCoupon = await Coupon.findOne({ code });
    if (!existingCoupon) {
      isUnique = true;
    }
  }

  return code;
};

// Controller to create a new coupon
// exports.createCoupon = async (req, res) => {
//   try {
//     const { restaurant, discountPercentage, usageLimit, expiryDate, minOrderValue } = req.body;

//     const code = await generateUniqueCouponCode();

//     const newCoupon = new Coupon({
//       code,
//       restaurant,
//       discountPercentage,
//       usageLimit,
//       expiryDate,
//       minOrderValue: minOrderValue || 0
//     });

//     await newCoupon.save();
//     res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating coupon', error: error.message });
//   }
// };

exports.createCoupon = async (req, res) => {
  try {
    const { restaurant, discountPercentage, usageLimit, expiryDate, minOrderValue, userSpecific, specificUsers } = req.body;

    const code = await generateUniqueCouponCode();

    const newCoupon = new Coupon({
      code,
      restaurant,
      discountPercentage,
      usageLimit,
      userSpecific: userSpecific || false,
      userUsage: userSpecific ? (specificUsers || []).map(userId => ({ userId, count: 0 })) : [], // Initialize userUsage if userSpecific
      expiryDate,
      minOrderValue: minOrderValue || 0
    });

    await newCoupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
};


// Controller to get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().populate('restaurant')
    .populate({
      path: 'userUsage.userId', // Path to the userId field within the userUsage array
      model: 'ClientInfo' // Model to populate userId field with
    });
    ;
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};


exports.getCouponByResName = async (req, res) => {
  try {
    const { resName } = req.params;

    // Fetch the restaurant by name
    const restaurant = await Restaurant.findOne({ restaurantName: resName });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Find coupons for the restaurant
    const coupons = await Coupon.find({ restaurant: restaurant._id }).populate('restaurant')
    .populate({
      path: 'userUsage.userId', // Path to the userId field within the userUsage array
      model: 'ClientInfo' // Model to populate userId field with
    });
    ;

    res.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Controller to get a coupon by ID
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).populate('restaurant');
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupon', error: error.message });
  }
};

// Controller to update a coupon
exports.updateCoupon = async (req, res) => {
  try {
    const { discountPercentage, usageLimit, expiryDate, minOrderValue } = req.body;
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    coupon.discountPercentage = discountPercentage || coupon.discountPercentage;
    coupon.usageLimit = usageLimit || coupon.usageLimit;
    coupon.expiryDate = expiryDate || coupon.expiryDate;
    coupon.minOrderValue = minOrderValue || coupon.minOrderValue;

    await coupon.save();
    res.status(200).json({ message: 'Coupon updated successfully', coupon });
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon', error: error.message });
  }
};

// Controller to delete a coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
};



// exports.applyCoupon = async (req, res) => {
//   try {
//     const { userId, couponCode, orderAmount, resName } = req.body;

//     // Fetch the restaurant by its name
//     const restaurant = await Restaurant.findOne({ restaurantName: resName });
//     if (!restaurant) {
//       return res.status(404).json({ message: 'المطعم غير موجود' });
//     }

//     const restaurantId = restaurant._id;

//     // Fetch the coupon by code and restaurantId
//     const coupon = await Coupon.findOne({ code: couponCode, restaurant: restaurantId });
//     if (!coupon) {
//       return res.status(404).json({ message: 'القسيمة غير موجودة' });
//     }

//     // Check if the coupon has expired
//     if (new Date() > coupon.expiryDate) {
//       return res.status(400).json({ message: 'القسيمة قد انتهت صلاحيتها' });
//     }

//     // Check if the coupon usage limit has been reached
//     const userUsage = coupon.userUsage.find(usage => usage.userId.toString() === userId);
//     if (userUsage && userUsage.count >= coupon.usageLimit) {
//       return res.status(400).json({ message: 'تم الوصول إلى حد استخدام هذه القسيمة' });
//     }

//     // Check if the order amount meets the minimum order value
//     if (orderAmount < coupon.minOrderValue) {
//       return res.status(400).json({ message: `الحد الأدنى للطلب لاستخدام هذه القسيمة هو ${coupon.minOrderValue}` });
//     }

//     res.status(200).json({ message: 'تم تطبيق القسيمة بنجاح', discount: coupon.discountPercentage, coupon: coupon.code });
//   } catch (error) {
//     res.status(500).json({ message: 'حدث خطأ أثناء تطبيق القسيمة', error: error.message });
//   }
// };


exports.applyCoupon = async (req, res) => {
  try {
    const { userId, couponCode, orderAmount, resName } = req.body;

    // Fetch the restaurant by its name
    const restaurant = await Restaurant.findOne({ restaurantName: resName });
    if (!restaurant) {
      return res.status(404).json({ message: 'المطعم غير موجود' });
    }

    const restaurantId = restaurant._id;

    // Fetch the coupon by code and restaurantId
    const coupon = await Coupon.findOne({ code: couponCode, restaurant: restaurantId });
    if (!coupon) {
      return res.status(404).json({ message: 'القسيمة غير موجودة' });
    }

    // Check if the coupon has expired
    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ message: 'القسيمة قد انتهت صلاحيتها' });
    }

    if (coupon.userSpecific) {
      // User-specific coupon logic
      if (!userId) {
        return res.status(400).json({ message: 'الرجاء تسجيل الدخول لتطبيق القسيمة المخصصة للمستخدم' });
      }

      const userUsage = coupon.userUsage.find(usage => usage.userId.toString() === userId);

      if (!userUsage) {
        return res.status(400).json({ message: 'القسيمة غير مخصصة لهذا المستخدم' });
      }

      if (userUsage.count >= coupon.usageLimit) {
        return res.status(400).json({ message: 'تم الوصول إلى حد استخدام هذه القسيمة' });
      }
    } else {
      // Non-user-specific coupon logic
      if (!userId) {
        return res.status(400).json({ message: 'الرجاء تسجيل الدخول لتطبيق القسيمة' });
      }

      const userUsage = coupon.userUsage.find(usage => usage.userId.toString() === userId);

      if (userUsage && userUsage.count >= coupon.usageLimit) {
        return res.status(400).json({ message: 'تم الوصول إلى حد استخدام هذه القسيمة' });
      }
    }

    // Check if the order amount meets the minimum order value
    if (orderAmount < coupon.minOrderValue) {
      return res.status(400).json({ message: `الحد الأدنى للطلب لاستخدام هذه القسيمة هو ${coupon.minOrderValue}` });
    }

    res.status(200).json({ message: 'تم تطبيق القسيمة بنجاح', discount: coupon.discountPercentage, coupon: coupon.code });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تطبيق القسيمة', error: error.message });
  }
};
