import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TopNav from "@/components/layout/top-nav";

const defaultSettings = {
  darkMode: true,
  voicePrompt: true,
  micPermissionGranted: false,
  units: "kmh",
  owmKey: "6bf23a460498b5e80155f16e12e6d455",
  gmapsKey: "",
  backgroundMode: "black",
  useDarkBackground: true,
  alertsEnabled: true,
};

export default function SettingsPage() {
  // Use lazy state initialization to sync with localStorage on first render
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("ai-copilot:settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge defaults and fix backgroundMode/useDarkBackground logic
        const merged = { ...defaultSettings, ...parsed };
        if (parsed.backgroundMode) {
          merged.useDarkBackground = parsed.backgroundMode === "black";
        } else {
          merged.backgroundMode = merged.useDarkBackground ? "black" : "weather";
        }
        return merged;
      }
    } catch (e) {
      // parsing failed, return defaults
    }
    return defaultSettings;
  });

  // Sync dark mode class and save to localStorage on settings change
  useEffect(() => {
    localStorage.setItem("ai-copilot:settings", JSON.stringify(settings));
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  const panelStyle = {
    background: "#1A1A1D",
    boxShadow:
      "0 0 10px rgba(0,255,247,0.15), inset 0 0 24px rgba(31,81,255,0.08)",
    borderColor: "rgba(0,255,247,0.15)",
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#0B0C10" }}>
      <TopNav />
      <div className="mx-auto max-w-[900px] px-4 py-6">
        <h1
          className="text-2xl font-semibold mb-6"
          style={{ color: "#E0FFFF" }}
        >
          Settings
        </h1>

        <Card className="p-6 space-y-6" style={panelStyle}>
          <div className="flex items-center justify-between">
            <Label htmlFor="darkMode" className="text-[#E0FFFF]">
              Dark Mode
            </Label>
            <Switch
              id="darkMode"
              checked={settings.darkMode}
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, darkMode: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="alertsEnabled" className="text-[#E0FFFF]">
              Enable Alerts
            </Label>
            <Switch
              id="alertsEnabled"
              checked={settings.alertsEnabled}
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, alertsEnabled: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="voicePrompt" className="text-[#E0FFFF]">
              Voice Prompts
            </Label>
            <Switch
              id="voicePrompt"
              checked={settings.voicePrompt}
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, voicePrompt: v }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="micPermissionGranted" className="text-[#E0FFFF]">
              Enable Microphone Access
            </Label>
            <Switch
              id="micPermissionGranted"
              checked={settings.micPermissionGranted}
              onCheckedChange={async (enabled) => {
                setSettings((s) => ({ ...s, micPermissionGranted: enabled }));

                if (enabled) {
                  try {
                    // Request mic access permission by starting listening once
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    // Alternatively, if you use SpeechRecognition lib, startListening once:
                    // SpeechRecognition.startListening({ continuous: false });
                  } catch (err) {
                    alert("Microphone access denied or error: " + err.message);
                    // Revert toggle if permission denied
                    setSettings((s) => ({ ...s, micPermissionGranted: false }));
                  }
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-[#E0FFFF]">Units</Label>
            <Select
              value={settings.units}
              onValueChange={(v) => setSettings((s) => ({ ...s, units: v }))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kmh">km/h</SelectItem>
                <SelectItem value="mph">mph</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[#E0FFFF]">Dashboard Background</Label>
              <p className="text-xs text-[#E0FFFF]/60 mt-1">
                Choose between solid cockpit black (default) or live weather
                scenes.
              </p>
            </div>
            <Select
              value={settings.backgroundMode}
              onValueChange={(v) =>
                setSettings((s) => ({
                  ...s,
                  backgroundMode: v,
                  useDarkBackground: v === "black",
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select background" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="black">Black (default)</SelectItem>
                <SelectItem value="weather">Live Weather</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>
    </div>
  );
}
