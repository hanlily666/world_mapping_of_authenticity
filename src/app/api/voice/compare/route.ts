/**
 * API Route: Compare two voice embeddings
 * POST /api/voice/compare
 */

import { NextRequest, NextResponse } from 'next/server'

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { embedding1, embedding2 } = body

    if (!embedding1 || !embedding2) {
      return NextResponse.json(
        { error: 'Both embedding1 and embedding2 are required' },
        { status: 400 }
      )
    }

    // Forward to Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/compare-voices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embedding1, embedding2 }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error || 'Failed to compare voices' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in compare voices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

