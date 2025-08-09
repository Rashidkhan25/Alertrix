import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings } from "lucide-react";

export default function TopNav() {
  return (
    <header
      className="sticky z-30 w-full border-b border-white/10 backdrop-blur"
      style={{ backgroundColor: "rgba(11,12,16,0.65)" }}
    >
      <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Alertrix"
            className="h-10 w-10 object-contain scale-[5] ml-10"
          />
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <Link
            to="/dashboard"
            className="text-[#E0FFFF]/80 hover:text-[#00FFF7] transition-colors px-3 py-1.5 rounded"
          >
            Dashboard
          </Link>
          <Link
            to="/analytics"
            className="text-[#E0FFFF]/80 hover:text-[#00FFF7] transition-colors px-3 py-1.5 rounded"
          >
            Analytics
          </Link>
          <Link
            to="/settings"
            className="text-[#E0FFFF]/80 hover:text-[#00FFF7] transition-colors px-3 py-1.5 rounded"
          >
            Settings
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#E0FFFF] hover:text-[#00FFF7]"
            >
              <Settings />
            </Button>
          </Link>
          <Avatar className="border text-white/60 border-cyan-400/30 shadow-[0_0_12px_rgba(0,255,247,0.3)]">
            <AvatarFallback>RK</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
