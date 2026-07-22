export type Subject = {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  proficiency: number
  progress: number
}

export type Recommendation = {
  id: string
  title: string
  description: string | null
  course_id: string | null
  priority: 'high' | 'medium' | 'low'
  created_at: string
}
