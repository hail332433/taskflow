'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'
import { format, isSameDay, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CalendarPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState(null)

  useEffect(() => {
    fetchWorkspaceAndTasks()
  }, [])

  const fetchWorkspaceAndTasks = async () => {
    try {
      // Get first workspace
      const workspaceRes = await fetch('/api/workspaces')
      const workspaces = await workspaceRes.json()
      
      if (workspaces.length > 0) {
        const wsId = workspaces[0].id
        setWorkspaceId(wsId)
        
        // Get calendar tasks
        const tasksRes = await fetch(`/api/workspaces/${wsId}/calendar`)
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'bg-blue-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'HIGH': return 'bg-orange-500'
      case 'URGENT': return 'bg-red-500'
      default: return 'bg-gray-500'
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

  const tasksForSelectedDate = tasks.filter(task => 
    task.due_date && isSameDay(new Date(task.due_date), selectedDate)
  )

  const datesWithTasks = tasks.map(task => new Date(task.due_date))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Calendário</h1>
        <p className="text-muted-foreground mt-1">Visualize suas tarefas por data</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Selecione uma Data
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-md border"
              modifiers={{
                hasTask: datesWithTasks
              }}
              modifiersStyles={{
                hasTask: { fontWeight: 'bold', textDecoration: 'underline' }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {tasksForSelectedDate.length} tarefa(s) nesta data
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {tasksForSelectedDate.length > 0 ? (
                <div className="space-y-3">
                  {tasksForSelectedDate.map((task) => {
                    const isOverdue = isPast(new Date(task.due_date)) && task.progress < 100
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border ${
                          isOverdue ? 'border-red-300 bg-red-50' : 'bg-card'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium flex-1">{task.title}</h4>
                          {isOverdue && (
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                          <Badge variant="outline">
                            {task.progress}% concluído
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive">Atrasada</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa agendada para esta data
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Tarefas com Prazo</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {tasks.length > 0 ? (
                tasks.map((task) => {
                  const isOverdue = isPast(new Date(task.due_date)) && task.progress < 100
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isOverdue ? 'border-red-300 bg-red-50' : 'bg-card'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(task.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority) + ' text-white'}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma tarefa com prazo definido
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}