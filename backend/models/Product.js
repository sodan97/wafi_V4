import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  imageUrls: {
    type: [String],
    default: []
  },
  stock: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

export default Product;
