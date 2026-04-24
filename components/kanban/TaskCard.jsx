import { Calendar, AlertCircle, User, Clock } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function TaskCard({ task, onClick, isDragging }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'URGENT':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'LOW': return 'Baixa'
      case 'MEDIUM': return 'Média'
      case 'HIGH': return 'Alta'
      case 'URGENT': return 'Urgente'
      default: return priority
    }
  }

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.progress < 100

  return (
    <div
      className={`p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move ${
        isDragging ? 'shadow-lg rotate-2' : ''
      } ${isOverdue ? 'border-red-300' : 'border-gray-200'}`}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.due_date && (
            <div className={`flex items-center gap-1 ${
              isOverdue ? 'text-red-600 font-medium' : ''
            }`}>
              {isOverdue && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), 'dd/MM', { locale: ptBR })}
            </div>
          )}
          
          {task.progress > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.progress}%
            </div>
          )}

          {task.assigned_to && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="text-xs">Atribuído</span>
            </div>
          )}
        </div>

        {task.progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}