'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Plus, X, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { TASK_STATUS_LABELS } from '@/lib/constants';

interface Rule {
  id: string;
  name: string;
  trigger: string;
  condition: any;
  action: string;
  actionData: any;
  isActive: boolean;
}

export default function AutomationsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Rule Builder Form
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('STATUS_CHANGED');
  const [targetStatus, setTargetStatus] = useState('DONE');
  const [action, setAction] = useState('AUTO_ASSIGN');
  const [assigneeId, setAssigneeId] = useState('');
  
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchInit() {
      setIsLoading(true);
      try {
        const [rulesRes, projectRes] = await Promise.all([
          fetch(`/api/v1/projects/${projectId}/automations`),
          fetch(`/api/v1/projects/${projectId}`),
        ]);
        const rs = await rulesRes.json();
        const ps = await projectRes.json();
        
        if (rs.success) setRules(rs.data);
        if (ps.success) setMembers(ps.data.members || []);
      } catch (error) {
        toast.error('Failed to load automations');
      } finally {
        setIsLoading(false);
      }
    }
    if (projectId) fetchInit();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    if (action === 'AUTO_ASSIGN' && !assigneeId) return toast.error('Select an assignee');

    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          trigger,
          condition: { targetStatus },
          action,
          actionData: { assigneeId }
        })
      });
      const data = await res.json();
      if (data.success) {
        setRules([...rules, data.data]);
        toast.success('Automation rule created');
        setIsCreating(false);
        setName('');
      } else {
        toast.error(data.message || 'Error creating rule');
      }
    } catch {
      toast.error('Failed to create rule');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Workflow Automations</h2>
            <p className="text-sm text-muted-foreground">Automate repetitive tasks to save time</p>
          </div>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Create Rule
          </button>
        )}
      </div>

      {isCreating && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 relative"
        >
          <button 
            type="button" 
            onClick={() => setIsCreating(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          
          <h3 className="font-semibold text-foreground mb-4">Rule Builder</h3>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Rule Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Assign QA when Done"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
            {/* WHEN */}
            <div className="flex-1 space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">When</span>
              <select 
                value={trigger} 
                onChange={e => setTrigger(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="STATUS_CHANGED">Task status changes to...</option>
              </select>
              
              {trigger === 'STATUS_CHANGED' && (
                <select 
                  value={targetStatus} 
                  onChange={e => setTargetStatus(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              )}
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground mt-6" />

            {/* THEN */}
            <div className="flex-1 space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Then</span>
              <select 
                value={action} 
                onChange={e => setAction(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="AUTO_ASSIGN">Assign task to...</option>
              </select>
              
              {action === 'AUTO_ASSIGN' && (
                <select 
                  value={assigneeId} 
                  onChange={e => setAssigneeId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                >
                  <option value="">Select teammate</option>
                  {members.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex justify-center rounded-lg bg-primary mt-2 px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Rule'}
          </button>
        </motion.form>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {isLoading && !isCreating ? (
          Array.from({length: 2}).map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)
        ) : rules.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            No automations configured. Create one to save time!
          </div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{rule.name}</h4>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">
                      WHEN STATUS IS {TASK_STATUS_LABELS[rule.condition?.targetStatus] || rule.condition?.targetStatus}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">
                      {rule.action.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                <span className="text-xs font-medium text-muted-foreground mr-2">Active</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
