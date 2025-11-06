const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const USER = mongoose.model("USER");




router.post('/placeorder', async (req, res) => {
  try {
    const {
      userId,
      orderId,
      orderItems,
      totalAmount,
      orderStatus,
      paymentMethod,
      paymentStatus,
      shippingAddress
    } = req.body;

    const user = await USER.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create new order object
    const newOrder = {
      orderId,
      orderDate: new Date(),
      orderItems,
      totalAmount,
      orderStatus,
      paymentMethod,
      paymentStatus,
      shippingAddress
    };

    // Add to user's placedOrders array
    user.placedOrders.push(newOrder);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Order placed successfully',
      orderId
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



router.post('/clearcart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await USER.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cart = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});





router.get('/getorder/:userId/:orderId', async (req, res) => {
  try {
    const { userId, orderId } = req.params;

    const user = await USER.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const order = user.placedOrders.find(o => o.orderId === orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/getorders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await USER.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Sort orders by date (newest first)
    const orders = user.placedOrders.sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});





module.exports = router;
