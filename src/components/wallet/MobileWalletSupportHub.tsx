'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  BarChart3,
  Heart,
  MessageCircle,
  Book,
  Settings,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import MobileWalletFAQ from './MobileWalletFAQ';
import MobileWalletPerformanceMonitor from './MobileWalletPerformanceMonitor';
import MobileWalletConnectionHealthCheck from './MobileWalletConnectionHealthCheck';
import MobileWalletConnectionRecovery from './MobileWalletConnectionRecovery';
import MobileWalletTutorial from './MobileWalletTutorial';
import MobileWalletHelp from './MobileWalletHelp';

type SupportSection =
  | 'faq'
  | 'tutorial'
  | 'help'
  | 'recovery'
  | 'performance'
  | 'health'
  | 'settings';

interface SupportOption {
  id: SupportSection;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  category: 'help' | 'diagnostics' | 'monitoring';
}

const SUPPORT_OPTIONS: SupportOption[] = [
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about mobile wallet connections',
    icon: <HelpCircle className="w-5 h-5" />,
    component: MobileWalletFAQ,
    category: 'help'
  },
  {
    id: 'tutorial',
    title: 'Interactive Tutorial',
    description: 'Step-by-step guide to connecting your mobile wallet',
    icon: <Book className="w-5 h-5" />,
    component: MobileWalletTutorial,
    category: 'help'
  },
  {
    id: 'help',
    title: 'Setup & Troubleshooting',
    description: 'Get help with wallet setup and resolve connection issues',
    icon: <MessageCircle className="w-5 h-5" />,
    component: MobileWalletHelp,
    category: 'help'
  },
  {
    id: 'recovery',
    title: 'Connection Recovery',
    description: 'Automated tools to diagnose and fix connection problems',
    icon: <Settings className="w-5 h-5" />,
    component: MobileWalletConnectionRecovery,
    category: 'diagnostics'
  },
  {
    id: 'performance',
    title: 'Performance Monitor',
    description: 'View connection performance metrics and analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    component: MobileWalletPerformanceMonitor,
    category: 'monitoring'
  },
  {
    id: 'health',
    title: 'Health Check',
    description: 'Run comprehensive system health diagnostics',
    icon: <Heart className="w-5 h-5" />,
    component: MobileWalletConnectionHealthCheck,
    category: 'monitoring'
  }
];

const CATEGORY_CONFIG = {
  help: {
    title: 'Help & Support',
    description: 'Guides, tutorials, and troubleshooting assistance',
    color: 'bg-blue-50 border-blue-200 text-blue-900'
  },
  diagnostics: {
    title: 'Diagnostics & Recovery',
    description: 'Tools to diagnose and fix connection issues',
    color: 'bg-orange-50 border-orange-200 text-orange-900'
  },
  monitoring: {
    title: 'Monitoring & Analytics',
    description: 'Performance metrics and system health monitoring',
    color: 'bg-green-50 border-green-200 text-green-900'
  }
};

export default function MobileWalletSupportHub() {
  const [activeSection, setActiveSection] = useState<SupportSection | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | SupportOption['category']>('all');

  const filteredOptions = selectedCategory === 'all'
    ? SUPPORT_OPTIONS
    : SUPPORT_OPTIONS.filter(option => option.category === selectedCategory);

  const groupedOptions = filteredOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, SupportOption[]>);

  const ActiveComponent = activeSection
    ? SUPPORT_OPTIONS.find(option => option.id === activeSection)?.component
    : null;

  if (ActiveComponent) {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Support Hub
          </button>
        </div>
        <ActiveComponent />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Mobile Wallet Support Hub</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Get help with mobile wallet connections, troubleshoot issues, monitor performance,
          and access comprehensive support resources.
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as SupportOption['category'])}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white'
                  : `${config.color.split(' ')[0]} text-gray-700 hover:opacity-80`
              }`}
            >
              {config.title}
            </button>
          ))}
        </div>
      </div>

      {/* Support Sections */}
      <div className="space-y-8">
        {Object.entries(groupedOptions).map(([category, options]) => {
          const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];

          return (
            <div key={category}>
              <div className={`p-4 rounded-lg border mb-4 ${config.color}`}>
                <h3 className="font-medium text-lg">{config.title}</h3>
                <p className="text-sm opacity-90">{config.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setActiveSection(option.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                          {option.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{option.title}</h4>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{option.description}</p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSection(option.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      Open {option.title}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveSection('recovery')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            🔧 Fix Connection Issues
          </button>
          <button
            onClick={() => setActiveSection('tutorial')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            📚 Start Tutorial
          </button>
          <button
            onClick={() => setActiveSection('health')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            ❤️ Run Health Check
          </button>
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Need More Help?</h4>
            <p className="text-sm text-blue-800 mb-2">
              Can't find what you're looking for? Our support team is here to help with any mobile wallet issues.
            </p>
            <div className="flex gap-3">
              <a
                href="https://discord.gg/passportx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
              >
                Join Discord Community
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="mailto:support@passportx.app"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}