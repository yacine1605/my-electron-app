import { Minus, Square, X } from "lucide-react";

export function Titlebar() {
  return (
    <div className="drag-region h-9 bg-primary-900 flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-2">
        <img src="/icon.png" alt="FK PHARM" className="w-4 h-4 no-drag" />
        <span className="text-white/80 text-xs font-medium no-drag">
          FK PHARM — Gestion des Offres
        </span>
      </div>

      <div className="flex items-center no-drag">
        <button
          onClick={() => window.electronAPI.window.minimize()}
          className="px-3 py-1 hover:bg-white/10 transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-white/80" />
        </button>
        <button
          onClick={() => window.electronAPI.window.maximize()}
          className="px-3 py-1 hover:bg-white/10 transition-colors"
        >
          <Square className="w-3 h-3 text-white/80" />
        </button>
        <button
          onClick={() => window.electronAPI.window.close()}
          className="px-3 py-1 hover:bg-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-white/80" />
        </button>
      </div>
    </div>
  );
}
