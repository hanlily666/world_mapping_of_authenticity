'use client'

import { useState } from 'react'
import { Submission } from '@/types'
import { filterSubmissions } from '@/utils/submissions'

interface DataPointsSidebarProps {
  submissions: Submission[]
  onSubmissionClick: (submission: Submission) => void
}

export default function DataPointsSidebar({
  submissions,
  onSubmissionClick
}: DataPointsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSubmissions = filterSubmissions(submissions, searchQuery)

  return (
    <div className="w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col z-20 shadow-lg">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-bold text-gray-800 mb-3" style={{ fontSize: '20px' }}>
          Data Points
        </h2>
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by place name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
          onFocus={(e) => {
            const target = e.target as HTMLInputElement
            target.style.borderColor = '#689183'
            target.style.boxShadow = '0 0 0 2px rgba(104, 145, 131, 0.5)'
          }}
          onBlur={(e) => {
            const target = e.target as HTMLInputElement
            target.style.borderColor = '#d1d5db'
            target.style.boxShadow = 'none'
          }}
          style={{ fontSize: '14px' }}
        />
      </div>

      {/* Submissions List */}
      <div className="flex-1 overflow-y-auto modal-scroll">
        {filteredSubmissions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No places found matching your search.' : 'No data points yet.'}
          </div>
        ) : (
          <div className="p-2">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                onClick={() => onSubmissionClick(submission)}
                className="p-3 mb-2 rounded-lg cursor-pointer transition-all border"
                style={{
                  backgroundColor: '#F7D5CE',
                  borderColor: '#689183'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(104, 145, 131, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(104, 145, 131, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F7D5CE'
                  e.currentTarget.style.borderColor = '#689183'
                }}
              >
                <div className="font-semibold text-gray-800 mb-1" style={{ fontSize: '15px' }}>
                  {submission.location_name}
                </div>
                <div className="text-gray-600" style={{ fontSize: '13px' }}>
                  {submission.user_name ? `By: ${submission.user_name}` : 'By: Anonymous'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

