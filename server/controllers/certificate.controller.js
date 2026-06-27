import { certificateService } from '../service/certificate.service.js';

export const issueCertificate = async (req, res) => {
  try {
    const result = await certificateService.issueCertificate(req.body);
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const verifyCertificate = async (req, res) => {
  try {
    console.log('[Certificate Controller] verifyCertificate called with ID:', req.params.certificateId);
    const result = await certificateService.verifyCertificate(req.params.certificateId);
    console.log('[Certificate Controller] verifyCertificate found:', result);
    res.json(result);
  } catch (e) { 
    console.error('[Certificate Controller] verifyCertificate error:', e);
    res.status(404).json({ message: e.message }); 
  }
};

export const getMyCertificates = async (req, res) => {
  try {
    console.log('[Certificate Controller] getMyCertificates called by user:', req.user.role, req.user._id);
    const result = await certificateService.getMyCertificates(req.user);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const searchCertificates = async (req, res) => {
  try {
    const result = await certificateService.searchCertificates(req.query);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const revokeCertificate = async (req, res) => {
  try {
    const result = await certificateService.revokeCertificate(
      req.params.certificateId, req.body.reason, req.user
    );
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const downloadCertificate = async (req, res) => {
  try {
    const cert = await certificateService.verifyCertificate(req.params.certificateId);
    if (!cert.pdfUrl) return res.status(404).json({ message: 'PDF not found' });
    
    // Strip leading slash and serve
    res.download(cert.pdfUrl.replace(/^\//, ''), `certificate-${cert.certificateId}.pdf`);
  } catch (e) { res.status(404).json({ message: e.message }); }
};
