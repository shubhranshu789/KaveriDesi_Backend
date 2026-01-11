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




// GET /checkcart - Check if product is in user's cart
router.get('/checkcart', async (req, res) => {
  try {
    const { userId, productId, quantityType } = req.query;
    
    if (!userId || !productId) {
      return res.json({ success: false, message: 'Missing userId or productId' });
    }

    const user = await USER.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    // Check if product exists in cart with exact quantityType match
    const isInCart = user.cart.some(item => 
      item.productId === productId && 
      (!quantityType || item.quantityType == quantityType) // quantityType optional for backward compatibility
    );

    res.json({ 
      success: true, 
      isInCart,
      cartCount: user.cart.length 
    });
  } catch (error) {
    console.error('Check cart error:', error);
    res.json({ success: false, message: error.message });
  }
});

// GET /checkwishlist - Check if product is in user's wishlist
router.get('/checkwishlist', async (req, res) => {
  try {
    const { userId, productId } = req.query;
    
    if (!userId || !productId) {
      return res.json({ success: false, message: 'Missing userId or productId' });
    }

    const user = await USER.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    const isInWishlist = user.wishlist.some(item => item.productId === productId);

    res.json({ 
      success: true, 
      isInWishlist,
      wishlistCount: user.wishlist.length 
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.json({ success: false, message: error.message });
  }
});



// 1. Check if first order
router.get('/check-first-order/:userId', async (req, res) => {
  try {
    const user = await USER.findById(req.params.userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    const isFirstOrder = user.placedOrders.length === 0;
    res.json({ success: true, isFirstOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Apply coupon logic
router.post('/apply-coupon', async (req, res) => {
  try {
    const { userId, cartTotal, couponCode } = req.body;
    
    const user = await USER.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    let discount = 0;
    let discountType = '';
    
    const subTotal = parseFloat(cartTotal.toString());
    
    switch (couponCode.toUpperCase()) {
      case 'FIRST10':
        if (user.placedOrders.length === 0) {
          discount = Math.round(subTotal * 0.10);
          discountType = 'First Order 10% OFF';
        } else {
          return res.json({ 
            success: false, 
            message: 'This coupon is only for first-time buyers' 
          });
        }
        break;
        
      case 'BIG15':
        if (subTotal > 2000) {
          discount = Math.round(subTotal * 0.15);
          discountType = 'Big Shopper 15% OFF';
        } else {
          return res.json({ 
            success: false, 
            message: 'Minimum cart value ₹2000 required for this coupon' 
          });
        }
        break;
        
      default:
        return res.json({ 
          success: false, 
          message: 'Invalid coupon code. Use FIRST10 or BIG15' 
        });
    }
    
    res.json({ 
      success: true, 
      discount,
      discountType,
      message: `Coupon applied successfully! Save ₹${discount}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});





module.exports = router;
