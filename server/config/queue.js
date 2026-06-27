import Bull from 'bull';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const defaultJobOptions = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50,      // Keep last 50 failed jobs
  attempts: 3,           // Retry 3 times on failure
  backoff: {
    type: 'exponential',
    delay: 2000          // 2 second initial delay, doubles each retry
  }
};

let notificationQueue = null;
let scheduledNotificationQueue = null;
let queuesInitialized = false;

const initQueues = () => {
  if (process.env.DISABLE_REDIS === 'true') {
    console.log('[Queue] Redis disabled via env. Mocking queues.');
    
    const mockQueue = {
      on: () => {},
      add: async (name, data, opts) => {
        console.log(`[Queue Mock] Job added to queue: ${name}`, data);
        return { id: 'mock-job-id' };
      },
      process: () => {}
    };

    notificationQueue = mockQueue;
    scheduledNotificationQueue = mockQueue;
    queuesInitialized = true;
    return;
  }

  try {
    // Main notification dispatch queue
    notificationQueue = new Bull('notifications', REDIS_URL, {
      defaultJobOptions,
      redis: { maxRetriesPerRequest: 1 },
      settings: {
        maxStalledCount: 1,
        retryProcessDelay: 5000
      }
    });

    // Separate queue for scheduled/reminder notifications (lower priority)
    scheduledNotificationQueue = new Bull('scheduled-notifications', REDIS_URL, {
      defaultJobOptions: {
        ...defaultJobOptions,
        priority: 10 // Lower priority than immediate notifications
      },
      redis: { maxRetriesPerRequest: 1 },
      settings: {
        maxStalledCount: 1,
        retryProcessDelay: 5000
      }
    });

    // Error handling for queues
    [notificationQueue, scheduledNotificationQueue].forEach(queue => {
      queue.on('error', (err) => {
        console.log('[Queue] Error:', err.message);
      });
      queue.on('failed', (job, err) => {
        console.log(`[Queue] Job ${job?.id} failed:`, err.message);
      });
    });

    queuesInitialized = true;
    console.log('[Queue] Notification queues initialized');
  } catch (error) {
    console.log('[Queue] Failed to initialize queues:', error.message);
    queuesInitialized = false;
  }
};

initQueues();

export const NOTIFICATION_JOBS = {
  SEND_EMAIL: 'send-email',
  SEND_PUSH: 'send-push',
  SEND_IN_APP: 'send-in-app',
  SEND_REMINDER: 'send-reminder'
};

export const getNotificationQueue = () => notificationQueue;
export const getScheduledNotificationQueue = () => scheduledNotificationQueue;
export const areQueuesActive = () => queuesInitialized;
