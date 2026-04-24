'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import KanbanColumn from '@/components/kanban/KanbanColumn'
import TaskCard from '@/components/kanban/TaskCard'
import CreateTaskDialog from '@/components/kanban/CreateTaskDialog'
import TaskDetailsDialog from '@/components/kanban/TaskDetailsDialog'

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.id

  const [board, setBoard] = useState(null)
  const [columns, setColumns] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState(null)
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (boardId) {
      fetchData()
    }
  }, [boardId])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}`)
      const data = await response.json()

      setBoard(data.board)
      setColumns(data.columns)
      setTasks(data.tasks)
    } catch (error) {
      console.error('Error fetching board data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    setActiveTask(task)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    const overColumn = columns.find((c) => c.id === over.id)
    
    if (!activeTask) return

    // Check if dropped on a column
    if (overColumn) {
      if (activeTask.column_id !== overColumn.id) {
        // Move to different column
        await moveTask(activeTask.id, overColumn.id, 0)
      }
      return
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === over.id)
    if (!overTask || activeTask.id === overTask.id) return

    const activeColumnTasks = tasks
      .filter((t) => t.column_id === overTask.column_id)
      .sort((a, b) => a.order - b.order)

    const oldIndex = activeColumnTasks.findIndex((t) => t.id === active.id)
    const newIndex = activeColumnTasks.findIndex((t) => t.id === over.id)

    if (activeTask.column_id === overTask.column_id) {
      // Reorder within same column
      const newTasks = arrayMove(activeColumnTasks, oldIndex, newIndex)
      
      // Update local state immediately
      const updatedTasks = tasks.map((task) => {
        const newTask = newTasks.find((t) => t.id === task.id)
        if (newTask) {
          return { ...task, order: newTasks.indexOf(newTask) }
        }
        return task
      })
      setTasks(updatedTasks)

      // Send to backend
      await moveTask(activeTask.id, overTask.column_id, newIndex)
    } else {
      // Move to different column
      await moveTask(activeTask.id, overTask.column_id, newIndex)
    }
  }

  const moveTask = async (taskId, columnId, order) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: columnId, order })
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error moving task:', error)
    }
  }

  const openCreateDialog = (columnId) => {
    setSelectedColumnId(columnId)
    setCreateDialogOpen(true)
  }

  const openTaskDetails = (task) => {
    setSelectedTask(task)
    setTaskDetailsOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{board?.name}</h1>
            <p className="text-sm text-muted-foreground">{tasks.length} tarefa(s)</p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full p-4 md:p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 h-full pb-4">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={tasks.filter((t) => t.column_id === column.id)}
                  onAddTask={() => openCreateDialog(column.id)}
                  onTaskClick={openTaskDetails}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        columnId={selectedColumnId}
        onTaskCreated={fetchData}
      />
      <TaskDetailsDialog
        open={taskDetailsOpen}
        onOpenChange={setTaskDetailsOpen}
        task={selectedTask}
        onTaskUpdated={fetchData}
        onTaskDeleted={() => {
          setTaskDetailsOpen(false)
          fetchData()
        }}
      />
    </div>
  )
}