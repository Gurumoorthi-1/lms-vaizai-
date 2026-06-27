import Session from '../models/Session.js';
import { encryptDeterministic, decryptDeterministic } from '../utils/encryption.js';

export const sessionRepository = {
  create: async (sessionData) => {
    const encryptedToken = encryptDeterministic(sessionData.refreshToken);
    return await Session.create({
      ...sessionData,
      refreshToken: encryptedToken
    });
  },

  findByToken: async (refreshToken) => {
    const encryptedToken = encryptDeterministic(refreshToken);
    const session = await Session.findOne({ refreshToken: encryptedToken, isRevoked: false });
    if (session) {
      session.refreshToken = decryptDeterministic(session.refreshToken);
    }
    return session;
  },

  revokeByToken: async (refreshToken) => {
    const encryptedToken = encryptDeterministic(refreshToken);
    return await Session.findOneAndUpdate(
      { refreshToken: encryptedToken },
      { isRevoked: true },
      { new: true }
    );
  },

  revokeAllForUser: async (userId) => {
    return await Session.updateMany(
      { userId },
      { isRevoked: true }
    );
  },

  findActiveByUser: async (userId) => {
    return await Session.find({ userId, isRevoked: false });
  },

  revokeById: async (id, userId) => {
    return await Session.findOneAndUpdate(
      { _id: id, userId },
      { isRevoked: true },
      { new: true }
    );
  }
};


