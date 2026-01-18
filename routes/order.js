const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const USER = mongoose.model("USER");





// router.post('/placeorder', async (req, res) => {
//   try {
//     const {
//       userId,
//       orderId,
//       orderItems,
//       totalAmount,
//       orderStatus,
//       paymentMethod,
//       paymentStatus,
//       shippingAddress
//     } = req.body;

//     const user = await USER.findById(userId);
    
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     // Create new order object
//     const newOrder = {
//       orderId,
//       orderDate: new Date(),
//       orderItems,
//       totalAmount,
//       orderStatus,
//       paymentMethod,
//       paymentStatus,
//       shippingAddress
//     };

//     // Add to user's placedOrders array
//     user.placedOrders.push(newOrder);
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Order placed successfully',
//       orderId
//     });
//   } catch (error) {
//     console.error('Error placing order:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });


router.post('/placeorder', async (req, res) => {
  try {
    // console.log('📦 Received order request:', JSON.stringify(req.body, null, 2));
    
    const {
      userId,
      orderId,
      orderItems,
      subTotal,
      discountAmount,
      totalAmount,
      orderStatus,
      paymentMethod,
      paymentStatus,
      paymentDetails,
      shippingAddress,
      couponDiscount
    } = req.body;

    // Validate required fields
    if (!userId) {
      console.error('❌ Missing userId');
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!orderId) {
      console.error('❌ Missing orderId');
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      console.error('❌ Invalid orderItems');
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    if (!shippingAddress || !shippingAddress.fullName) {
      console.error('❌ Invalid shippingAddress');
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }

    // Find user
    const user = await USER.findById(userId);
    
    if (!user) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('✅ User found:', user.email);

    // Create new order object with all fields
    const newOrder = {
      orderId: orderId,
      orderDate: new Date(),
      orderItems: orderItems.map(item => ({
        productId: item.productId,
        title: item.title,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        image: item.image || ''
      })),
      subTotal: parseFloat(subTotal) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      couponDiscount: parseFloat(couponDiscount) || 0,
      totalAmount: parseFloat(totalAmount) || 0,
      orderStatus: orderStatus || 'pending',
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentStatus || 'pending',
      paymentDetails: paymentDetails || {},
      shippingAddress: {
        fullName: shippingAddress.fullName?.trim() || '',
        phone: shippingAddress.phone?.trim() || '',
        addressLine1: shippingAddress.addressLine1?.trim() || '',
        addressLine2: shippingAddress.addressLine2?.trim() || '',
        city: shippingAddress.city?.trim() || '',
        state: shippingAddress.state?.trim() || '',
        pincode: shippingAddress.pincode?.trim() || '',
        country: shippingAddress.country || 'India'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // console.log('💾 Attempting to save order:', newOrder.orderId);

    // Add to user's placedOrders array
    user.placedOrders.push(newOrder);
    
    // Save with error handling
    await user.save();

    console.log('✅ Order saved successfully for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Order placed successfully',
      orderId: orderId,
      order: newOrder
    });
    
  } catch (error) {
    console.error('❌ Error placing order:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific MongoDB/Mongoose errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', messages);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: messages.join(', ')
      });
    }
    
    if (error.name === 'CastError') {
      console.error('Cast error:', error.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        error: error.message
      });
    }
    
    // Generic error response with details
    res.status(500).json({
      success: false,
      message: 'Server error while placing order',
      error: error.message || 'Internal server error'
    });
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


// Example Express.js endpoint

const razorpay = new Razorpay({
  key_id: 'rzp_test_S2KmVnYY70GNfF',
  key_secret: 'o9pkCv84xw8W7mbyqdPjyFRK' // Keep this secure on backend only
});

router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    
    const options = {
      amount: amount, // amount in paise
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`
    };
    
    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});





module.exports = router;
