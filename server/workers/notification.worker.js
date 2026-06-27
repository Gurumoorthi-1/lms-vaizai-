/**
 * notification.worker.js
 * 
 * Bull background worker — processes notification jobs from the queue.
 * Runs as a separate process or alongside the main server.
 * Handles: email sending, push notifications, in-app creation.
 * 
 * In production, run this as a separate process:
 *   node workers/notification.worker.js
 */
import { getNotificationQueue, getScheduledNotificationQueue, areQueuesActive, NOTIFICATION_JOBS } from '../config/queue.js';
import { sendEmail } from '../service/notification.service.js';

const processJob = async (job) => {
  const { name, data } = job;
  console.log(`[Worker] Processing job: ${name} (id: ${job.id})`);

  switch (name) {
    case NOTIFICATION_JOBS.SEND_EMAIL: {
      await sendEmail(data);
      console.log(`[Worker] ✅ Email sent to: ${data.to}`);
      break;
    }



    case NOTIFICATION_JOBS.SEND_REMINDER:
    case NOTIFICATION_JOBS.SEND_IN_APP: {
      // In-app notifications are already persisted by notify().
      // This slot can be used for additional in-app side-effects (e.g., badge count via Socket).
      console.log(`[Worker] ✅ In-app notification processed for user ${data.userId}`);
      break;
    }

    default:
      console.warn(`[Worker] Unknown job type: ${name}`);
  }
};

const initWorker = () => {
  if (!areQueuesActive()) {
    console.log('[Worker] Queues not available, worker will start when queues are ready');
    return;
  }

  const notificationQueue = getNotificationQueue();
  const scheduledNotificationQueue = getScheduledNotificationQueue();

  // Register processor on both queues
  notificationQueue.process('*', 5, processJob);           // 5 concurrent workers
  scheduledNotificationQueue.process('*', 2, processJob);  // 2 concurrent for scheduled

  // Event listeners
  notificationQueue.on('failed', (job, err) => {
    console.error(`[Worker] ❌ Job ${job.id} (${job.name}) failed: ${err.message}`);
  });

  scheduledNotificationQueue.on('failed', (job, err) => {
    console.error(`[Worker] ❌ Scheduled job ${job.id} failed: ${err.message}`);
  });

  notificationQueue.on('completed', (job) => {
    console.log(`[Worker] ✅ Job ${job.id} completed`);
  });

  console.log('[Worker] 🚀 Notification worker started and listening for jobs...');
};

initWorker();
