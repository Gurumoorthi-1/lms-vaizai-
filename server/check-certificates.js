
import mongoose from 'mongoose';
import Certificate from './models/Certificate.js';
import User from './models/User.js';
import Course from './models/Course.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkCerts() {
  console.log('[Check Certificates] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Check Certificates] Connected!');

  const certs = await Certificate.find({}).populate('studentId courseId');
  console.log('[Check Certificates] Found', certs.length, 'certificates:');
  certs.forEach(cert => {
    console.log('  - ID:', cert._id);
    console.log('    Certificate ID:', cert.certificateId);
    console.log('    Student:', cert.studentId ? `${cert.studentId.firstName} ${cert.studentId.lastName}` : 'N/A');
    console.log('    Course:', cert.courseId ? cert.courseId.title : 'N/A');
    console.log('    Status:', cert.status);
    console.log('---');
  });

  await mongoose.disconnect();
  console.log('[Check Certificates] Done!');
}

checkCerts().catch(err => {
  console.error('[Check Certificates] Error:', err);
  process.exit(1);
});
