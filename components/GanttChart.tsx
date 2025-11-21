
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Task, Dependency, ROW_HEIGHT, ProjectSettings } from '../types';
import { addDays, diffDays, getDatesRange, getHolidayForDate, isMakeUpDay } from '../utils';
import { Trash2 } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  dependencies: Dependency[];
  viewStartDate: Date;
  viewEndDate: Date;
  columnWidth: number;
  showCriticalPath: boolean;
  settings: ProjectSettings;
  onTaskUpdate: (task: Task) => void;
  onDependencyDelete: (id: string) => void;
  onDependencyCreate: (sourceId: string, targetId: string) => void;
  onTaskClick: (task: Task) => void;
  criticalTaskIds: Set<string>;
}

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  dependencies,
  viewStartDate,
  viewEndDate,
  columnWidth,
  showCriticalPath,
  settings,
  onTaskUpdate,
  onDependencyDelete,
  onDependencyCreate,
  onTaskClick,
  criticalTaskIds
}) => {
  const [draggingTask, setDraggingTask] = useState<{ id: string, startX: number, originalStart: Date, type: 'move' | 'resize-l' | 'resize-r' } | null>(null);
  const [linkingTask, setLinkingTask] = useState<{ id: string, startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  
  const [selectedDependencyId, setSelectedDependencyId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, depId: string} | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dates = useMemo(() => getDatesRange(viewStartDate, viewEndDate), [viewStartDate, viewEndDate]);
  const totalWidth = dates.length * columnWidth;
  const totalHeight = tasks.length * ROW_HEIGHT + 40; 

  useEffect(() => {
      const handleClick = () => setContextMenu(null);
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
  }, []);

  const getTaskX = (date: Date) => diffDays(date, viewStartDate) * columnWidth;
  const getTaskWidth = (start: Date, end: Date) => Math.max(diffDays(end, start) * columnWidth, columnWidth / 4);

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
            type: action
          });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTask) {
      const dx = e.clientX - draggingTask.startX;
      const daysDiff = Math.round(dx / columnWidth);
      
      const taskIndex = tasks.findIndex(t => t.id === draggingTask.id);
      if (taskIndex === -1) return;
      const task = tasks[taskIndex];

      if (draggingTask.type === 'move') {
        const targetStart = addDays(draggingTask.originalStart, daysDiff);
        const duration = diffDays(task.end, task.start); 
        onTaskUpdate({ ...task, start: targetStart, end: addDays(targetStart, duration) });
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
      if(rect) {
          setContextMenu({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
              depId: depId
          });
      }
      setSelectedDependencyId(depId);
  };

  const renderGrid = () => (
    <g className="grid-lines select-none pointer-events-none">
      {dates.map((d, i) => {
         const dayOfWeek = d.getDay();
         const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
         const isMonthStart = d.getDate() === 1;
         
         const holiday = getHolidayForDate(d, settings.holidays);
         const isMakeUp = isMakeUpDay(d, settings.makeUpDays);
         
         // Prioritize MakeUp > Holiday > Weekend for color logic
         let bgFill = "transparent";
         
         if (isMakeUp) {
             bgFill = "rgba(220, 252, 231, 0.4)"; // Light Green for Make-up days
         } else if (holiday) {
             bgFill = "rgba(254, 243, 199, 0.4)"; // Very subtle Warm/Grayish for Holidays (Not Red)
         } else if (isWeekend && !settings.includeWeekends) {
             bgFill = "rgba(241, 245, 249, 0.6)"; // Light Gray for Weekends
         }
         
         if (columnWidth < 20 && !isMonthStart) return null;

         return (
            <React.Fragment key={i}>
            {/* Background Fill */}
            {bgFill !== "transparent" && (
                <rect x={i * columnWidth} y={0} width={columnWidth} height={totalHeight} fill={bgFill} />
            )}

            {/* Holiday Name Label (Vertical, only if wide enough) */}
            {holiday && !isMakeUp && columnWidth > 30 && (
                <text 
                    x={i * columnWidth + columnWidth/2} 
                    y={20} 
                    className="text-[9px] fill-amber-700 font-medium uppercase opacity-50"
                    transform={`rotate(90, ${i * columnWidth + columnWidth/2}, 20)`}
                    textAnchor="start"
                >
                    {holiday.name}
                </text>
            )}
            
            {/* MakeUp Label */}
            {isMakeUp && columnWidth > 30 && (
                <text 
                    x={i * columnWidth + columnWidth/2} 
                    y={20} 
                    className="text-[9px] fill-green-700 font-medium uppercase opacity-50"
                    transform={`rotate(90, ${i * columnWidth + columnWidth/2}, 20)`}
                    textAnchor="start"
                >
                    Work
                </text>
            )}

            <line
                x1={i * columnWidth}
                y1={0}
                x2={i * columnWidth}
                y2={totalHeight}
                stroke={isMonthStart ? "#cbd5e1" : "#e2e8f0"}
                strokeWidth={1}
                strokeDasharray={!isMonthStart && (isWeekend || holiday) ? "4 2" : ""}
            />
            
            {diffDays(d, new Date()) === 0 && (
                <rect x={i*columnWidth} y={0} width={columnWidth} height={totalHeight} fill="rgba(59, 130, 246, 0.1)" />
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

      const sourceIdx = tasks.findIndex(t => t.id === dep.sourceId);
      const targetIdx = tasks.findIndex(t => t.id === dep.targetId);

      const x1 = getTaskX(source.end) + columnWidth; 
      const y1 = sourceIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
      const x2 = getTaskX(target.start); 
      const y2 = targetIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

      let color = "#94a3b8";
      let width = 1.5;
      const isSelected = selectedDependencyId === dep.id;

      if (showCriticalPath) {
          if (criticalTaskIds.has(source.id) && criticalTaskIds.has(target.id)) {
              color = "#ef4444"; 
              width = 2.5;
          }
      }
      if (isSelected) {
          color = "#3b82f6";
          width = 2.5;
      }

      const path = `M ${x1-columnWidth} ${y1} L ${x1-columnWidth + 10} ${y1} L ${x1-columnWidth + 10} ${y2} L ${x2} ${y2}`;

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
          const barColor = isCritical ? "#ef4444" : (task.color || "#3b82f6");

          return (
            <g key={task.id} 
               onMouseEnter={() => setHoveredTask(task.id)}
               onMouseLeave={() => setHoveredTask(null)}
               onDoubleClick={() => onTaskClick(task)}
            >
                <circle 
                    cx={x + w} cy={y + h/2} r={4} fill="#cbd5e1" 
                    className="hover:fill-blue-600 cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, task, 'link')}
                />
                <rect
                    x={x} y={y} width={w} height={h} rx={4} fill={barColor} filter="url(#shadow)"
                    className="cursor-move transition-colors"
                    onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                    onMouseUp={(e) => handleMouseUp(e, task.id)}
                />
                <rect
                    x={x} y={y + h - 4} width={w * (task.progress / 100)} height={4}
                    fill="rgba(255,255,255,0.4)" rx={2} className="pointer-events-none"
                />
                {columnWidth > 10 && (
                    <text x={x + w + 8} y={y + h/1.5} fontSize="12" fill="#475569" className="select-none font-medium pointer-events-none">
                        {task.name}
                    </text>
                )}
                {hoveredTask === task.id && !draggingTask && !linkingTask && (
                    <g transform={`translate(${x}, ${y - 30})`} className="pointer-events-none z-50">
                        <rect width={160} height={70} rx={4} fill="white" stroke="#e2e8f0" className="shadow-lg" />
                        <text x={10} y={20} fontSize="12" fontWeight="bold" fill="#1e293b">{task.name}</text>
                        <text x={10} y={40} fontSize="10" fill="#64748b">Start: {task.start.toLocaleDateString()}</text>
                        <text x={10} y={55} fontSize="10" fill="#64748b">End: {task.end.toLocaleDateString()}</text>
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
                  <Trash2 size={14} className="mr-2"/> Delete Link
              </button>
          </div>
      )}
    </div>
  );
};

export default GanttChart;
