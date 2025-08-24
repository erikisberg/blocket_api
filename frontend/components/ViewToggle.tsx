'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Grid3X3, List } from 'lucide-react'

interface ViewToggleProps {
  currentView: 'cards' | 'list'
  onViewChange: (view: 'cards' | 'list') => void
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
      <Button
        variant={currentView === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('cards')}
        className="flex items-center gap-2"
      >
        <Grid3X3 className="h-4 w-4" />
        Kort
      </Button>
      
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="flex items-center gap-2"
      >
        <List className="h-4 w-4" />
        Lista
      </Button>
    </div>
  )
}
