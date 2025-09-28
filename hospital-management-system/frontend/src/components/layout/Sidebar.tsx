import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  ViewfinderCircleIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  CogIcon,
  ChartBarIcon,
   UserIcon,
   TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['all'] },
  {
    name: 'Patient Management',
    href: '/patient',
    icon: UserGroupIcon,
    roles: ['admin', 'doctor', 'nurse', 'reception'],
  },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: CalendarIcon,
    roles: ['admin', 'doctor', 'nurse', 'reception', 'patient'],
  },
  {
    name: 'Medical Records',
    href: '/records',
    icon: DocumentTextIcon,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    name: 'Laboratory',
    href: '/lab',
    icon: BeakerIcon,
    roles: ['admin', 'doctor', 'lab'],
  },
  {
    name: 'Radiology',
    href: '/radiology',
    icon: ViewfinderCircleIcon,
    roles: ['admin', 'doctor', 'radiology'],
  },
  {
    name: 'Pharmacy',
    href: '/pharmacy',
    icon: HeartIcon,
    roles: ['admin', 'doctor', 'pharmacy'],
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: CurrencyDollarIcon,
    roles: ['admin', 'billing'],
  },
  {
    name: 'Emergency',
    href: '/emergency',
    icon: ExclamationTriangleIcon,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    name: 'Blood Bank',
    href: '/bloodbank',
    icon: HeartIcon,
    roles: ['admin', 'bloodbank'],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: TruckIcon,
    roles: ['admin', 'inventory'],
  },
  {
    name: 'HR Management',
    href: '/hr',
    icon: UserIcon,
    roles: ['admin', 'hr'],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ChartBarIcon,
    roles: ['admin', 'reports'],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    roles: ['admin', 'analytics'],
  },
  { name: 'Settings', href: '/settings', icon: CogIcon, roles: ['admin'] },
];

// eslint-disable-next-line max-lines-per-function
const Sidebar: React.FC<ISidebarProps> = ({ isOpen, onClose, userRole }) => {
  const router = useRouter();

  const filteredItems = navigationItems.filter(
    (item) => item.roles.includes('all') || item.roles.includes(userRole ?? ''),
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">HMS</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {filteredItems.map((item) => {
              const isActive = router.pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={onClose}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">John Doe</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
