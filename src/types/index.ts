export type Role = 'parent' | 'child'
export type RepeatType = 'once' | 'daily' | 'weekly' | 'monthly'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type SubjectType = 'main' | 'minor'

export interface Profile {
  id: string
  family_id: string
  role: Role
  display_name: string
  current_point_balance: number
  created_at: string
}

export interface Family {
  id: string
  name: string
  created_at: string
}

export interface InviteCode {
  id: string
  family_id: string
  child_profile_id: string
  code: string
  for_role: Role
  status: 'pending' | 'used' | 'expired'
  expires_at: string
}

export interface Task {
  id: string
  family_id: string
  title: string
  description: string | null
  category: string | null
  points: number
  repeat_type: RepeatType
  active: boolean
  created_at: string
}

export interface TaskCompletion {
  id: string
  task_id: string
  child_id: string
  status: ApprovalStatus
  completed_at: string
  reviewed_at: string | null
  task?: Task
  child?: Profile
}

export interface Reward {
  id: string
  family_id: string
  title: string
  description: string | null
  image_url: string | null
  point_price: number
  active: boolean
}

export interface Redemption {
  id: string
  reward_id: string
  child_id: string
  status: ApprovalStatus
  points_spent: number
  requested_at: string
  reviewed_at: string | null
  reward?: Reward
  child?: Profile
}

export interface Subject {
  id: string
  family_id: string
  name: string
  type: SubjectType
}

export interface Grade {
  id: string
  child_id: string
  subject_id: string
  grade_value: number
  date: string
  points_awarded: number
  subject?: Subject
}

export interface GradePointRule {
  id: string
  family_id: string
  subject_type: SubjectType
  grade_1: number
  grade_2: number
  grade_3: number
  grade_4: number
  grade_5: number
  grade_6: number
}

export interface PointTransaction {
  id: string
  child_id: string
  amount: number
  source_type: 'task' | 'grade' | 'reward' | 'manual'
  reason: string | null
  created_at: string
}

export interface PointSetting {
  family_id: string
  points_per_unit: number
  euro_value: number
}
