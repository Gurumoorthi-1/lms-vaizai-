import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ customLinks }) {
  const location = useLocation();
  
  // Split path into segments
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If we are on login, register, or root, don't show breadcrumbs
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
    return null;
  }

  // Use custom links if provided
  const links = customLinks || pathnames.map((value, index) => {
    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
    
    // Humanize common pathnames
    let label = value.charAt(0).toUpperCase() + value.slice(1);
    
    if (value.startsWith('crs-')) {
      label = 'Course Detail';
    } else if (value.startsWith('asg-')) {
      label = 'Assignment';
    } else if (value.startsWith('qz-')) {
      label = 'Quiz';
    }

    return { label, to, isLast: index === pathnames.length - 1 };
  });

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        <li className="inline-flex items-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Home className="mr-2 h-4 w-4 shrink-0" />
            Dashboard
          </Link>
        </li>
        {links.map((link, index) => (
          <li key={index} className="inline-flex items-center">
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mx-1 md:mx-2" />
            {link.isLast ? (
              <span className="text-slate-800 dark:text-slate-200 font-semibold" aria-current="page">
                {link.label}
              </span>
            ) : (
              <Link
                to={link.to}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
