import { adminService } from '../service/admin.service.js';

export const adminController = {
  updateUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      
      const user = await adminService.updateUserRole(id, role, req.user, ip);
      res.json({ message: 'User role updated successfully', user });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ip = req.ip || req.connection.remoteAddress;

      const user = await adminService.updateUserStatus(id, status, req.user, ip);
      res.json({ message: `User account is now ${status}`, user });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getAuditLogs: async (req, res) => {
    try {
      const result = await adminService.getAuditLogs(req.query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  updateSetting: async (req, res) => {
    try {
      const { key, value } = req.body;
      const ip = req.ip || req.connection.remoteAddress;

      const setting = await adminService.updateSetting(key, value, req.user, ip);
      res.json({ message: 'System setting updated successfully', setting });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getAllSettings: async (req, res) => {
    try {
      const settings = await adminService.getAllSettings();
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};
