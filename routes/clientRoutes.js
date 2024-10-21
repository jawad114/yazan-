const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Route to create a new coupon
router.get('/searchClient', clientController.searchClient);


module.exports = router;
