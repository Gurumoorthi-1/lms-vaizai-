import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { certificateRepository } from '../repository/certificate.repository.js';
import { userRepository } from '../repository/user.repository.js';
import { courseRepository } from '../repository/course.repository.js';
import redisClient from '../config/redis.js';
import dotenv from 'dotenv';
dotenv.config();

const CERT_DIR = 'uploads/certificates';
const QR_DIR = 'uploads/qrcodes';
const CACHE_TTL = 3600;

// Ensure directories exist
[CERT_DIR, QR_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const getGradeFromScore = (score) => {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'Pass';
};

const generatePDF = async (cert, student, course) => {
  return new Promise((resolve, reject) => {
    const filename = `cert-${cert.certificateId}.pdf`;
    const filePath = path.join(CERT_DIR, filename);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Background styling
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1a1a2e');
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .stroke('#c9a84c').lineWidth(3);

    // Header
    doc.fillColor('#c9a84c').fontSize(36).font('Helvetica-Bold')
      .text('CERTIFICATE OF COMPLETION', { align: 'center' });

    doc.moveDown(0.5);
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica')
      .text('This is to certify that', { align: 'center' });

    // Student name
    doc.moveDown(0.3);
    doc.fillColor('#c9a84c').fontSize(30).font('Helvetica-Bold')
      .text(`${student.firstName} ${student.lastName}`, { align: 'center' });

    // Course details
    doc.moveDown(0.5);
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica')
      .text('has successfully completed the course', { align: 'center' });

    doc.moveDown(0.3);
    doc.fillColor('#c9a84c').fontSize(22).font('Helvetica-Bold')
      .text(course.title, { align: 'center' });

    // Score and grade
    if (cert.score) {
      doc.moveDown(0.5);
      doc.fillColor('#aaaaaa').fontSize(14).font('Helvetica')
        .text(`Score: ${cert.score}%  |  Grade: ${cert.grade}`, { align: 'center' });
    }

    // Metadata row
    doc.moveDown(1);
    const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.fillColor('#aaaaaa').fontSize(12)
      .text(`Issued by: ${cert.metadata?.instructorName || 'Vaizai LMS'}`, 80, doc.y, { continued: true })
      .text(`Date: ${issuedDate}`, { align: 'right' });

    // Certificate ID
    doc.moveDown(0.5);
    doc.fillColor('#666666').fontSize(10)
      .text(`Certificate ID: ${cert.certificateId}`, { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(`/${filePath.replace(/\\/g, '/')}`));
    stream.on('error', reject);
  });
};

const generateQRCode = async (verificationUrl, certificateId) => {
  const filename = `qr-${certificateId}.png`;
  const filePath = path.join(QR_DIR, filename);
  await QRCode.toFile(filePath, verificationUrl, {
    color: { dark: '#1a1a2e', light: '#ffffff' },
    width: 300
  });
  return `/${filePath.replace(/\\/g, '/')}`;
};

export const certificateService = {
  issueCertificate: async (data) => {
    console.log('[Certificate Service] issueCertificate called with data:', data);
    const { studentId, courseId, score, grade, completionDate, metadata } = data;

    // Check for existing certificate
    const existing = await certificateRepository.findByStudentAndCourse(studentId, courseId);
    if (existing) throw new Error('Certificate already issued for this student and course');

    const student = await userRepository.findById(studentId);
    if (!student) throw new Error('Student not found');
    console.log('[Certificate Service] Found student:', student);

    const course = await courseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');
    console.log('[Certificate Service] Found course:', course);

    const certificateId = uuidv4();
    const computedGrade = grade || (score ? getGradeFromScore(score) : 'Pass');
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const verificationUrl = `${baseUrl}/api/certificates/verify/${certificateId}`;
    console.log('[Certificate Service] Generated certificateId:', certificateId);

    // Create DB record first (for reference in PDF)
    const cert = await certificateRepository.create({
      studentId,
      courseId,
      certificateId,
      score,
      grade: computedGrade,
      verificationUrl,
      metadata: { ...metadata, completionDate: completionDate || new Date() }
    });
    console.log('[Certificate Service] Created certificate record:', cert);

    // Generate PDF and QR code
    const [pdfUrl, qrCodeUrl] = await Promise.all([
      generatePDF(cert, student, course),
      generateQRCode(verificationUrl, certificateId)
    ]);
    console.log('[Certificate Service] Generated pdfUrl:', pdfUrl, 'qrCodeUrl:', qrCodeUrl);

    // Update record with file paths
    const updated = await certificateRepository.updateById(cert._id, { pdfUrl, qrCodeUrl });
    console.log('[Certificate Service] Updated certificate:', updated);

    // Cache the certificate
    await redisClient.setEx(`cert:${certificateId}`, CACHE_TTL, JSON.stringify(updated));
    console.log('[Certificate Service] Cached certificate with key:', `cert:${certificateId}`);

    // Invalidate cache
    await redisClient.del('certs:all');
    await redisClient.del(`certs:student:${studentId}`);
    console.log('[Certificate Service] Invalidated caches for certs:all and', `certs:student:${studentId}`);

    return updated;
  },

  verifyCertificate: async (certificateId) => {
    console.log('[Certificate Service] verifyCertificate called with ID:', certificateId);
    const cacheKey = `cert:${certificateId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('[Certificate Service] Found cached certificate:', cached);
      return JSON.parse(cached);
    }

    const cert = await certificateRepository.findByCertificateId(certificateId);
    if (!cert) {
      console.error('[Certificate Service] Certificate not found in DB for ID:', certificateId);
      throw new Error('Certificate not found');
    }
    console.log('[Certificate Service] Found certificate in DB:', cert);

    // Map to frontend expected fields
    const mappedCert = {
      id: cert._id,
      certificateId: cert.certificateId,
      studentId: cert.studentId,
      courseId: cert.courseId,
      studentName: cert.studentId?.firstName ? `${cert.studentId.firstName} ${cert.studentId.lastName}` : '',
      courseTitle: cert.courseId?.title || '',
      grade: cert.grade,
      completionDate: cert.metadata?.completionDate || cert.issuedAt,
      verificationCode: cert.certificateId,
      status: cert.status,
      issuedAt: cert.issuedAt,
      pdfUrl: cert.pdfUrl,
      qrCodeUrl: cert.qrCodeUrl
    };

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(mappedCert));
    return mappedCert;
  },

  getMyCertificates: async (user) => {
    const isAdminOrTeacher = ['ADMIN', 'INSTRUCTOR', 'TEACHER'].includes(user.role);
    const cacheKey = isAdminOrTeacher 
      ? `certs:all` 
      : `certs:student:${user._id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let certs;
    if (isAdminOrTeacher) {
      certs = await certificateRepository.findAll();
    } else {
      certs = await certificateRepository.findByStudent(user._id);
    }
    
    // Map to frontend expected fields
    const mappedCerts = certs.map(cert => ({
      id: cert._id,
      certificateId: cert.certificateId,
      studentId: cert.studentId,
      courseId: cert.courseId,
      studentName: cert.studentId?.firstName ? `${cert.studentId.firstName} ${cert.studentId.lastName}` : '',
      courseTitle: cert.courseId?.title || '',
      grade: cert.grade,
      completionDate: cert.metadata?.completionDate || cert.issuedAt,
      verificationCode: cert.certificateId,
      status: cert.status,
      issuedAt: cert.issuedAt,
      pdfUrl: cert.pdfUrl,
      qrCodeUrl: cert.qrCodeUrl
    }));
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(mappedCerts));
    return mappedCerts;
  },

  searchCertificates: async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (query.studentId) filters.studentId = query.studentId;
    if (query.courseId) filters.courseId = query.courseId;
    if (query.status) filters.status = query.status;

    const certs = await certificateRepository.search(filters, skip, limit);
    const total = await certificateRepository.count(filters);

    return { certificates: certs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  revokeCertificate: async (certificateId, reason, user) => {
    if (!['ADMIN', 'INSTRUCTOR', 'TEACHER'].includes(user.role)) {
      throw new Error('Not authorized to revoke certificates');
    }

    const cert = await certificateRepository.findByCertificateId(certificateId);
    if (!cert) throw new Error('Certificate not found');
    if (cert.status === 'revoked') throw new Error('Certificate already revoked');

    const revoked = await certificateRepository.revoke(certificateId, reason);

    // Invalidate cache
    await redisClient.del(`cert:${certificateId}`);

    return revoked;
  }
};
