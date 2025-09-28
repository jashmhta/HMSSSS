 import React, { useState } from 'react';
import { useRouter } from 'next/router';

import { Toaster } from 'react-hot-toast';

import Header from './Header';
import Sidebar from './Sidebar';

interface ILayoutProps {
  children: React.ReactNode;
  userRole?: string;
}

const Layout: React.FC<ILayoutProps> = ({ children, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Don't show layout for auth pages
  if (router.pathname.startsWith('/auth')) {
    return (
      <>
        {children}
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        {...(userRole && { userRole })}
      />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default Layout;
