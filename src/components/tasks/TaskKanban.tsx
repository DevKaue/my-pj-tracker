import { useMemo, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent,
    closestCenter,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaskKanbanProps {
    tasks: Task[];
    projects: { id: string; name: string }[];
    onStatusChange: (taskId: string, newStatus: Task['status']) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
}

const COLUMNS: { id: Task['status']; title: string; color: string }[] = [
    { id: 'pending', title: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500' },
    { id: 'in_progress', title: 'Em Andamento', color: 'bg-blue-500/10 text-blue-500' },
    { id: 'completed', title: 'Concluída', color: 'bg-green-500/10 text-green-500' },
    { id: 'late', title: 'Atrasada', color: 'bg-red-500/10 text-red-500' },
];

export function TaskKanban({ tasks, projects, onStatusChange, onEdit }: TaskKanbanProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const tasksByStatus = useMemo(() => {
        const acc = {
            pending: [] as Task[],
            in_progress: [] as Task[],
            completed: [] as Task[],
            late: [] as Task[],
        };
        tasks.forEach((task) => {
            if (acc[task.status]) {
                acc[task.status].push(task);
            } else {
                // Fallback for unknown status
                acc['pending'].push(task);
            }
        });
        return acc;
    }, [tasks]);

    const getProjectName = (id: string) => projects.find((p) => p.id === id)?.name || '...';

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            // over.id is the column id
            const newStatus = over.id as Task['status'];
            const taskId = active.id as string;
            onStatusChange(taskId, newStatus);
        }
    };

    const activeTask = useMemo(
        () => tasks.find((t) => t.id === activeId),
        [activeId, tasks]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col md:flex-row gap-4 h-full overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        color={col.color}
                        tasks={tasksByStatus[col.id]}
                        getProjectName={getProjectName}
                        onEdit={onEdit}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <TaskCard
                        task={activeTask}
                        projectName={getProjectName(activeTask.projectId)}
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function KanbanColumn({
    id,
    title,
    color,
    tasks,
    getProjectName,
    onEdit,
}: {
    id: string;
    title: string;
    color: string;
    tasks: Task[];
    getProjectName: (id: string) => string;
    onEdit: (task: Task) => void;
}) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex-1 min-w-[280px] flex flex-col rounded-lg bg-muted/50 border border-border h-fit">
            <div className={cn("p-3 font-semibold text-sm flex items-center justify-between border-b border-border bg-card rounded-t-lg", color)}>
                {title}
                <Badge variant="secondary" className="ml-2 text-xs">
                    {tasks.length}
                </Badge>
            </div>
            <div ref={setNodeRef} className="p-2 space-y-2 min-h-[150px]">
                {tasks.map((task) => (
                    <DraggableTaskCard
                        key={task.id}
                        task={task}
                        projectName={getProjectName(task.projectId)}
                        onEdit={onEdit}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic py-4">
                        Arraste tarefas aqui
                    </div>
                )}
            </div>
        </div>
    );
}

function DraggableTaskCard({
    task,
    projectName,
    onEdit,
}: {
    task: Task;
    projectName: string;
    onEdit: (task: Task) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn("touch-none", isDragging && "opacity-50")}
            onClick={() => onEdit(task)}
        >
            <TaskCard task={task} projectName={projectName} />
        </div>
    );
}

function TaskCard({
    task,
    projectName,
    isOverlay,
}: {
    task: Task;
    projectName: string;
    isOverlay?: boolean;
}) {
    return (
        <div
            className={cn(
                "bg-card p-3 rounded-md border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors pointer-events-auto",
                isOverlay && "shadow-lg rotate-2 scale-105 cursor-grabbing border-primary"
            )}
        >
            <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                    {projectName}
                </span>
                {isOverlay && <GripVertical className="h-4 w-4 text-muted-foreground" />}
            </div>
            <p className="font-semibold text-sm mb-1 line-clamp-2 leading-tight">
                {task.title}
            </p>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.hours}h
                </span>
                <span>{format(new Date(task.date), 'dd/MMM', { locale: ptBR })}</span>
            </div>
        </div>
    );
}
