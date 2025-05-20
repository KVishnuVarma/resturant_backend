// server/models/DeliveryBoy.js
const mongoose = require('mongoose');

const deliveryBoySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['available', 'busy'], default: 'available' },  deliveries: [{
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, min: 1, max: 5 },
    tip: { type: Number, default: 0 },
    earnings: { type: Number, required: true }, // Delivery charge + tip
    comment: String,
    deliveredAt: { type: Date }
  }],
  earnings: {
    total: { type: Number, default: 0 }, // Total earnings including tips
    tips: { type: Number, default: 0 }, // Total tips earned
    deliveryCharges: { type: Number, default: 0 } // Total delivery charges earned
  },
  ratings: {
    average: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  performance: {
    totalDeliveries: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // Percentage of successful deliveries
    onTimeRate: { type: Number, default: 0 } // Percentage of on-time deliveries
  },
}, { timestamps: true });

// Remove password from JSON responses
deliveryBoySchema.methods.toJSON = function() {
  const deliveryBoy = this.toObject();
  delete deliveryBoy.password;
  return deliveryBoy;
};

// Update statistics when a delivery is completed
deliveryBoySchema.methods.updateStats = async function() {
  try {
    // First populate required order data
    await this.populate('deliveries.order');
    
    if (this.deliveries.length > 0) {
      // Calculate ratings
      const ratings = this.deliveries.filter(d => d.rating).map(d => d.rating);
      this.ratings.count = ratings.length;
      this.ratings.total = ratings.reduce((a, b) => a + b, 0);
      this.ratings.average = this.ratings.count > 0 ? this.ratings.total / this.ratings.count : 0;

      // Calculate earnings
      let totalTips = 0;
      let totalDeliveryCharges = 0;

      this.deliveries.forEach(del => {
        totalTips += del.tip || 0;
        totalDeliveryCharges += del.earnings || 0;
      });

      this.earnings.tips = totalTips;
      this.earnings.deliveryCharges = totalDeliveryCharges;
      this.earnings.total = totalTips + totalDeliveryCharges;

      // Calculate performance
      this.performance.totalDeliveries = this.deliveries.length;
      let onTimeDeliveries = 0;

      this.deliveries.forEach(del => {
        if (del.deliveredAt && del.order?.createdAt) {
          const deliveryTime = new Date(del.deliveredAt).getTime() - new Date(del.order.createdAt).getTime();
          if (deliveryTime <= 45 * 60 * 1000) { // 45 minutes
            onTimeDeliveries++;
          }
        }
      });

      this.performance.onTimeRate = this.performance.totalDeliveries > 0 
        ? (onTimeDeliveries / this.performance.totalDeliveries) * 100 
        : 0;
      this.performance.completionRate = 100; // Can be adjusted if you track cancelled/failed deliveries

      // Update availability status
      const Order = mongoose.model('Order');
      const hasActiveDelivery = await Order.exists({
        assignedTo: this._id,
        status: { $in: ['assigned', 'delivering'] }
      });
      this.status = hasActiveDelivery ? 'busy' : 'available';

      // Mark the document as modified
      this.markModified('earnings');
      this.markModified('ratings');
      this.markModified('performance');
    }
  } catch (err) {
    console.error('Error updating delivery boy stats:', err);
    throw err;
  }
};

const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

module.exports = DeliveryBoy;