const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// Route to create a new coupon
router.post('/create-coupon', couponController.createCoupon);

// Route to get all coupons
router.get('/coupons', couponController.getAllCoupons);

// Route to get restaurant specific coupon
router.get('/get-coupon-by-res/:resName', couponController.getCouponByResName);


// Route to get a coupon by ID
router.get('/coupon/:id', couponController.getCouponById);

// Route to update a coupon
router.put('/update-coupon/:id', couponController.updateCoupon);

// Route to delete a coupon
router.delete('/delete-coupon/:id', couponController.deleteCoupon);

// Route to apply a coupon
router.post('/apply-coupon', couponController.applyCoupon);

module.exports = router;
