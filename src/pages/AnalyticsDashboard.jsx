import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, BookOpen, GraduationCap, Calendar, Download, 
  ArrowUpRight, ArrowDownRight, Award, Filter, RefreshCw, Star 
} from 'lucide-react';
import { api } from '../services/api';
import { useToastStore } from '../store/toastStore';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [activeRevenueSeries, setActiveRevenueSeries] = useState({ revenue: true, expenses: true });
  
  const { addToast } = useToastStore();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.getAnalyticsData();
      setData(response);
    } catch (error) {
      addToast(error.message || 'Failed to fetch analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = () => {
    if (!data) return;
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const csvContent = "data:text/csv;charset=utf-8," 
          + "Metric,Value\n"
          + `Total Revenue,$${data.summary.totalRevenue}\n`
          + `Total Students,${data.summary.totalStudents}\n`
          + `Total Teachers,${data.summary.totalTeachers}\n`
          + `Total Courses,${data.summary.totalCourses}\n`
          + `Total Enrollments,${data.summary.totalEnrollments}\n`
          + `Completion Rate,${data.summary.completionRate}%\n`
          + `Certificates Issued,${data.summary.totalCertificates}\n`
          + `Average Progress,${data.summary.avgStudentProgress}%\n`;
          
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Vaizai_LMS_Analytics_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addToast('Analytics report exported successfully! 🚀', 'success');
      } catch (err) {
        addToast('Failed to export report', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 1200);
  };

  // Default data to prevent errors
  const defaultData = {
    summary: {
      totalRevenue: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalCourses: 0,
      totalEnrollments: 0,
      completionRate: 0,
      totalCertificates: 0,
      avgStudentProgress: 0
    },
    revenueData: [],
    assignmentData: [],
    userGrowthData: [],
    completionData: [],
    dailyActiveUsers: [],
    teacherPerformance: []
  };

  const currentData = data || defaultData;

  // Summary Metrics with trend details
  const cards = [
    {
      title: 'Total Revenue',
      value: `$${(currentData.summary.totalRevenue || 0).toLocaleString()}`,
      change: '+18.2%',
      trend: 'up',
      icon: TrendingUp,
      desc: 'from last month',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
    },
    {
      title: 'Active Students',
      value: (currentData.summary.totalStudents || 0).toString(),
      change: '+12.4%',
      trend: 'up',
      icon: Users,
      desc: 'new admissions',
      color: 'from-indigo-500/20 to-blue-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/10'
    },
    {
      title: 'Course Completion Rate',
      value: `${currentData.summary.completionRate || 0}%`,
      change: '+4.5%',
      trend: 'up',
      icon: GraduationCap,
      desc: 'overall course pass rate',
      color: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/10'
    },
    {
      title: 'Certificates Issued',
      value: (currentData.summary.totalCertificates || 0).toString(),
      change: '+22.1%',
      trend: 'up',
      icon: Award,
      desc: 'earned by students',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/10'
    },
  ];

  // Colors for donut chart
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
          </div>
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white bg-clip-text">
            Analytics Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring, financial tracking, course completion statistics and teacher performance insights.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-150"
            title="Refresh analytics data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200 text-sm w-full md:w-auto disabled:opacity-50"
          >
            {isExporting ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Highlight Gradient strip on top */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.color.split(' ')[0]} ${card.color.split(' ')[1]}`}></div>
              
              <div className="flex justify-between items-start">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{card.title}</p>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color.split(' ')[0]} ${card.color.split(' ')[1]} ${card.color.split(' ')[2]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</h3>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`flex items-center text-xs font-bold ${card.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {card.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                    {card.change}
                  </span>
                  <span className="text-xs text-slate-400">{card.desc}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Revenue & Expenses Growth (Interactive Area Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue & Expenses Trend</h3>
              <p className="text-xs text-slate-500">Gross monthly cashflow with toggleable data series.</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={activeRevenueSeries.revenue}
                  onChange={() => setActiveRevenueSeries(p => ({ ...p, revenue: !p.revenue }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500" 
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  Revenue
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={activeRevenueSeries.expenses}
                  onChange={() => setActiveRevenueSeries(p => ({ ...p, expenses: !p.expenses }))}
                  className="rounded text-rose-600 focus:ring-indigo-500" 
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Expenses
                </span>
              </label>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                />
                {activeRevenueSeries.revenue && (
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={3} 
                    name="Revenue"
                  />
                )}
                {activeRevenueSeries.expenses && (
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#f43f5e" 
                    fillOpacity={1} 
                    fill="url(#colorExpenses)" 
                    strokeWidth={3} 
                    name="Expenses"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Assignment Statuses (Pie Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assignments Distribution</h3>
            <p className="text-xs text-slate-500">Submission stats across current semester.</p>
          </div>

          <div className="h-64 flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentData.assignmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {currentData.assignmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} tasks`, 'Status']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {currentData.assignmentData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{item.status}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Section 2 of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 3: Student Growth (Line Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">User Base Growth</h3>
            <p className="text-xs text-slate-500">Growth of students & teachers registered monthly.</p>
          </div>

          <div className="h-80 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData.userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                <Line type="monotone" dataKey="students" name="Students" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="teachers" name="Teachers" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Course Completion Rate (Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Course Completion Rates</h3>
            <p className="text-xs text-slate-500">Average percentage of students finishing active modules.</p>
          </div>

          <div className="h-80 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData.completionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
                <XAxis dataKey="course" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`${value}%`, 'Completion Rate']}
                />
                <Bar dataKey="rate" name="Completion Rate" fill="#10b981" radius={[6, 6, 0, 0]}>
                  {currentData.completionData.map((entry, index) => {
                    const colors = ['#10b981', '#6366f1', '#f59e0b'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Teacher Performance Scoreboard */}
      {currentData.teacherPerformance.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Teacher Performance & Ratings</h3>
            <p className="text-xs text-slate-500">Class management metrics, active students, and student feedback rating.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-xs uppercase">
                  <th className="py-3 px-2">Instructor</th>
                  <th className="py-3 px-2">Courses</th>
                  <th className="py-3 px-2">Students</th>
                  <th className="py-3 px-2">Completion Rate</th>
                  <th className="py-3 px-2 text-right">Avg Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {currentData.teacherPerformance.map((teacher, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-2 font-semibold text-slate-900 dark:text-white">{teacher.name}</td>
                    <td className="py-3 px-2">{teacher.courses}</td>
                    <td className="py-3 px-2">{teacher.students}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${teacher.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{teacher.completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg font-bold text-xs">
                        <Star className="h-3 w-3 fill-amber-500 stroke-amber-500" />
                        {teacher.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
