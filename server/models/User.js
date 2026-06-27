import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['STUDENT', 'INSTRUCTOR', 'TEACHER', 'ADMIN', 'TEACHING_ASSISTANT', 'MODERATOR'],
    default: 'STUDENT'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  verificationOTP: {
    otp: String,
    expiresAt: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetPasswordOTP: {
    otp: String,
    expiresAt: Date
  },
  deviceHistory: [{
    device: String,
    ip: String,
    lastLogin: Date
  }],
  settings: {
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC+5:30' },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    desktopNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    twoFactor: { type: Boolean, default: false },
    loginAlerts: { type: Boolean, default: true }
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  learningHistory: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    lastAccessed: Date,
    completed: { type: Boolean, default: false }
  }],
  achievements: [{
    title: String,
    description: String,
    badgeUrl: String,
    awardedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
