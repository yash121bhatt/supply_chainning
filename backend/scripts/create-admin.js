require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

async function createAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI not set in .env file');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const name = args[0] || process.env.ADMIN_NAME || 'Admin';
  const email = args[1] || process.env.ADMIN_EMAIL || 'admin@supplychain.com';
  const password = args[2] || process.env.ADMIN_PASSWORD || 'admin123';

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const users = mongoose.connection.db.collection('users');
    const existing = await users.findOne({
      $or: [
        { role: USER_ROLES.ADMIN },
        { email }
      ]
    });
    if (existing) {
      console.log(`⚠  Admin user already exists: ${existing.email}`);
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await users.insertOne({
      name,
      email,
      phone: '0000000000',
      password: hashedPassword,
      role: USER_ROLES.ADMIN,
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✓ Admin user created successfully!');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin();
