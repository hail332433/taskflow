import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SortableTaskCard from './SortableTaskCard'

export default function KanbanColumn({ column, tasks, onAddTask, onTaskClick }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  const getColumnColor = (type) => {
    switch (type) {
      case 'TODO':
        return 'border-blue-200 bg-blue-50/50'
      case 'DOING':
        return 'border-yellow-200 bg-yellow-50/50'
      case 'DONE':
        return 'border-green-200 bg-green-50/50'
      default:
        return 'border-gray-200 bg-gray-50/50'
    }
  }

  const getHeaderColor = (type) => {
    switch (type) {
      case 'TODO':
        return 'bg-blue-100 text-blue-700'
      case 'DOING':
        return 'bg-yellow-100 text-yellow-700'
      case 'DONE':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className={`flex flex-col w-80 flex-shrink-0 rounded-lg border-2 ${getColumnColor(column.type)} bg-white/80 backdrop-blur-sm`}>
      <div className={`p-4 rounded-t-lg ${getHeaderColor(column.type)}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{column.name}</h3>
          <span className="text-sm font-medium px-2 py-1 rounded-full bg-white/50">
            {tasks.length}
          </span>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[200px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onAddTask}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar tarefa
        </Button>
      </div>
    </div>
  )
}