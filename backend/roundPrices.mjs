import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';

dotenv.config();

const roundPrices = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dripmen';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to update.`);

    for (const product of products) {
      if (product.price) {
        // Round up to nearest whole number or handle specific cases
        // User examples: 499 -> 500, 999 -> 1000
        // We can just add 1 if it ends in 99, or more generally round to nearest 10 or 100.
        // I'll use Math.ceil(price / 10) * 10 or similar.
        // But specifically 499 -> 500 is adding 1.
        
        let newPrice = product.price;
        if (product.price % 100 === 99) {
          newPrice = product.price + 1;
        } else if (product.price % 10 === 9) {
          newPrice = product.price + 1;
        } else {
          // General rounding to nearest 10 or 100 if user wants "full number"
          newPrice = Math.ceil(product.price / 10) * 10;
        }

        console.log(`Updating ${product.name}: ${product.price} -> ${newPrice}`);
        await Product.findByIdAndUpdate(product._id, { $set: { price: newPrice, salePrice: null } });
      }
    }

    console.log('✅ Price rounding successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during price rounding:', err);
    process.exit(1);
  }
};

roundPrices();
