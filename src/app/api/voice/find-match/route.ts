/**
 * API Route: Find closest matching voice from stored embeddings
 * POST /api/voice/find-match
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_embedding, top_n = 5 } = body

    if (!user_embedding) {
      return NextResponse.json(
        { error: 'user_embedding is required' },
        { status: 400 }
      )
    }

    // Get all stored embeddings from Supabase
    const supabase = createClient()
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, voice_embedding, voice_language, user_name, location_name')
      .not('voice_embedding', 'is', null)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stored embeddings' },
        { status: 500 }
      )
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({
        success: true,
        best_match: null,
        top_matches: [],
        message: 'No stored voice embeddings found'
      })
    }

    // Format stored embeddings for Python backend
    const stored_embeddings = submissions.map(sub => ({
      id: sub.id,
      embedding: sub.voice_embedding,
      metadata: {
        user_name: sub.user_name,
        location_name: sub.location_name,
        language: sub.voice_language
      }
    }))

    // Call Python backend to find matches
    const response = await fetch(`${PYTHON_BACKEND_URL}/find-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_embedding,
        stored_embeddings,
        top_n
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error || 'Failed to find match' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in find-match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

