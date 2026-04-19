'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { LayoutDashboard, ListTodo, CalendarDays, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { ProjectChat } from '@/components/chat/ProjectChat';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;
  const [projectTitle, setProjectTitle] = useState('Loading...');

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/v1/projects/${projectId}`);
        const data = await res.json();
        if (data.success) {
          setProjectTitle(data.data.title);
        }
      } catch (error) {
        setProjectTitle('Project');
      }
    }
    if (projectId) fetchProject();
  }, [projectId]);

  const tabs = [
    { name: 'Board', path: `/projects/${projectId}/board`, icon: LayoutDashboard },
    { name: 'List', path: `/projects/${projectId}/list`, icon: ListTodo },
    { name: 'Timeline', path: `/projects/${projectId}/timeline`, icon: CalendarDays },
    { name: 'Automations', path: `/projects/${projectId}/automations`, icon: Settings },
    { name: 'Settings', path: `/projects/${projectId}/settings`, icon: Settings },
  ];

  return (
    <div className="flex h-full flex-col space-y-4 relative">
      <div className="flex flex-col gap-4 border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">{projectTitle}</h1>
        
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={cn(
                  'relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1">
        {children}
      </div>
      
      <ProjectChat projectId={projectId} />
    </div>
  );
}
