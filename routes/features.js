const express = require("express");
const mongoose = require("mongoose");
const router = express.Router()

const bcryptjs = require('bcryptjs');
const jwt = require("jsonwebtoken")


const USER = mongoose.model("USER");
const {Jwt_secret} = require("../keys");




// router.post('/addtocart', async (req, res) => {
//   try {
//     const { userId, productId, image, title, price } = req.body;

//     // Validate if userId is provided
//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         message: 'User ID is required'
//       });
//     }

//     // Validate if userId is a valid MongoDB ObjectId
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid user ID format'
//       });
//     }

//     // Find user by ID
//     const user = await USER.findById(userId);
    
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Initialize cart array if it doesn't exist
//     if (!user.cart) {
//       user.cart = [];
//     }

//     // Check if product already exists in cart
//     const existingItemIndex = user.cart.findIndex(
//       item => item.productId === productId
//     );

//     if (existingItemIndex !== -1) {
//       // Product exists, increment quantity
//       user.cart[existingItemIndex].quantity += 1;
//     } else {
//       // Add new product to cart
//       user.cart.push({
//         productId,
//         image,
//         title,
//         price,
//         quantity: 1,
//         addedAt: new Date()
//       });
//     }

//     // Save updated user
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Item added to cart successfully',
//       cart: user.cart
//     });

//   } catch (error) {
//     console.error('Error adding to cart:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// });

router.post('/addtocart', async (req, res) => {
  try {
    const { userId, productId, image, title, price } = req.body;

    // Validate if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Find user by ID
    const user = await USER.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize cart array if it doesn't exist
    if (!user.cart) {
      user.cart = [];
    }

    // Check if product with same ID AND title already exists in cart
    const existingItemIndex = user.cart.findIndex(
      item => item.productId === productId && item.title === title
    );

    if (existingItemIndex !== -1) {
      // Product with same ID and title exists, increment quantity
      user.cart[existingItemIndex].quantity += 1;
    } else {
      // Add new product to cart (different size/variant)
      user.cart.push({
        productId,
        image,
        title,
        price,
        quantity: 1,
        addedAt: new Date()
      });
    }

    // Save updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      cart: user.cart
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/getcart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Find user by ID and select only cart field
    const user = await USER.findById(userId).select('cart');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate total items and subtotal
    const totalItems = user.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subTotal = user.cart.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      cart: user.cart || [],
      totalItems: totalItems,
      subTotal: subTotal.toFixed(2)
    });

  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});


// Update Cart Item Quantity
router.post('/updatecartquantity', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    // Validate inputs
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Product ID are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // If quantity is 0 or less, remove the item
    if (quantity <= 0) {
      const user = await USER.findByIdAndUpdate(
        userId,
        {
          $pull: { cart: { productId: productId } }
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Calculate totals
      const totalItems = user.cart.reduce((sum, item) => sum + item.quantity, 0);
      const subTotal = user.cart.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);

      return res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        cart: user.cart,
        totalItems: totalItems,
        subTotal: subTotal.toFixed(2)
      });
    }

    // Update the quantity
    const user = await USER.findOneAndUpdate(
      { _id: userId, 'cart.productId': productId },
      {
        $set: { 'cart.$.quantity': quantity }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User or product not found in cart'
      });
    }

    // Calculate totals
    const totalItems = user.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subTotal = user.cart.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Quantity updated successfully',
      cart: user.cart,
      totalItems: totalItems,
      subTotal: subTotal.toFixed(2)
    });

  } catch (error) {
    console.error('Error updating cart quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Remove Item from Cart
router.post('/removefromcart', async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Product ID are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await USER.findByIdAndUpdate(
      userId,
      {
        $pull: { cart: { productId: productId } }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate totals
    const totalItems = user.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subTotal = user.cart.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: user.cart,
      totalItems: totalItems,
      subTotal: subTotal.toFixed(2)
    });

  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

























// Add to Wishlist
router.post('/addtowishlist', async (req, res) => {
  try {
    const { userId, productId, image, title, price } = req.body;

    // Validate if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Find user by ID
    const user = await USER.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize wishlist array if it doesn't exist
    if (!user.wishlist) {
      user.wishlist = [];
    }

    // Check if product already exists in wishlist
    const existingItem = user.wishlist.find(
      item => item.productId === productId
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Item already in wishlist'
      });
    }

    // Add new product to wishlist
    user.wishlist.push({
      productId,
      image,
      title,
      price,
      addedAt: new Date()
    });

    // Save updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Item added to wishlist successfully',
      wishlist: user.wishlist
    });

  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Remove from Wishlist
router.post('/removefromwishlist', async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Validate if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Find user and remove item from wishlist
    const user = await USER.findByIdAndUpdate(
      userId,
      {
        $pull: { wishlist: { productId: productId } }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist successfully',
      wishlist: user.wishlist
    });

  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get Wishlist
router.get('/getwishlist/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await USER.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      wishlist: user.wishlist || []
    });

  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});












































module.exports = router;