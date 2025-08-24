'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Phone, Bell, TestTube, Save, Loader2 } from 'lucide-react'

interface UserSettings {
  id: string
  user_id: string
  phone_number: string
  sms_enabled: boolean
  min_score_threshold: number
  notification_frequency: number
  max_sms_per_day: number
  category_filters: string[]
  created_at: string
  updated_at: string
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Update selected categories when settings load
  useEffect(() => {
    if (settings?.category_filters) {
      setSelectedCategories(settings.category_filters)
    }
  }, [settings])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        throw new Error('Failed to load settings')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'default_user', 
          ...settings,
          category_filters: selectedCategories
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const testSMS = async () => {
    if (!settings?.phone_number) {
      setMessage({ type: 'error', text: 'Please enter a phone number first' })
      return
    }

    try {
      setTesting(true)
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'test_sms', 
          phoneNumber: settings.phone_number 
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test SMS sent successfully! Check your phone.' })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send test SMS')
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send test SMS' })
    } finally {
      setTesting(false)
    }
  }

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Inställningar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto animate-spin" />
          <p className="mt-2 text-gray-600">Laddar inställningar...</p>
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-8">
          <p className="text-red-600">Failed to load settings</p>
          <Button onClick={loadSettings} className="mt-2">Försök igen</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          SMS & Notifikationsinställningar
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Konfigurera SMS-notifikationer för undervärderade objekt
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefonnummer
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+46701234567 eller 0701234567"
            value={settings.phone_number}
            onChange={(e) => updateSetting('phone_number', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Använd svenskt format: +46701234567 eller 0701234567
          </p>
        </div>

        {/* SMS Enabled */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              SMS-notifikationer aktiverade
            </Label>
            <p className="text-sm text-muted-foreground">
              Få SMS när undervärderade objekt hittas
            </p>
          </div>
          <Switch
            checked={settings.sms_enabled}
            onCheckedChange={(checked) => updateSetting('sms_enabled', checked)}
          />
        </div>

        {/* Score Threshold */}
        <div className="space-y-2">
          <Label htmlFor="score-threshold">Minimumpoäng för SMS</Label>
          <Select
            value={settings.min_score_threshold.toString()}
            onValueChange={(value) => updateSetting('min_score_threshold', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4/5 - Undervärderat</SelectItem>
              <SelectItem value="5">5/5 - Mycket undervärderat</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Endast objekt med denna poäng eller högre triggar SMS
          </p>
        </div>

        {/* Notification Frequency */}
        <div className="space-y-2">
          <Label htmlFor="frequency">Kontrollfrekvens</Label>
          <Select
            value={settings.notification_frequency.toString()}
            onValueChange={(value) => updateSetting('notification_frequency', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Var 5:e minut</SelectItem>
              <SelectItem value="10">Var 10:e minut</SelectItem>
              <SelectItem value="15">Var 15:e minut</SelectItem>
              <SelectItem value="30">Var 30:e minut</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Hur ofta systemet kontrollerar efter nya objekt
          </p>
        </div>

        {/* Max SMS per Day */}
        <div className="space-y-2">
          <Label htmlFor="max-sms">Max SMS per dag</Label>
          <Input
            id="max-sms"
            type="number"
            min="1"
            max="100"
            value={settings.max_sms_per_day}
            onChange={(e) => updateSetting('max_sms_per_day', parseInt(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Begränsar antalet SMS för att undvika spam
          </p>
        </div>

        {/* Category Filters */}
        <div className="space-y-2">
          <Label>Kategorier för SMS-notifikationer</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes('all')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategories(['all'])
                  } else {
                    setSelectedCategories([])
                  }
                }}
                className="rounded"
              />
              <span className="text-sm">Alla kategorier</span>
            </label>
            
            {['Tillbehör', 'Övriga cyklar', 'Barncyklar', 'Damcyklar', 'Herrcyklar', 'Mountainbike'].map((category) => (
              <label key={category} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories(prev => 
                        prev.includes('all') 
                          ? prev.filter(c => c !== 'all').concat(category)
                          : prev.concat(category)
                      )
                        } else {
                          setSelectedCategories(prev => prev.filter(c => c !== category))
                        }
                  }}
                  className="rounded"
                  disabled={selectedCategories.includes('all')}
                />
                <span className="text-sm">{category}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Välj vilka kategorier du vill få SMS-notifikationer för. Kryssa i "Alla kategorier" för att få alla.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Spara inställningar
              </>
            )}
          </Button>

          <Button 
            onClick={testSMS} 
            disabled={testing || !settings.sms_enabled || !settings.phone_number}
            variant="outline"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Skickar...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Testa SMS
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">ℹ️ Hur det fungerar</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Systemet kontrollerar automatiskt efter nya objekt</li>
            <li>• AI analyserar varje nytt objekt för undervärdering</li>
            <li>• SMS skickas endast för objekt med score 4-5</li>
            <li>• Du kan testa SMS-funktionen med knappen ovan</li>
            <li>• Inställningarna sparas automatiskt i databasen</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
