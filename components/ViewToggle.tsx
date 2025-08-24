'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Grid3X3, List, BarChart3 } from 'lucide-react'

interface ViewToggleProps {
  currentView: 'cards' | 'list'
  onViewChange: (view: 'cards' | 'list') => void
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 p-1 bg-gray-100 rounded-lg">
      <Button
        variant={currentView === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('cards')}
        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
      >
        <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Kort</span>
        <span className="sm:hidden">📱</span>
      </Button>
      
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
      >
        <List className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Lista</span>
        <span className="sm:hidden">📋</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
      >
        <a href="/logs">
          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Loggar</span>
          <span className="sm:hidden">📊</span>
        </a>
      </Button>
    </div>
  )
}
