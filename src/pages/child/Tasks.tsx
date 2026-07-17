import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import { TaskCard } from '../../components/TaskCard'
import { getTaskStatus, type ChildTaskStatus } from '../../lib/taskPeriods'
import type { Task, TaskCompletion } from '../../types'

export default function ChildTasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [statusByTask, setStatusByTask] = useState<Record<string, ChildTaskStatus>>({})
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!profile) return
    const { data: t } = await supabase.from('tasks').select('*').eq('active', true).order('points', { ascending: false })
    const taskList = (t as Task[]) ?? []
    setTasks(taskList)

    const { data: c } = await supabase
      .from('task_completions')
      .select('*')
      .eq('child_id', profile.id)
      .in('status', ['pending', 'approved'])
    const completions = (c as TaskCompletion[]) ?? []

    const statuses: Record<string, ChildTaskStatus> = {}
    for (const task of taskList) {
      statuses[task.id] = getTaskStatus(
        task.repeat_type,
        completions.filter((x) => x.task_id === task.id)
      )
    }
    setStatusByTask(statuses)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function completeTask(taskId: string) {
    setError(null)
    const { error } = await supabase.rpc('request_task_completion', { p_task_id: taskId })
    if (error) {
      setError(error.message)
      return
    }
    load()
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Aufgaben</h1>
      {error && <p className="mb-4 text-sm font-semibold text-[var(--color-clay)]">{error}</p>}
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            status={statusByTask[task.id] ?? 'open'}
            onComplete={() => completeTask(task.id)}
          />
        ))}
        {tasks.length === 0 && <p className="text-[var(--color-ink-soft)]">Noch keine Aufgaben angelegt.</p>}
      </div>
    </Layout>
  )
}
