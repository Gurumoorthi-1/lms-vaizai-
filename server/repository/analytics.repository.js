import User from '../models/User.js';
import Session from '../models/Session.js';
import Enrollment from '../models/Enrollment.js';
import Submission from '../models/Submission.js';
import Order from '../models/Order.js';
import Course from '../models/Course.js';

export const analyticsRepository = {
  getTotalStudents: async () => {
    return await User.countDocuments({ role: 'STUDENT' });
  },

  getTotalTeachers: async () => {
    return await User.countDocuments({ role: { $in: ['TEACHER', 'INSTRUCTOR'] } });
  },

  getTotalCourses: async () => {
    return await Course.countDocuments({});
  },

  getActiveStudents: async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUserIds = await Session.distinct('userId', {
      updatedAt: { $gte: thirtyDaysAgo },
      isRevoked: false
    });
    
    // Count how many of those active users are students
    return await User.countDocuments({
      _id: { $in: activeUserIds },
      role: 'STUDENT'
    });
  },

  getCourseCompletionStats: async () => {
    return await Enrollment.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ['$progress', 100] }, 1, 0] }
          },
          averageProgress: { $avg: '$progress' }
        }
      },
      {
        $project: {
          _id: 0,
          totalEnrollments: 1,
          completedEnrollments: 1,
          averageProgress: { $round: ['$averageProgress', 2] },
          completionRate: {
            $cond: [
              { $gt: ['$totalEnrollments', 0] },
              { $round: [{ $multiply: [{ $divide: ['$completedEnrollments', '$totalEnrollments'] }, 100] }, 2] },
              0
            ]
          }
        }
      }
    ]);
  },

  getAssignmentStats: async () => {
    return await Submission.aggregate([
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          gradedSubmissions: {
            $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] }
          },
          averageMarks: { $avg: '$marks' },
          lateSubmissions: {
            $sum: { $cond: [{ $eq: ['$isLate', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalSubmissions: 1,
          gradedSubmissions: 1,
          averageMarks: { $round: ['$averageMarks', 2] },
          lateSubmissions: 1
        }
      }
    ]);
  },

  getRevenueStats: async () => {
    const stats = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalSales: { $sum: 1 }
        }
      }
    ]);
    return stats.length > 0 ? stats[0] : { totalRevenue: 0, totalSales: 0 };
  },

  getTeacherPerformance: async () => {
    return await Course.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'courseId',
          as: 'enrollments'
        }
      },
      {
        $project: {
          teacherId: 1,
          teacherName: 1,
          enrollmentsCount: { $size: '$enrollments' },
          completionsCount: {
            $sum: {
              $map: {
                input: '$enrollments',
                as: 'e',
                in: { $cond: [{ $eq: ['$$e.progress', 100] }, 1, 0] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$teacherId',
          teacherName: { $first: '$teacherName' },
          totalCourses: { $sum: 1 },
          totalEnrollments: { $sum: '$enrollmentsCount' },
          totalCompletions: { $sum: '$completionsCount' }
        }
      },
      { $sort: { totalEnrollments: -1 } }
    ]);
  },

  getStudentGrowth: async (interval = 'monthly') => {
    const dateField = '$createdAt';
    let groupId = {};
    if (interval === 'weekly') {
      groupId = { year: { $year: dateField }, week: { $week: dateField } };
    } else {
      groupId = { year: { $year: dateField }, month: { $month: dateField } };
    }

    return await User.aggregate([
      { $match: { role: 'STUDENT' } },
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
    ]);
  },

  getMostViewedCourses: async () => {
    return await Enrollment.aggregate([
      {
        $group: {
          _id: '$courseId',
          enrollmentCount: { $sum: 1 },
          averageProgress: { $avg: '$progress' },
          totalWatchTimeSeconds: { $sum: '$watchTimeSeconds' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $project: {
          _id: 0,
          courseId: '$_id',
          title: '$courseDetails.title',
          teacherName: '$courseDetails.teacherName',
          price: '$courseDetails.price',
          thumbnail: '$courseDetails.thumbnail',
          enrollmentCount: 1,
          averageProgress: { $round: ['$averageProgress', 2] },
          totalWatchTimeSeconds: 1
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 10 }
    ]);
  },

  getWeeklyMonthlyReport: async (type = 'revenue', interval = 'monthly') => {
    const dateField = '$createdAt';
    let groupId = {};
    if (interval === 'weekly') {
      groupId = { year: { $year: dateField }, week: { $week: dateField } };
    } else {
      groupId = { year: { $year: dateField }, month: { $month: dateField } };
    }

    if (type === 'revenue') {
      return await Order.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: groupId,
            value: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
      ]);
    } else {
      // Enrollment growth
      return await Enrollment.aggregate([
        {
          $group: {
            _id: groupId,
            value: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
      ]);
    }
  }
};
