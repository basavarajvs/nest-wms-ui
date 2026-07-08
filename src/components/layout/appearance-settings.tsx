import { useState } from 'react'
import { useTheme } from 'next-themes'
import { PaletteIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { THEME_PRESETS, applyThemePreset, getStoredThemePreset, type ThemePreset } from '@/lib/theme-presets'

export function AppearanceSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [preset, setPreset] = useState<ThemePreset>(getStoredThemePreset)
  const [open, setOpen] = useState(false)

  const onThemeModeChange = (mode: string) => {
    if (!mode) return
    setTheme(mode)
  }

  const onPresetChange = (value: ThemePreset | '') => {
    if (!value) return
    setPreset(value)
    applyThemePreset(value)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Appearance settings">
          <PaletteIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h4 className="font-medium text-sm leading-none">Appearance</h4>
            <p className="text-muted-foreground text-xs">Customize the look and feel.</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="font-medium text-xs">Color Preset</Label>
              <Select value={preset} onValueChange={onPresetChange}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {THEME_PRESETS.map((p) => (
                      <SelectItem key={p.value} className="text-xs" value={p.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                resolvedTheme === 'dark' ? p.primary.dark : p.primary.light,
                            }}
                          />
                          {p.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-medium text-xs">Theme Mode</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={theme}
                onValueChange={onThemeModeChange}
              >
                <ToggleGroupItem value="light" aria-label="Light">
                  Light
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark">
                  Dark
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label="System">
                  System
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}