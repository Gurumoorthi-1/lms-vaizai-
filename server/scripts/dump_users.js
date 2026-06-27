import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      firstName: String,
      lastName: String,
      role: String
    }));

    const Course = mongoose.model('Course', new mongoose.Schema({
      title: String,
      code: String
    }));

    const users = await User.find({});
    console.log('Users list:');
    users.forEach(u => {
      console.log(`- ${u.email}: ${u.firstName} ${u.lastName} (Role: ${u.role}, ID: ${u._id})`);
    });

    const courses = await Course.find({});
    console.log('Courses list:');
    courses.forEach(c => {
      console.log(`- ${c.title} (${c.code}), ID: ${c._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
