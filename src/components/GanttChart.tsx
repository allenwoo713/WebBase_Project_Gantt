import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Task, Dependency, ROW_HEIGHT, ProjectSettings, Priority, TimeScale } from '../types';
import { addDays, diffDays, diffWeeks, diffMonths, diffYears, getDatesRange, getWeeksRange, getMonthsRange, getYearsRange, getHolidayForDate, isMakeUpDay } from '../utils';
import { Trash2 } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  dependencies: Dependency[];
  viewStartDate: Date;
  viewEndDate: Date;
  columnWidth: number;
  showCriticalPath: boolean;
  settings: ProjectSettings;
  timeScale: TimeScale;
  onTaskUpdate: (task: Task) => void;
  onDependencyDelete: (id: string) => void;
  onDependencyCreate: (sourceId: string, targetId: string) => void;
  onTaskClick: (task: Task) => void;
  criticalTaskIds: Set<string>;
  onScroll: (scrollLeft: number) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  dependencies,
  viewStartDate,
  viewEndDate,
  columnWidth,
  showCriticalPath,
  settings,
  timeScale,
  onTaskUpdate,
  onDependencyDelete,
  onDependencyCreate,
  onTaskClick,
  criticalTaskIds,
  onScroll
}) => {
  const [draggingTask, setDraggingTask] = useState<{ id: string, startX: number, originalStart: Date, originalEnd: Date, type: 'move' | 'resize-l' | 'resize-r' } | null>(null);
  const [linkingTask, setLinkingTask] = useState<{ id: string, startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const [selectedDependencyId, setSelectedDependencyId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, depId: string } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dates = useMemo(() => {
    switch (timeScale) {
      case TimeScale.Day: return getDatesRange(viewStartDate, viewEndDate);
      case TimeScale.Week: return getWeeksRange(viewStartDate, viewEndDate);
      case TimeScale.Month:
      case TimeScale.Quarter:
      case TimeScale.HalfYear: return getMonthsRange(viewStartDate, viewEndDate);
      case TimeScale.Year: return getYearsRange(viewStartDate, viewEndDate);
      default: return getDatesRange(viewStartDate, viewEndDate);
    }
  }, [viewStartDate, viewEndDate, timeScale]);

  const totalWidth = dates.length * columnWidth;
  const totalHeight = tasks.length * ROW_HEIGHT + 40;

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const getTaskX = (date: Date) => {
    switch (timeScale) {
      case TimeScale.Day: return diffDays(date, viewStartDate) * columnWidth;
      case TimeScale.Week: return diffWeeks(date, viewStartDate) * columnWidth;
      case TimeScale.Month:
      case TimeScale.Quarter:
      case TimeScale.HalfYear: return diffMonths(date, viewStartDate) * columnWidth;
      case TimeScale.Year: return diffYears(date, viewStartDate) * columnWidth;
      default: return diffDays(date, viewStartDate) * columnWidth;
    }
  };

  const getTaskWidth = (start: Date, end: Date) => {
    let width = 0;
    switch (timeScale) {
      case TimeScale.Day:
        width = (diffDays(end, start) + 1) * columnWidth;
        break;
      case TimeScale.Week:
        width = (diffWeeks(end, start) + (1 / 7)) * columnWidth;
        break;
      case TimeScale.Month:
      case TimeScale.Quarter:
      case TimeScale.HalfYear:
        // Add small buffer for visibility if start==end
        width = Math.max(diffMonths(end, start), 1 / 30) * columnWidth;
        break;
      case TimeScale.Year:
        width = Math.max(diffYears(end, start), 1 / 365) * columnWidth;
        break;
      default: width = (diffDays(end, start) + 1) * columnWidth;
    }
    return Math.max(width, 2);
  };

  const handleMouseDown = (e: React.MouseEvent, task: Task, action: 'move' | 'resize-l' | 'resize-r' | 'link') => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    if (action === 'link') {
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;
      setLinkingTask({ id: task.id, startX: x, startY: y, currentX: x, currentY: y });
    } else {
      setDraggingTask({
        id: task.id,
        startX: e.clientX,
        originalStart: new Date(task.start),
        originalEnd: new Date(task.end),
        type: action
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTask) {
      const dx = e.clientX - draggingTask.startX;
      // Calculate daysDiff based on timeScale
      let daysDiff = 0;
      switch (timeScale) {
        case TimeScale.Day: daysDiff = Math.round(dx / columnWidth); break;
        case TimeScale.Week: daysDiff = Math.round((dx / columnWidth) * 7); break;
        case TimeScale.Month:
        case TimeScale.Quarter:
        case TimeScale.HalfYear: daysDiff = Math.round((dx / columnWidth) * 30); break; // Approx
        case TimeScale.Year: daysDiff = Math.round((dx / columnWidth) * 365); break; // Approx
        default: daysDiff = Math.round(dx / columnWidth);
      }

      const taskIndex = tasks.findIndex(t => t.id === draggingTask.id);
      if (taskIndex === -1) return;
      const task = tasks[taskIndex];

      if (draggingTask.type === 'move') {
        const targetStart = addDays(draggingTask.originalStart, daysDiff);
        const duration = diffDays(task.end, task.start);
        onTaskUpdate({ ...task, start: targetStart, end: addDays(targetStart, duration) });
      } else if (draggingTask.type === 'resize-r') {
        const newEnd = addDays(draggingTask.originalEnd, daysDiff);
        if (diffDays(newEnd, task.start) >= 0) {
          onTaskUpdate({ ...task, end: newEnd });
        }
      } else if (draggingTask.type === 'resize-l') {
        const newStart = addDays(draggingTask.originalStart, daysDiff);
        if (diffDays(task.end, newStart) >= 0) {
          onTaskUpdate({ ...task, start: newStart });
        }
      }
    }

    if (linkingTask) {
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        setLinkingTask({
          ...linkingTask,
          currentX: e.clientX - svgRect.left,
          currentY: e.clientY - svgRect.top
        });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent, targetTaskId?: string) => {
    if (draggingTask) {
      setDraggingTask(null);
    }
    if (linkingTask) {
      if (targetTaskId && targetTaskId !== linkingTask.id) {
        onDependencyCreate(linkingTask.id, targetTaskId);
      }
      setLinkingTask(null);
    }
  };

  const handleDependencyContextMenu = (e: React.MouseEvent, depId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        depId: depId
      });
    }
    setSelectedDependencyId(depId);
  };

  // Color Logic based on Priority & Critical Path
  const getTaskColor = (task: Task, isCritical: boolean) => {
    if (showCriticalPath && isCritical) return "#ef4444"; // Red for Critical Path

    switch (task.priority) {
      case Priority.High: return "#f97316"; // Orange
      case Priority.Medium: return "#3b82f6"; // Blue (Default)
      case Priority.Low: return "#10b981"; // Green
      default: return "#3b82f6";
    }
  };

  const renderGrid = () => (
    <g className="grid-lines select-none pointer-events-none">
      {dates.map((d, i) => {
        let bgFill = "transparent";

        if (timeScale === TimeScale.Day) {
          const dayOfWeek = d.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const holiday = getHolidayForDate(d, settings.holidays);
          const isMakeUp = isMakeUpDay(d, settings.makeUpDays);

          if (isMakeUp) {
            bgFill = "rgba(220, 252, 231, 0.4)";
          } else if (holiday) {
            bgFill = "rgba(254, 243, 199, 0.4)";
          } else if (isWeekend && !settings.includeWeekends) {
            bgFill = "rgba(241, 245, 249, 0.6)";
          }
        } else {
          // For other views, maybe alternate slightly to distinguish columns?
          if (i % 2 === 0) bgFill = "rgba(248, 250, 252, 0.3)";
        }

        return (
          <React.Fragment key={i}>
            <rect x={i * columnWidth} y={0} width={columnWidth} height={totalHeight} fill={bgFill} />

            {/* Grid Line */}
            <line
              x1={i * columnWidth}
              y1={0}
              x2={i * columnWidth}
              y2={totalHeight}
              stroke="#e2e8f0"
              strokeWidth={1}
            />

            {/* Current Time Indicator (Approximate for non-Day views) */}
            {timeScale === TimeScale.Day && diffDays(d, new Date()) === 0 && (
              <rect x={i * columnWidth} y={0} width={columnWidth} height={totalHeight} fill="rgba(59, 130, 246, 0.1)" />
            )}
          </React.Fragment>
        )
      })}
    </g>
  );

  const renderDependencies = () => {
    if (!settings.showDependencies) return null;

    return dependencies.map(dep => {
      const source = tasks.find(t => t.id === dep.sourceId);
      const target = tasks.find(t => t.id === dep.targetId);
      if (!source || !target) return null;

      const x1 = getTaskX(source.start) + getTaskWidth(source.start, source.end);
      const y1 = tasks.indexOf(source) * ROW_HEIGHT + ROW_HEIGHT / 2;
      const x2 = getTaskX(target.start);
      const y2 = tasks.indexOf(target) * ROW_HEIGHT + ROW_HEIGHT / 2;

      // Path logic
      const path = `M ${x1} ${y1} L ${x1 + 10} ${y1} L ${x1 + 10} ${y2} L ${x2} ${y2}`;
      const color = selectedDependencyId === dep.id ? "#2563eb" : (showCriticalPath ? "#94a3b8" : "#cbd5e1");
      const width = selectedDependencyId === dep.id ? 2 : 1.5;

      return (
        <g
          key={dep.id}
          className="cursor-pointer group"
          onClick={(e) => { e.stopPropagation(); setSelectedDependencyId(dep.id); }}
          onContextMenu={(e) => handleDependencyContextMenu(e, dep.id)}
        >
          <path d={path} fill="none" stroke={color} strokeWidth={width} markerEnd="url(#arrow)" className="group-hover:stroke-blue-500 group-hover:stroke-[3px] transition-all" />
          <path d={path} fill="none" stroke="transparent" strokeWidth={10} />
        </g>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full bg-white"
      onMouseMove={handleMouseMove}
      onMouseUp={(e) => handleMouseUp(e)}
      onClick={() => setSelectedDependencyId(null)}
      onScroll={(e) => onScroll(e.currentTarget.scrollLeft)}
    >
      <svg ref={svgRef} width={totalWidth} height={totalHeight} className="block">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill={showCriticalPath ? "#475569" : "#94a3b8"} />
          </marker>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.2" />
          </filter>
        </defs>
        {renderGrid()}
        {renderDependencies()}
        {tasks.map((task, index) => {
          const x = getTaskX(task.start);
          const w = getTaskWidth(task.start, task.end);
          const y = index * ROW_HEIGHT + 6;
          const h = ROW_HEIGHT - 12;
          const isCritical = showCriticalPath && criticalTaskIds.has(task.id);
          const barColor = getTaskColor(task, isCritical);

          return (
            <g
              key={task.id}
              className="cursor-pointer"
              onMouseDown={(e) => handleMouseDown(e, task, 'move')}
              onMouseEnter={() => setHoveredTask(task.id)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              {/* Task Bar */}
              <rect
                x={x} y={y} width={w} height={h} rx={4}
                fill={barColor}
                filter={hoveredTask === task.id ? "url(#shadow)" : ""}
                className="transition-all duration-200"
              />

              {/* Drag Handles */}
              <rect
                x={x} y={y} width={6} height={h}
                fill="transparent"
                className="cursor-ew-resize"
                onMouseDown={(e) => handleMouseDown(e, task, 'resize-l')}
              />
              <rect
                x={x + w - 6} y={y} width={6} height={h}
                fill="transparent"
                className="cursor-ew-resize"
                onMouseDown={(e) => handleMouseDown(e, task, 'resize-r')}
              />

              {/* Progress Bar */}
              <rect
                x={x} y={y + h - 4} width={w * (task.progress / 100)} height={4}
                fill="rgba(255,255,255,0.4)" rx={2} className="pointer-events-none"
              />
              {/* Task Label (Beside Bar) */}
              {columnWidth > 10 && (
                <text x={x + w + 8} y={y + h / 1.5} fontSize="12" fill="#475569" className="select-none font-medium pointer-events-none">
                  {task.name}
                </text>
              )}

              {/* Tooltip - Moved UP and added pointer-events-none to prevent blocking drag */}
              {hoveredTask === task.id && !draggingTask && !linkingTask && (
                <g transform={`translate(${x}, ${y - 60})`} className="pointer-events-none z-50">
                  <rect width={180} height={55} rx={6} fill="rgba(30, 41, 59, 0.9)" className="shadow-xl" />
                  <text x={10} y={20} fontSize="12" fontWeight="bold" fill="white">{task.name}</text>
                  <text x={10} y={38} fontSize="10" fill="#cbd5e1">
                    {task.start.toLocaleDateString()} - {task.end.toLocaleDateString()} ({task.priority})
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {linkingTask && (
          <line
            x1={linkingTask.startX} y1={linkingTask.startY} x2={linkingTask.currentX} y2={linkingTask.currentY}
            stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 5"
          />
        )}
      </svg>
      {contextMenu && (
        <div
          className="absolute bg-white border border-gray-200 shadow-lg rounded-lg py-1 z-50 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => { onDependencyDelete(contextMenu.depId); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
          >
            <Trash2 size={14} className="mr-2" /> Delete Link
          </button>
        </div>
      )}
    </div>
  );
};

export default GanttChart;