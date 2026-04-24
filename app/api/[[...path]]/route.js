import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Workspace from '@/lib/models/Workspace'
import Project from '@/lib/models/Project'
import Board from '@/lib/models/Board'
import Column from '@/lib/models/Column'
import Task from '@/lib/models/Task'
import Subtask from '@/lib/models/Subtask'
import Comment from '@/lib/models/Comment'
import ActivityLog from '@/lib/models/ActivityLog'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Helper to get session
async function getSession(request) {
  try {
    const session = await getServerSession()
    return session
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

// Helper to log activity
async function logActivity(entity, entity_id, action, user_id, workspace_id, metadata = {}) {
  try {
    await ActivityLog.create({
      id: uuidv4(),
      entity,
      entity_id,
      action,
      user_id,
      workspace_id,
      metadata,
      created_at: new Date()
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    await connectDB()

    // ============ PUBLIC ROUTES ============

    // Register - POST /api/register (moved from /api/auth/register to avoid NextAuth conflict)
    if (route === '/register' && method === 'POST') {
      const body = await request.json()
      const { name, email, password } = body

      if (!name || !email || !password) {
        return handleCORS(NextResponse.json(
          { error: 'Todos os campos são obrigatórios' },
          { status: 400 }
        ))
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return handleCORS(NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        ))
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10)

      // Create user
      const user = await User.create({
        id: uuidv4(),
        name,
        email: email.toLowerCase(),
        password_hash,
        role: 'OWNER',
        created_at: new Date()
      })

      // Create default workspace
      const workspace = await Workspace.create({
        id: uuidv4(),
        name: `${name}'s Workspace`,
        owner_id: user.id,
        plan: 'FREE',
        members: [{ user_id: user.id, role: 'OWNER' }],
        created_at: new Date()
      })

      return handleCORS(NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        workspace: {
          id: workspace.id,
          name: workspace.name
        }
      }))
    }

    // Register - POST /api/auth/register (kept for compatibility but will be intercepted by NextAuth)
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { name, email, password } = body

      if (!name || !email || !password) {
        return handleCORS(NextResponse.json(
          { error: 'Todos os campos são obrigatórios' },
          { status: 400 }
        ))
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return handleCORS(NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        ))
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10)

      // Create user
      const user = await User.create({
        id: uuidv4(),
        name,
        email: email.toLowerCase(),
        password_hash,
        role: 'OWNER',
        created_at: new Date()
      })

      // Create default workspace
      const workspace = await Workspace.create({
        id: uuidv4(),
        name: `${name}'s Workspace`,
        owner_id: user.id,
        plan: 'FREE',
        members: [{ user_id: user.id, role: 'OWNER' }],
        created_at: new Date()
      })

      return handleCORS(NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        workspace: {
          id: workspace.id,
          name: workspace.name
        }
      }))
    }

    // Health check
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Task Manager API' }))
    }

    // ============ PROTECTED ROUTES ============
    const session = await getSession(request)
    if (!session?.user) {
      return handleCORS(NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      ))
    }

    const userId = session.user.id

    // ============ WORKSPACE ROUTES ============

    // Get user workspaces - GET /api/workspaces
    if (route === '/workspaces' && method === 'GET') {
      const workspaces = await Workspace.find({
        $or: [
          { owner_id: userId },
          { 'members.user_id': userId }
        ]
      }).sort({ created_at: -1 })

      return handleCORS(NextResponse.json(workspaces))
    }

    // Create workspace - POST /api/workspaces
    if (route === '/workspaces' && method === 'POST') {
      const body = await request.json()
      const { name, plan = 'FREE' } = body

      if (!name) {
        return handleCORS(NextResponse.json(
          { error: 'Nome do workspace é obrigatório' },
          { status: 400 }
        ))
      }

      const workspace = await Workspace.create({
        id: uuidv4(),
        name,
        owner_id: userId,
        plan,
        members: [{ user_id: userId, role: 'OWNER' }],
        created_at: new Date()
      })

      await logActivity('workspace', workspace.id, 'created', userId, workspace.id)

      return handleCORS(NextResponse.json(workspace))
    }

    // Get workspace - GET /api/workspaces/:id
    if (route.match(/^\/workspaces\/[^/]+$/) && method === 'GET') {
      const workspaceId = path[1]
      const workspace = await Workspace.findOne({ id: workspaceId })

      if (!workspace) {
        return handleCORS(NextResponse.json(
          { error: 'Workspace não encontrado' },
          { status: 404 }
        ))
      }

      // Check access
      const hasAccess = workspace.owner_id === userId || 
        workspace.members.some(m => m.user_id === userId)

      if (!hasAccess) {
        return handleCORS(NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        ))
      }

      return handleCORS(NextResponse.json(workspace))
    }

    // ============ PROJECT ROUTES ============

    // Get workspace projects - GET /api/workspaces/:id/projects
    if (route.match(/^\/workspaces\/[^/]+\/projects$/) && method === 'GET') {
      const workspaceId = path[1]
      const projects = await Project.find({ workspace_id: workspaceId }).sort({ created_at: -1 })
      return handleCORS(NextResponse.json(projects))
    }

    // Create project - POST /api/workspaces/:id/projects
    if (route.match(/^\/workspaces\/[^/]+\/projects$/) && method === 'POST') {
      const workspaceId = path[1]
      const body = await request.json()
      const { name, description = '' } = body

      if (!name) {
        return handleCORS(NextResponse.json(
          { error: 'Nome do projeto é obrigatório' },
          { status: 400 }
        ))
      }

      const project = await Project.create({
        id: uuidv4(),
        workspace_id: workspaceId,
        name,
        description,
        created_at: new Date()
      })

      await logActivity('project', project.id, 'created', userId, workspaceId)

      return handleCORS(NextResponse.json(project))
    }

    // ============ BOARD ROUTES ============

    // Get project boards - GET /api/projects/:id/boards
    if (route.match(/^\/projects\/[^/]+\/boards$/) && method === 'GET') {
      const projectId = path[1]
      const boards = await Board.find({ project_id: projectId }).sort({ created_at: -1 })
      return handleCORS(NextResponse.json(boards))
    }

    // Create board - POST /api/projects/:id/boards
    if (route.match(/^\/projects\/[^/]+\/boards$/) && method === 'POST') {
      const projectId = path[1]
      const body = await request.json()
      const { name } = body

      if (!name) {
        return handleCORS(NextResponse.json(
          { error: 'Nome do board é obrigatório' },
          { status: 400 }
        ))
      }

      const board = await Board.create({
        id: uuidv4(),
        project_id: projectId,
        name,
        created_at: new Date()
      })

      // Create default columns
      await Column.create([
        {
          id: uuidv4(),
          board_id: board.id,
          name: 'A Fazer',
          order: 0,
          type: 'TODO',
          created_at: new Date()
        },
        {
          id: uuidv4(),
          board_id: board.id,
          name: 'Em Progresso',
          order: 1,
          type: 'DOING',
          created_at: new Date()
        },
        {
          id: uuidv4(),
          board_id: board.id,
          name: 'Concluído',
          order: 2,
          type: 'DONE',
          created_at: new Date()
        }
      ])

      const project = await Project.findOne({ id: projectId })
      await logActivity('board', board.id, 'created', userId, project?.workspace_id || '')

      return handleCORS(NextResponse.json(board))
    }

    // Get board with columns and tasks - GET /api/boards/:id
    if (route.match(/^\/boards\/[^/]+$/) && method === 'GET') {
      const boardId = path[1]
      const board = await Board.findOne({ id: boardId })

      if (!board) {
        return handleCORS(NextResponse.json(
          { error: 'Board não encontrado' },
          { status: 404 }
        ))
      }

      const columns = await Column.find({ board_id: boardId }).sort({ order: 1 })
      const columnIds = columns.map(c => c.id)
      const tasks = await Task.find({ 
        column_id: { $in: columnIds },
        archived: false 
      }).sort({ order: 1 })

      return handleCORS(NextResponse.json({
        board,
        columns,
        tasks
      }))
    }

    // ============ TASK ROUTES ============

    // Create task - POST /api/columns/:id/tasks
    if (route.match(/^\/columns\/[^/]+\/tasks$/) && method === 'POST') {
      const columnId = path[1]
      const body = await request.json()
      const { title, description = '', priority = 'MEDIUM', due_date = null, assigned_to = null } = body

      if (!title) {
        return handleCORS(NextResponse.json(
          { error: 'Título da tarefa é obrigatório' },
          { status: 400 }
        ))
      }

      // Get column to determine progress
      const column = await Column.findOne({ id: columnId })
      let progress = 0
      if (column?.type === 'DOING') progress = 50
      if (column?.type === 'DONE') progress = 100

      // Get max order
      const maxOrderTask = await Task.findOne({ column_id: columnId }).sort({ order: -1 })
      const order = maxOrderTask ? maxOrderTask.order + 1 : 0

      const task = await Task.create({
        id: uuidv4(),
        column_id: columnId,
        title,
        description,
        priority,
        due_date: due_date ? new Date(due_date) : null,
        progress,
        assigned_to,
        created_by: userId,
        order,
        archived: false,
        created_at: new Date(),
        updated_at: new Date()
      })

      return handleCORS(NextResponse.json(task))
    }

    // Update task - PUT /api/tasks/:id
    if (route.match(/^\/tasks\/[^/]+$/) && method === 'PUT') {
      const taskId = path[1]
      const body = await request.json()

      const task = await Task.findOne({ id: taskId })
      if (!task) {
        return handleCORS(NextResponse.json(
          { error: 'Tarefa não encontrada' },
          { status: 404 }
        ))
      }

      // Update fields
      Object.keys(body).forEach(key => {
        if (body[key] !== undefined) {
          task[key] = body[key]
        }
      })
      task.updated_at = new Date()

      await task.save()

      return handleCORS(NextResponse.json(task))
    }

    // Move task - POST /api/tasks/:id/move
    if (route.match(/^\/tasks\/[^/]+\/move$/) && method === 'POST') {
      const taskId = path[1]
      const body = await request.json()
      const { column_id, order } = body

      const task = await Task.findOne({ id: taskId })
      if (!task) {
        return handleCORS(NextResponse.json(
          { error: 'Tarefa não encontrada' },
          { status: 404 }
        ))
      }

      // Get new column to update progress
      const column = await Column.findOne({ id: column_id })
      if (column) {
        if (column.type === 'TODO') task.progress = 0
        if (column.type === 'DOING') task.progress = 50
        if (column.type === 'DONE') task.progress = 100
      }

      task.column_id = column_id
      task.order = order
      task.updated_at = new Date()

      await task.save()

      return handleCORS(NextResponse.json(task))
    }

    // Delete task - DELETE /api/tasks/:id
    if (route.match(/^\/tasks\/[^/]+$/) && method === 'DELETE') {
      const taskId = path[1]
      await Task.deleteOne({ id: taskId })
      await Subtask.deleteMany({ task_id: taskId })
      await Comment.deleteMany({ task_id: taskId })

      return handleCORS(NextResponse.json({ success: true }))
    }

    // Get task calendar - GET /api/workspaces/:id/calendar
    if (route.match(/^\/workspaces\/[^/]+\/calendar$/) && method === 'GET') {
      const workspaceId = path[1]
      
      // Get all projects in workspace
      const projects = await Project.find({ workspace_id: workspaceId })
      const projectIds = projects.map(p => p.id)
      
      // Get all boards
      const boards = await Board.find({ project_id: { $in: projectIds } })
      const boardIds = boards.map(b => b.id)
      
      // Get all columns
      const columns = await Column.find({ board_id: { $in: boardIds } })
      const columnIds = columns.map(c => c.id)
      
      // Get tasks with due dates
      const tasks = await Task.find({
        column_id: { $in: columnIds },
        due_date: { $ne: null },
        archived: false
      }).sort({ due_date: 1 })

      return handleCORS(NextResponse.json(tasks))
    }

    // Get analytics - GET /api/workspaces/:id/analytics
    if (route.match(/^\/workspaces\/[^/]+\/analytics$/) && method === 'GET') {
      const workspaceId = path[1]
      
      // Get all projects in workspace
      const projects = await Project.find({ workspace_id: workspaceId })
      const projectIds = projects.map(p => p.id)
      
      // Get all boards
      const boards = await Board.find({ project_id: { $in: projectIds } })
      const boardIds = boards.map(b => b.id)
      
      // Get all columns
      const columns = await Column.find({ board_id: { $in: boardIds } })
      const columnIds = columns.map(c => c.id)
      
      // Get all tasks
      const tasks = await Task.find({
        column_id: { $in: columnIds },
        archived: false
      })

      // Calculate metrics
      const tasksByStatus = {
        TODO: tasks.filter(t => {
          const col = columns.find(c => c.id === t.column_id)
          return col?.type === 'TODO'
        }).length,
        DOING: tasks.filter(t => {
          const col = columns.find(c => c.id === t.column_id)
          return col?.type === 'DOING'
        }).length,
        DONE: tasks.filter(t => {
          const col = columns.find(c => c.id === t.column_id)
          return col?.type === 'DONE'
        }).length
      }

      const tasksByPriority = {
        LOW: tasks.filter(t => t.priority === 'LOW').length,
        MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
        HIGH: tasks.filter(t => t.priority === 'HIGH').length,
        URGENT: tasks.filter(t => t.priority === 'URGENT').length
      }

      const overdueTasks = tasks.filter(t => {
        if (!t.due_date) return false
        const col = columns.find(c => c.id === t.column_id)
        return col?.type !== 'DONE' && new Date(t.due_date) < new Date()
      }).length

      return handleCORS(NextResponse.json({
        totalTasks: tasks.length,
        tasksByStatus,
        tasksByPriority,
        overdueTasks,
        completionRate: tasks.length > 0 
          ? Math.round((tasksByStatus.DONE / tasks.length) * 100) 
          : 0
      }))
    }

    // ============ SUBTASK ROUTES ============

    // Get task subtasks - GET /api/tasks/:id/subtasks
    if (route.match(/^\/tasks\/[^/]+\/subtasks$/) && method === 'GET') {
      const taskId = path[1]
      const subtasks = await Subtask.find({ task_id: taskId }).sort({ created_at: 1 })
      return handleCORS(NextResponse.json(subtasks))
    }

    // Create subtask - POST /api/tasks/:id/subtasks
    if (route.match(/^\/tasks\/[^/]+\/subtasks$/) && method === 'POST') {
      const taskId = path[1]
      const body = await request.json()
      const { title } = body

      if (!title) {
        return handleCORS(NextResponse.json(
          { error: 'Título da subtarefa é obrigatório' },
          { status: 400 }
        ))
      }

      const subtask = await Subtask.create({
        id: uuidv4(),
        task_id: taskId,
        title,
        completed: false,
        created_at: new Date()
      })

      return handleCORS(NextResponse.json(subtask))
    }

    // Toggle subtask - PATCH /api/subtasks/:id
    if (route.match(/^\/subtasks\/[^/]+$/) && method === 'PATCH') {
      const subtaskId = path[1]
      const subtask = await Subtask.findOne({ id: subtaskId })
      
      if (!subtask) {
        return handleCORS(NextResponse.json(
          { error: 'Subtarefa não encontrada' },
          { status: 404 }
        ))
      }

      subtask.completed = !subtask.completed
      await subtask.save()

      // Check if all subtasks are completed
      const allSubtasks = await Subtask.find({ task_id: subtask.task_id })
      const allCompleted = allSubtasks.every(s => s.completed)

      // If all completed, mark task as done
      if (allCompleted && allSubtasks.length > 0) {
        const task = await Task.findOne({ id: subtask.task_id })
        if (task) {
          const doneColumn = await Column.findOne({ 
            board_id: { $exists: true }, 
            type: 'DONE' 
          })
          if (doneColumn) {
            task.progress = 100
            await task.save()
          }
        }
      }

      return handleCORS(NextResponse.json(subtask))
    }

    // ============ COMMENT ROUTES ============

    // Get task comments - GET /api/tasks/:id/comments
    if (route.match(/^\/tasks\/[^/]+\/comments$/) && method === 'GET') {
      const taskId = path[1]
      const comments = await Comment.find({ task_id: taskId }).sort({ created_at: -1 })
      
      // Get user names
      const userIds = [...new Set(comments.map(c => c.user_id))]
      const users = await User.find({ id: { $in: userIds } })
      const userMap = {}
      users.forEach(u => {
        userMap[u.id] = u.name
      })

      const commentsWithUsers = comments.map(c => ({
        ...c.toObject(),
        user_name: userMap[c.user_id] || 'Unknown'
      }))

      return handleCORS(NextResponse.json(commentsWithUsers))
    }

    // Create comment - POST /api/tasks/:id/comments
    if (route.match(/^\/tasks\/[^/]+\/comments$/) && method === 'POST') {
      const taskId = path[1]
      const body = await request.json()
      const { content } = body

      if (!content) {
        return handleCORS(NextResponse.json(
          { error: 'Conteúdo do comentário é obrigatório' },
          { status: 400 }
        ))
      }

      const comment = await Comment.create({
        id: uuidv4(),
        task_id: taskId,
        user_id: userId,
        content,
        created_at: new Date()
      })

      return handleCORS(NextResponse.json(comment))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute