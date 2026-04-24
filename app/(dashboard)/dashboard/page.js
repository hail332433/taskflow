'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, FolderKanban, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces')
      if (!response.ok) {
        console.error('Error response:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error data:', errorData)
        setWorkspaces([])
        return
      }
      const data = await response.json()
      console.log('Workspaces loaded:', data)
      setWorkspaces(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      setWorkspaces([])
    } finally {
      setLoading(false)
    }
  }

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName })
      })

      if (response.ok) {
        setNewWorkspaceName('')
        setDialogOpen(false)
        fetchWorkspaces()
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bem-vindo, {session?.user?.name}!</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus workspaces e projetos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Criar Novo Workspace</DialogTitle>
              <DialogDescription>
                Crie um workspace para organizar seus projetos e equipes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Workspace</Label>
                <Input
                  id="name"
                  placeholder="Minha Empresa"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} type="button">
                Cancelar
              </Button>
              <Button onClick={createWorkspace} disabled={creating || !newWorkspaceName.trim()} type="button">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/workspace/${workspace.id}`)}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    {workspace.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    {workspace.members?.length || 0} membro(s)
                  </CardDescription>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {workspace.plan}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={(e) => {
                e.stopPropagation()
                router.push(`/workspace/${workspace.id}`)
              }}>
                Abrir Workspace
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {workspaces.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <FolderKanban className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Nenhum workspace encontrado</h3>
              <p className="text-sm text-muted-foreground">Crie seu primeiro workspace para começar</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Workspace
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}