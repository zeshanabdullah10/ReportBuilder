'use client'

import { useState, useRef, useEffect } from 'react'
import { useBuilderStore } from '@/lib/stores/builder-store'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  MoreHorizontal,
  GripVertical,
  FileText,
} from 'lucide-react'

export function PageNavigation() {
  const {
    pages,
    activePageId,
    setActivePage,
    addPage,
    duplicatePage,
    deletePage,
    reorderPages,
    isPreviewMode,
  } = useBuilderStore()

  const [showPageMenu, setShowPageMenu] = useState(false)
  const [showPageList, setShowPageList] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const activeIndex = pages.findIndex(p => p.id === activePageId)
  const totalPages = pages.length

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPageMenu(false)
      }
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setShowPageList(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePreviousPage = () => {
    if (activeIndex > 0) {
      setActivePage(pages[activeIndex - 1].id)
    }
  }

  const handleNextPage = () => {
    if (activeIndex < totalPages - 1) {
      setActivePage(pages[activeIndex + 1].id)
    }
  }

  const handleAddPage = () => {
    addPage(activePageId || undefined)
    setShowPageMenu(false)
  }

  const handleDuplicatePage = () => {
    if (activePageId) {
      duplicatePage(activePageId)
    }
    setShowPageMenu(false)
  }

  const handleDeletePage = () => {
    if (activePageId && totalPages > 1) {
      deletePage(activePageId)
    }
    setShowPageMenu(false)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      // Visual feedback could be added here
    }
  }

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderPages(draggedIndex, index)
    }
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePreviousPage()
    } else if (e.key === 'ArrowRight') {
      handleNextPage()
    }
  }

  if (isPreviewMode) {
    return null
  }

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 z-40 bg-[#050810] border-t border-[rgba(0,255,200,0.2)]"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="navigation"
      aria-label="Page navigation"
    >
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left side - Navigation arrows and page indicator */}
        <div className="flex items-center gap-2">
          {/* Previous page button */}
          <button
            onClick={handlePreviousPage}
            disabled={activeIndex <= 0}
            className="p-2 text-gray-400 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous Page (Arrow Left)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page indicator / dropdown trigger */}
          <button
            onClick={() => setShowPageList(!showPageList)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)] rounded transition-colors font-mono"
            aria-haspopup="listbox"
            aria-expanded={showPageList}
          >
            <FileText className="w-4 h-4" />
            <span>
              Page <span className="text-[#00ffc8] font-semibold">{activeIndex + 1}</span> of {totalPages}
            </span>
          </button>

          {/* Next page button */}
          <button
            onClick={handleNextPage}
            disabled={activeIndex >= totalPages - 1}
            className="p-2 text-gray-400 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next Page (Arrow Right)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Page list dropdown */}
          {showPageList && (
            <div
              ref={listRef}
              className="absolute bottom-full left-4 mb-2 w-64 bg-[#0a0f14] border border-[rgba(0,255,200,0.3)] rounded-lg shadow-xl overflow-hidden"
              role="listbox"
              aria-label="Page list"
            >
              <div className="p-2 border-b border-[rgba(0,255,200,0.1)]">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Pages ({totalPages})
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      setActivePage(page.id)
                      setShowPageList(false)
                    }}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                      page.id === activePageId
                        ? 'bg-[rgba(0,255,200,0.15)] text-[#00ffc8]'
                        : 'text-gray-300 hover:bg-[rgba(0,255,200,0.08)] hover:text-[#00ffc8]'
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    role="option"
                    aria-selected={page.id === activePageId}
                  >
                    <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
                    <FileText className="w-4 h-4" />
                    <span className="flex-1 truncate">{page.name}</span>
                    <span className="text-xs text-gray-500">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side - Page actions */}
        <div className="flex items-center gap-1">
          {/* Quick add button */}
          <button
            onClick={handleAddPage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)] rounded transition-colors"
            title="Add new page"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Page</span>
          </button>

          {/* More actions menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowPageMenu(!showPageMenu)}
              className="p-2 text-gray-400 hover:text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)] rounded transition-colors"
              title="Page actions"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown menu */}
            {showPageMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#0a0f14] border border-[rgba(0,255,200,0.3)] rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={handleAddPage}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[rgba(0,255,200,0.1)] hover:text-[#00ffc8] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New Page
                </button>
                <button
                  onClick={handleDuplicatePage}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[rgba(0,255,200,0.1)] hover:text-[#00ffc8] transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate Page
                </button>
                <div className="border-t border-[rgba(0,255,200,0.1)]" />
                <button
                  onClick={handleDeletePage}
                  disabled={totalPages <= 1}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
