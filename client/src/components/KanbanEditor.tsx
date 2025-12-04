"use client";

import React, { useState, useEffect, useRef } from "react";
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent, useDroppable } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, X, Edit2, Calendar, Tag as TagIcon, AlertCircle, User, Search, Filter, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface KanbanEditorProps {
  content: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate: string;
  assignedTo: string;
  taskNumber: string; // Custom editable task number
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
  collapsed?: boolean;
}

interface KanbanData {
  columns: Column[];
  tasks: Record<string, Task>;
}

const defaultKanbanData: KanbanData = {
  columns: [
    { id: 'todo', title: 'To Do', taskIds: [] },
    { id: 'in-progress', title: 'In Progress', taskIds: [] },
    { id: 'review', title: 'Review', taskIds: [] },
    { id: 'done', title: 'Done', taskIds: [] },
  ],
  tasks: {}
};

const PRIORITY_COLORS = {
  low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
};

export default function KanbanEditor({ content, onChange, readOnly }: KanbanEditorProps) {
  const [data, setData] = useState<KanbanData>(() => {
    try {
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        return parsed.columns && parsed.tasks ? parsed : defaultKanbanData;
      }
      return defaultKanbanData;
    } catch {
      return defaultKanbanData;
    }
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const initialLoadRef = useRef(true);

  // Save changes whenever data updates
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    
    const timeoutId = setTimeout(() => {
      onChange(JSON.stringify(data, null, 2));
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [data, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get all unique tags
  const allTags = Array.from(new Set(Object.values(data.tasks).flatMap(task => task.tags)));

  // Filter tasks
  const filterTasks = (taskIds: string[]) => {
    return taskIds.filter(taskId => {
      const task = data.tasks[taskId];
      if (!task) return false;

      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }

      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }

      // Tag filter
      if (filterTag !== 'all' && !task.tags.includes(filterTag)) {
        return false;
      }

      return true;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    setActiveId(taskId);
    setActiveTask(data.tasks[taskId] || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find source and destination columns
    const activeColumn = data.columns.find(col => col.taskIds.includes(activeId));
    const overColumn = data.columns.find(col => col.id === overId || col.taskIds.includes(overId));

    if (!activeColumn || !overColumn) return;

    // Only handle cross-column moves in dragOver
    if (activeColumn.id !== overColumn.id) {
      setData(prev => {
        const newColumns = prev.columns.map(col => {
          if (col.id === activeColumn.id) {
            return { ...col, taskIds: col.taskIds.filter(id => id !== activeId) };
          }
          if (col.id === overColumn.id) {
            const newTaskIds = [...col.taskIds];
            // If dropping on the column itself, add to end
            if (overId === overColumn.id) {
              newTaskIds.push(activeId);
            } else {
              // Insert before the task we're hovering over
              const overIndex = newTaskIds.indexOf(overId);
              newTaskIds.splice(overIndex, 0, activeId);
            }
            return { ...col, taskIds: newTaskIds };
          }
          return col;
        });

        return { ...prev, columns: newColumns };
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveTask(null);
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = data.columns.find(col => col.taskIds.includes(activeId));
    const overColumn = data.columns.find(col => col.id === overId || col.taskIds.includes(overId));

    // Handle reordering within same column
    if (activeColumn && overColumn && activeColumn.id === overColumn.id) {
      const oldIndex = activeColumn.taskIds.indexOf(activeId);
      const newIndex = activeColumn.taskIds.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setData(prev => {
          const newColumns = prev.columns.map(col => {
            if (col.id === activeColumn.id) {
              return { ...col, taskIds: arrayMove(col.taskIds, oldIndex, newIndex) };
            }
            return col;
          });
          return { ...prev, columns: newColumns };
        });
      }
    }
  };

  const addTask = (columnId: string) => {
    const newTaskId = `task-${Date.now()}`;
    const taskCount = Object.keys(data.tasks).length + 1;
    const newTask: Task = {
      id: newTaskId,
      title: 'New Task',
      description: '',
      priority: 'medium',
      tags: [],
      dueDate: '',
      assignedTo: '',
      taskNumber: String(taskCount).padStart(3, '0'), // Sequential number like 001, 002, etc.
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setData(prev => ({
      tasks: { ...prev.tasks, [newTaskId]: newTask },
      columns: prev.columns.map(col =>
        col.id === columnId ? { ...col, taskIds: [...col.taskIds, newTaskId] } : col
      ),
    }));

    setEditingTask(newTask);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: {
          ...prev.tasks[taskId],
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const deleteTask = (taskId: string) => {
    setData(prev => {
      const newTasks = { ...prev.tasks };
      delete newTasks[taskId];
      
      return {
        tasks: newTasks,
        columns: prev.columns.map(col => ({
          ...col,
          taskIds: col.taskIds.filter(id => id !== taskId),
        })),
      };
    });
    
    if (editingTask?.id === taskId) {
      setEditingTask(null);
    }
  };

  const moveTaskToColumn = (taskId: string, targetColumnId: string) => {
    setData(prev => {
      const sourceColumn = prev.columns.find(col => col.taskIds.includes(taskId));
      if (!sourceColumn || sourceColumn.id === targetColumnId) return prev;

      return {
        ...prev,
        columns: prev.columns.map(col => {
          if (col.id === sourceColumn.id) {
            return { ...col, taskIds: col.taskIds.filter(id => id !== taskId) };
          }
          if (col.id === targetColumnId) {
            return { ...col, taskIds: [...col.taskIds, taskId] };
          }
          return col;
        }),
      };
    });
  };

  const toggleColumnCollapse = (columnId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId ? { ...col, collapsed: !col.collapsed } : col
      ),
    }));
  };

  const addColumn = () => {
    const newColumnId = `col-${Date.now()}`;
    const newColumn: Column = {
      id: newColumnId,
      title: 'New Column',
      taskIds: [],
    };

    setData(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn],
    }));
  };

  const updateColumnTitle = (columnId: string, title: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId ? { ...col, title } : col
      ),
    }));
  };

  const deleteColumn = (columnId: string) => {
    setData(prev => {
      const column = prev.columns.find(col => col.id === columnId);
      if (!column) return prev;

      const newTasks = { ...prev.tasks };
      column.taskIds.forEach(taskId => {
        delete newTasks[taskId];
      });

      return {
        tasks: newTasks,
        columns: prev.columns.filter(col => col.id !== columnId),
      };
    });
  };

  return (
    <div className="h-full w-full bg-[#f4f5f7] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Board</h2>
            <div className="flex items-center gap-2">
              <Search className="text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 text-gray-800 px-3 py-1.5 rounded border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48 transition-all duration-200 focus:w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-all duration-200 text-sm hover:scale-105 active:scale-95"
            >
              <Filter size={16} />
              Filters
            </button>
            {!readOnly && (
              <button
                onClick={addColumn}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                <Plus size={16} />
                Create
              </button>
            )}
          </div>
        </div>

        {/* Filter Options */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3 transform transition-all duration-300">
            <div className="animate-in slide-in-from-left duration-300">
              <label className="text-gray-600 text-xs mb-1 block font-medium">PRIORITY</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full bg-white text-gray-800 px-2 py-1.5 rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all duration-200 hover:border-blue-400"
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="animate-in slide-in-from-right duration-300">
              <label className="text-gray-600 text-xs mb-1 block font-medium">TAG</label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full bg-white text-gray-800 px-2 py-1.5 rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all duration-200 hover:border-blue-400"
              >
                <option value="all">All</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full pb-4">
            {data.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={filterTasks(column.taskIds).map(id => data.tasks[id]).filter(Boolean)}
                allColumns={data.columns}
                readOnly={readOnly}
                onAddTask={() => addTask(column.id)}
                onEditTask={setEditingTask}
                onMoveTask={moveTaskToColumn}
                onToggleCollapse={() => toggleColumnCollapse(column.id)}
                onUpdateTitle={(title) => updateColumnTitle(column.id, title)}
                onDeleteColumn={() => deleteColumn(column.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdate={(updates) => updateTask(editingTask.id, updates)}
          onDelete={() => deleteTask(editingTask.id)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  column,
  tasks,
  allColumns,
  readOnly,
  onAddTask,
  onEditTask,
  onMoveTask,
  onToggleCollapse,
  onUpdateTitle,
  onDeleteColumn,
}: {
  column: Column;
  tasks: Task[];
  allColumns: Column[];
  readOnly?: boolean;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onMoveTask: (taskId: string, columnId: string) => void;
  onToggleCollapse: () => void;
  onUpdateTitle: (title: string) => void;
  onDeleteColumn: () => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="w-72 flex-shrink-0 flex flex-col bg-[#ebecf0] rounded max-h-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between group">
        <div className="flex items-center gap-2 flex-1">
          {isEditingTitle && !readOnly ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              className="flex-1 bg-white text-gray-800 px-2 py-1 rounded border border-blue-500 focus:outline-none text-sm font-semibold"
              autoFocus
            />
          ) : (
            <h3
              className="font-semibold text-gray-700 text-xs uppercase cursor-pointer hover:text-gray-900 transition-all duration-200 hover:scale-105 tracking-wide"
              onClick={() => !readOnly && setIsEditingTitle(true)}
            >
              {column.title}
            </h3>
          )}
          <span className="text-xs text-gray-600 font-medium transition-all duration-200 group-hover:scale-110 group-hover:font-bold">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {!readOnly && (
            <>
              <button
                onClick={onToggleCollapse}
                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-300/50 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <div className={`transition-transform duration-300 ${column.collapsed ? 'rotate-0' : 'rotate-180'}`}>
                  <ChevronDown size={16} />
                </div>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-300/50 transition-all duration-200 hover:scale-110 hover:rotate-90 active:scale-95"
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {/* Dropdown Menu */}
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10 animate-in fade-in duration-100" 
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] animate-in slide-in-from-top duration-200">
                      <button
                        onClick={() => {
                          setIsEditingTitle(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors duration-150"
                      >
                        <Edit2 size={14} />
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          onAddTask();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors duration-150"
                      >
                        <Plus size={14} />
                        Add Task
                      </button>
                      <button
                        onClick={() => {
                          onToggleCollapse();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors duration-150"
                      >
                        {column.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        {column.collapsed ? 'Expand' : 'Collapse'}
                      </button>
                      <div className="border-t border-gray-200 my-1" />
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors duration-150"
                      >
                        <Trash2 size={14} />
                        Delete Column
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Column</h3>
            <p className="text-gray-600 mb-6">
              Delete <span className="font-semibold">"{column.title}"</span> column and all its tasks? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-150 hover:scale-105 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteColumn();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-150 hover:scale-105 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks */}
      {!column.collapsed && (
        <>
          <div ref={setNodeRef} className="flex-1 px-2 pb-2 overflow-y-auto space-y-2 min-h-[100px] animate-in slide-in-from-top duration-200">
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task, index) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  currentColumnId={column.id}
                  availableColumns={allColumns.filter(col => col.id !== column.id)}
                  onEdit={() => onEditTask(task)}
                  onMoveTask={onMoveTask}
                  readOnly={readOnly}
                />
              ))}
            </SortableContext>
          </div>

          {!readOnly && (
            <div className="px-2 pb-2">
              <button
                onClick={onAddTask}
                className="w-full py-2 flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-300/50 rounded transition-all duration-200 text-sm hover:scale-[1.02] active:scale-95"
              >
                <Plus size={16} />
                Create issue
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Sortable Task Component
function SortableTask({
  task,
  currentColumnId,
  availableColumns,
  onEdit,
  onMoveTask,
  readOnly,
}: {
  task: Task;
  currentColumnId: string;
  availableColumns: Column[];
  onEdit: () => void;
  onMoveTask: (taskId: string, columnId: string) => void;
  readOnly?: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-gray-100 p-3 rounded border border-gray-300 border-dashed opacity-50 h-[100px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div {...attributes} {...listeners} className="cursor-move">
        <TaskCard task={task} />
      </div>
      
      {/* Quick Action Buttons */}
      {showActions && !readOnly && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 bg-white rounded shadow-lg border border-gray-200 p-1 animate-in slide-in-from-right duration-200">
          <button
            onClick={onEdit}
            className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150 hover:scale-105 text-left"
          >
            ✏️ Edit
          </button>
          {availableColumns.map(col => (
            <button
              key={col.id}
              onClick={() => onMoveTask(task.id, col.id)}
              className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap text-left"
            >
              → {col.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const priorityStyle = PRIORITY_COLORS[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className={`bg-white p-3 rounded border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${isDragging ? 'shadow-lg rotate-2 scale-105' : 'shadow-sm'}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-gray-800 font-normal text-sm line-clamp-2 flex-1">{task.title}</h4>
        {task.assignedTo && (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold ml-2 flex-shrink-0">
            {task.assignedTo.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map(tag => (
            <span
              key={tag}
              className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
        {/* ID Badge */}
        <span className="flex items-center gap-1 text-gray-500">
          <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">
            ✓
          </div>
          <span className="font-medium">NOTE-{task.taskNumber || '000'}</span>
        </span>

        {/* Priority */}
        {task.priority === 'high' && (
          <span className="flex items-center gap-0.5">
            <AlertCircle size={12} className="text-red-500" />
          </span>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-red-600' : ''}`}>
            <Calendar size={12} />
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}

// Task Modal Component
function TaskModal({
  task,
  onClose,
  onUpdate,
  onDelete,
  readOnly,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  readOnly?: boolean;
}) {
  const [formData, setFormData] = useState(task);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    onUpdate(formData);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 px-4 overflow-y-auto animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mb-16 animate-in zoom-in-95 slide-in-from-top duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-semibold text-gray-800">NOTE-</span>
              {readOnly ? (
                <h3 className="text-lg font-semibold text-gray-800">{formData.taskNumber || '000'}</h3>
              ) : (
                <input
                  type="text"
                  value={formData.taskNumber || '000'}
                  onChange={(e) => setFormData(prev => ({ ...prev, taskNumber: e.target.value }))}
                  className="text-lg font-semibold text-gray-800 border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none px-1 py-0 bg-transparent w-24"
                  placeholder="123"
                />
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={readOnly}
              placeholder="Issue title"
              className="w-full text-2xl font-semibold text-gray-800 border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none px-0 py-2 disabled:opacity-50 bg-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Main Content - Left Side */}
            <div className="col-span-2 space-y-6">
              {/* Description */}
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-2 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={readOnly}
                  rows={6}
                  placeholder="Add a description..."
                  className="w-full bg-gray-50 text-gray-800 px-4 py-3 rounded border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium"
                    >
                      {tag}
                      {!readOnly && (
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {!readOnly && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add a tag..."
                      className="flex-1 bg-gray-50 text-gray-800 px-3 py-2 rounded border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Details - Right Side */}
            <div className="space-y-5">
              <div>
                <label className="text-gray-600 text-xs font-semibold mb-2 block uppercase">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                  disabled={readOnly}
                  className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 text-sm"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>

              <div>
                <label className="text-gray-600 text-xs font-semibold mb-2 block uppercase">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  disabled={readOnly}
                  className="w-full bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 text-sm"
                />
              </div>

              <div>
                <label className="text-gray-600 text-xs font-semibold mb-2 block uppercase">Assignee</label>
                <div className="flex items-center gap-2">
                  {formData.assignedTo && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                      {formData.assignedTo.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    disabled={readOnly}
                    placeholder="Unassigned"
                    className="flex-1 bg-white text-gray-800 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 text-sm"
                  />
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <div className="text-xs text-gray-500">
                  <span className="font-semibold">Created:</span>
                  <div className="mt-0.5">{new Date(formData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-semibold">Updated:</span>
                  <div className="mt-0.5">{new Date(formData.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {!readOnly && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between rounded-b-lg">
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
            >
              Delete
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
