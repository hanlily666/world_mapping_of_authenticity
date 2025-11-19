import { supabase } from '@/lib/supabase'
import { Submission } from '@/types'

export async function loadSubmissions(): Promise<Submission[]> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading submissions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error loading submissions:', error)
    return []
  }
}

export function filterSubmissions(
  submissions: Submission[],
  searchQuery: string
): Submission[] {
  if (!searchQuery.trim()) {
    return submissions
  }

  const query = searchQuery.toLowerCase()
  return submissions.filter((submission) =>
    submission.location_name.toLowerCase().includes(query)
  )
}

