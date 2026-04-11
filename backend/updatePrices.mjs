import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import Category from './src/models/categoryModel.js';

dotenv.config();

const updatePrices = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dripmen';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const priceMap = {
      'T-shirts': 499,
      'Hoodies': 1499,
      'Sweatshirt': 999, // User said "sweatShirts", checking category name
      'Jackets': 1999
    };

    // Also handle possible variations in category names
    const categories = await Category.find({});
    console.log('Available categories:', categories.map(c => c.name));

    for (const [key, newPrice] of Object.entries(priceMap)) {
      const category = categories.find(c => 
        c.name.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (category) {
        console.log(`Updating products in category: ${category.name} (${category._id}) to ₹${newPrice}`);
        const result = await Product.updateMany(
          { categoryId: category._id },
          { 
            $set: { 
              price: newPrice,
              salePrice: null // Clear sale prices to match the new flat rate
            } 
          }
        );
        console.log(`Successfully updated ${result.modifiedCount} products.`);
      } else {
        console.warn(`Could not find a matching category for "${key}"`);
      }
    }

    console.log('✅ Database migration successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during migration:', err);
    process.exit(1);
  }
};

updatePrices();
