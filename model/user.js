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
        quantityType: { type: Number },
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

    // Placed Orders field - array of order objects
    placedOrders: [{
        orderId: {
            type: String,
            required: true,
            unique: true
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
            }
        }],
        totalAmount: {
            type: Number,
            required: true
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'card', 'upi', 'netbanking'],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        shippingAddress: {
            fullName: String,
            phone: String,
            addressLine1: String,
            addressLine2: String,
            city: String,
            state: String,
            pincode: String,
            country: {
                type: String,
                default: 'India'
            }
        },
        trackingId: {
            type: String
        },
        deliveredAt: {
            type: Date
        },
        cancelledAt: {
            type: Date
        },
        cancellationReason: {
            type: String
        }
    }]
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

mongoose.model("USER", userSchema);
