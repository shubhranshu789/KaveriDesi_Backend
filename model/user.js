const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    cart: [{
        productId: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        price: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        quantityType: { 
            type: String 
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],

    wishlist: [{
        productId: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        price: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Enhanced Placed Orders field with all necessary fields
    placedOrders: [{
        orderId: {
            type: String,
            required: true
            // Remove 'unique: true' from subdocument - it causes issues
        },
        orderDate: {
            type: Date,
            default: Date.now
        },
        orderItems: [{
            productId: {
                type: String,
                required: true
            },
            image: {
                type: String,
                default: ''
            },
            title: {
                type: String,
                required: true
            },
            price: {
                type: Number, // Changed from String to Number for calculations
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            }
        }],
        
        // NEW: Price breakdown fields
        subTotal: {
            type: Number,
            default: 0
        },
        discountAmount: {
            type: Number,
            default: 0
        },
        couponDiscount: {
            type: Number,
            default: 0
        },
        totalAmount: {
            type: Number,
            required: true
        },
        
        orderStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
        
        // NEW: Updated payment method to include 'razorpay' and 'online'
        paymentMethod: {
            type: String,
            enum: ['cod', 'razorpay', 'online', 'card', 'upi', 'netbanking'],
            required: true
        },
        
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        
        // NEW: Payment details for Razorpay transactions
        paymentDetails: {
            razorpay_payment_id: {
                type: String,
                default: ''
            },
            razorpay_order_id: {
                type: String,
                default: ''
            },
            razorpay_signature: {
                type: String,
                default: ''
            }
        },
        
        shippingAddress: {
            fullName: {
                type: String,
                required: true
            },
            phone: {
                type: String,
                required: true
            },
            addressLine1: {
                type: String,
                required: true
            },
            addressLine2: {
                type: String,
                default: ''
            },
            city: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            pincode: {
                type: String,
                required: true
            },
            country: {
                type: String,
                default: 'India'
            }
        },
        
        trackingId: {
            type: String,
            default: ''
        },
        
        deliveredAt: {
            type: Date
        },
        
        cancelledAt: {
            type: Date
        },
        
        cancellationReason: {
            type: String,
            default: ''
        },
        
        // NEW: Additional tracking fields
        estimatedDelivery: {
            type: Date
        },
        
        shippedAt: {
            type: Date
        },
        
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true // Adds createdAt and updatedAt automatically to the user document
});

// Add index for faster queries on orderId
userSchema.index({ 'placedOrders.orderId': 1 });

// Add index for email (should be unique)
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("USER", userSchema);
