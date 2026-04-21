import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Product from './backend/src/models/Product.js';
import User from './backend/src/models/userModel.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find admin
  const admin = await User.findOne({ role: 'admin' });
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  console.log('Token:', token);
  
  const FormData = (await import('formdata-node')).FormData;
  const { fileFromPath } = await import('formdata-node/file-from-path');
  const fetch = (await import('node-fetch')).default;
  
  // Create a product
  const form = new FormData();
  form.append('name', 'Crash Test');
  form.append('price', '100');
  form.append('categoryId', '60b8d295f1d2b30015f3e1a1'); // fake or real
  form.append('description', 'Test');
  
  // Add a dummy image file
  const fs = await import('fs');
  fs.writeFileSync('test.jpg', 'fake image data');
  
  form.append('images', await fileFromPath('test.jpg'));
  
  const res = await fetch('http://127.0.0.1:4000/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  
  const data = await res.json();
  console.log('Create:', data);
  
  if (data.success) {
    // Update product
    const form2 = new FormData();
    form2.append('name', 'Crash Test Updated');
    form2.append('images', await fileFromPath('test.jpg'));
    
    const res2 = await fetch(`http://127.0.0.1:4000/api/products/${data.product._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: form2
    });
    
    console.log('Update Status:', res2.status);
    const text2 = await res2.text();
    console.log('Update Result:', text2);
  }
  
  process.exit();
}
run();
