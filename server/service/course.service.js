import { courseRepository } from '../repository/course.repository.js';
import { auditRepository } from '../repository/audit.repository.js';
import redisClient from '../config/redis.js';

const CACHE_EXPIRATION = 3600; // 1 hour

// Helper function to transform course data
const transformCourse = (course) => {
  const obj = course.toObject ? course.toObject() : course;
  return {
    id: obj._id,
    _id: obj._id,
    title: obj.title,
    description: obj.description,
    category: obj.category,
    level: obj.level,
    status: obj.status,
    teacherId: typeof obj.teacherId === 'object' ? obj.teacherId._id : obj.teacherId,
    teacherName: obj.teacherName,
    createdAt: obj.createdAt
  };
};

export const courseService = {
  createCourse: async (courseData, user, req) => {
    const course = await courseRepository.create({
      ...courseData,
      teacherId: user._id,
      teacherName: `${user.firstName} ${user.lastName}`,
      status: 'draft',
      version: 1
    });

    await auditRepository.create({
      userId: user._id,
      action: 'CREATE_COURSE',
      resource: 'Course',
      resourceId: course._id,
      ipAddress: req.ip
    });

    // Invalidate list cache
    await redisClient.del('courses:list');

    return transformCourse(course);
  },

  getCourseById: async (id) => {
    const cacheKey = `course:${id}`;
    const cachedCourse = await redisClient.get(cacheKey);

    if (cachedCourse) {
      return JSON.parse(cachedCourse);
    }

    const course = await courseRepository.findById(id);
    if (!course) throw new Error('Course not found');

    const transformed = transformCourse(course);
    await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(transformed));
    return transformed;
  },

  getAllCourses: async (query) => {
    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    const filters = {};
    if (query.category) filters.category = query.category;
    if (query.level) filters.level = query.level;
    if (query.status) filters.status = query.status;

    // Search
    if (query.search) {
      filters.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    if (query.sortBy) {
      const order = query.sortOrder === 'desc' ? -1 : 1;
      sort[query.sortBy] = order;
    } else {
      sort.createdAt = -1;
    }

    // Attempt cache if simple default query
    const isSimpleQuery = Object.keys(query).length === 0;
    if (isSimpleQuery) {
      const cachedList = await redisClient.get('courses:list');
      if (cachedList) return JSON.parse(cachedList);
    }

    const courses = await courseRepository.findAll(filters, sort, skip, limit);
    const transformedCourses = courses.map(transformCourse);

    if (isSimpleQuery) {
      await redisClient.setEx('courses:list', CACHE_EXPIRATION, JSON.stringify(transformedCourses));
    }

    return transformedCourses;
  },

  updateCourse: async (id, updateData, user, req) => {
    const course = await courseRepository.findById(id);
    if (!course) throw new Error('Course not found');

    if (course.teacherId.toString() !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized to update this course');
    }

    const updated = await courseRepository.updateById(id, updateData);

    await redisClient.del(`course:${id}`);
    await redisClient.del('courses:list');

    await auditRepository.create({
      userId: user._id,
      action: 'UPDATE_COURSE',
      resource: 'Course',
      resourceId: id,
      ipAddress: req.ip
    });

    return updated;
  },

  deleteCourse: async (id, user, req) => {
    const course = await courseRepository.findById(id);
    if (!course) throw new Error('Course not found');

    if (course.teacherId.toString() !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized to delete this course');
    }

    await courseRepository.deleteById(id);

    await redisClient.del(`course:${id}`);
    await redisClient.del('courses:list');

    await auditRepository.create({
      userId: user._id,
      action: 'DELETE_COURSE',
      resource: 'Course',
      resourceId: id,
      ipAddress: req.ip
    });

    return { message: 'Course deleted successfully' };
  },

  publishCourse: async (id, user, req) => {
    return await courseService.updateCourse(id, { status: 'published' }, user, req);
  },

  archiveCourse: async (id, user, req) => {
    return await courseService.updateCourse(id, { status: 'archived' }, user, req);
  },

  createVersion: async (id, user, req) => {
    const course = await courseRepository.findById(id);
    if (!course) throw new Error('Course not found');

    if (course.teacherId.toString() !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Not authorized');
    }

    // Mark old version as not latest
    await courseRepository.updateById(id, { isLatestVersion: false });

    // Create new draft version
    const newVersionData = course.toObject();
    delete newVersionData._id;
    delete newVersionData.createdAt;
    delete newVersionData.updatedAt;
    
    newVersionData.version = course.version + 1;
    newVersionData.status = 'draft';
    newVersionData.isLatestVersion = true;
    newVersionData.previousVersionId = course._id;

    const newCourse = await courseRepository.create(newVersionData);

    await redisClient.del(`course:${id}`);
    await redisClient.del('courses:list');

    await auditRepository.create({
      userId: user._id,
      action: 'VERSION_COURSE',
      resource: 'Course',
      resourceId: newCourse._id,
      details: { previousId: course._id },
      ipAddress: req.ip
    });

    return newCourse;
  }
};
