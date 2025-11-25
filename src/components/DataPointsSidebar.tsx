'use client'

import { useState } from 'react'
import { Submission } from '@/types'
import { filterSubmissions } from '@/utils/submissions'

interface DataPointsSidebarProps {
  submissions: Submission[]
  onSubmissionClick: (submission: Submission) => void
  onCollapseChange?: (isCollapsed: boolean) => void
}

export default function DataPointsSidebar({
  submissions,
  onSubmissionClick,
  onCollapseChange
}: DataPointsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredSubmissions = filterSubmissions(submissions, searchQuery)

  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    onCollapseChange?.(collapsed)
  }

  if (isCollapsed) {
    return (
      <button
        onClick={() => handleToggleCollapse(false)}
        className="fixed top-4 left-4 z-30 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg p-3 hover:from-gray-800 hover:to-gray-700 transition-all cursor-pointer shadow-lg border border-gray-700"
        aria-label="Expand sidebar"
      >
        {/* Waveform Icon */}
        <div className="relative flex items-center justify-center h-12 w-12">
          {/* Red bars (left side - past) */}
          <div className="absolute left-0 flex items-center justify-center space-x-0.5">
            <div className="w-0.5 h-1.5 bg-red-500 rounded-full"></div>
            <div className="w-0.5 h-3 bg-red-500 rounded-full"></div>
            <div className="w-0.5 h-6 bg-red-500 rounded-full"></div>
            <div className="w-0.5 h-9 bg-red-500 rounded-full"></div>
          </div>
          
          {/* Blue vertical line (current position) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <div className="w-0.5 h-9 bg-blue-400"></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          </div>
          
          {/* White bars (right side - future) */}
          <div className="absolute right-0 flex items-center justify-center space-x-0.5">
            <div className="w-0.5 h-6 bg-white rounded-full opacity-70"></div>
            <div className="w-0.5 h-4 bg-white rounded-full opacity-70"></div>
            <div className="w-0.5 h-3 bg-white rounded-full opacity-70"></div>
            <div className="w-0.5 h-2 bg-white rounded-full opacity-70"></div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col z-20 shadow-lg transition-all duration-300">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800" style={{ fontSize: '20px' }}>
            Data Points
          </h2>
          <button
            onClick={() => handleToggleCollapse(true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Collapse sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
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
          style={{ fontSize: '14px', color: '#000000' }}
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

