import { Search, Filter, X } from 'lucide-react';
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/lib/constants';

interface BoardFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  priorityFilter: string;
  setPriorityFilter: (p: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (a: string) => void;
}

export function BoardFilterBar({
  searchQuery,
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
}: BoardFilterBarProps) {
  const hasActiveFilters = searchQuery || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('ALL');
    setAssigneeFilter('ALL');
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2 border-b border-border/40 mb-4 bg-muted/20 px-3 rounded-lg">
      
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search on board..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
        >
          <option value="ALL">All Priorities</option>
          {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {/* Members/Assignee Filter (Mock structure) */}
        <select
           value={assigneeFilter}
           onChange={(e) => setAssigneeFilter(e.target.value)}
           className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        >
           <option value="ALL">All Assignees</option>
           <option value="UNASSIGNED">Unassigned</option>
           <option value="ME">Assigned to Me</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex h-9 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
