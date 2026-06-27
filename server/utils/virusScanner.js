import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Scan a file buffer for viruses.
 * Supports standard EICAR test file detection and extensible ClamAV system scans.
 * 
 * @param {Buffer} buffer The file contents buffer
 * @param {string} filename The name of the file
 * @returns {Promise<boolean>} True if clean, throws Error if infected or execution fails in strict mode
 */
export const scanFile = async (buffer, filename) => {
  // 1. EICAR Antivirus Test Signature Check (Industry standard validation)
  const fileContent = buffer.toString('utf-8');
  if (fileContent.includes('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')) {
    throw new Error('Security Threat Detected: The file contains the EICAR Antivirus Test Signature.');
  }

  // 2. Extensible ClamAV System Scan
  if (process.env.VIRUS_SCAN_ENABLED === 'true') {
    const tempDir = os.tmpdir();
    // Sanitize filename to prevent command injection
    const sanitizedFilename = path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
    const tempFilePath = path.join(tempDir, `scan-${Date.now()}-${sanitizedFilename}`);

    try {
      await fs.promises.writeFile(tempFilePath, buffer);
      
      // Execute local clamscan command
      // clamscan exit codes: 0 = No virus, 1 = Virus(es) found, 2 = Error occurred
      await execAsync(`clamscan --no-summary "${tempFilePath}"`);
    } catch (error) {
      // Exit code 1 means virus was detected
      if (error.code === 1) {
        throw new Error('Security Threat Detected: ClamAV identified potential malware in this file.');
      }
      
      // Handle actual execution errors (e.g., clamscan not installed)
      console.error('Virus scan execution warning:', error.message);
      
      // If strict mode is enabled, block uploads when scanning is broken
      if (process.env.VIRUS_SCAN_STRICT === 'true') {
        throw new Error('System Security Guard: Could not verify file safety. Upload rejected.');
      }
    } finally {
      // Securely delete temporary file
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
        }
      } catch (cleanupError) {
        console.error('Temporary file clean up failure:', cleanupError.message);
      }
    }
  }

  return true;
};
