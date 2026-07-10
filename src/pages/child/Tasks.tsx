import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import { TaskCard } from '../../components/TaskCard'
import type { Task, TaskCompletion } from '../../types'

export default function ChildTasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set())

  async function load() {
    if (!profile) return
    const { data: t } = await supabase.from('tasks').select('*').eq('active', true).order('points', { ascending: false })
    setTasks((t as Task[]) ?? [])
    const { data: c } = await supabase
      .from('task_completions')
      .select('*')
      .eq('child_id', profile.id)
      .eq('status', 'pending')
    setPendingTaskIds(new Set(((c as TaskCompletion[]) ?? []).map((x) => x.task_id)))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function completeTask(taskId: string) {
    await supabase.rpc('request_task_completion', { p_task_id: taskId })
    load()
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Aufgaben</h1>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            pending={pendingTaskIds.has(task.id)}
            onComplete={() => completeTask(task.id)}
          />
        ))}
        {tasks.length === 0 && <p className="text-[var(--color-ink-soft)]">Noch keine Aufgaben angelegt.</p>}
      </div>
    </Layout>
  )
}
