import { Paperclip, Smile, Send, Zap, Tag } from "lucide-react";
import { SUGGESTIONS } from "@/lib/chatUtils";
import { SuggestionsPanel } from "./SuggestionsPanel";

interface MessageInputProps {
  value: string;
  showSuggestions: boolean;
  onValueChange: (value: string) => void;
  onShowSuggestionsChange: (show: boolean) => void;
  onSend: () => void;
}

export function MessageInput({
  value,
  showSuggestions,
  onValueChange,
  onShowSuggestionsChange,
  onSend,
}: MessageInputProps) {
  return (
    <div className="p-4 border-t border-slate-200 bg-white">
      {showSuggestions && (
        <SuggestionsPanel
          suggestions={SUGGESTIONS}
          onSelect={(s) => {
            onValueChange(s);
            onShowSuggestionsChange(false);
          }}
        />
      )}

      <div className="flex items-end gap-3">
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Paperclip className="w-5 h-5 text-slate-600" />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={() => onShowSuggestionsChange(true)}
            placeholder="Scrie un mesaj..."
            className="w-full p-3 pr-10 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
          <button
            className="absolute right-3 bottom-3 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => onShowSuggestionsChange(!showSuggestions)}
          >
            <Smile className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <button
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-200"
          onClick={onSend}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 px-2">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <button className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Sugestii AI
          </button>
          <button className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Auto-clasificare
          </button>
        </div>
        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          Cmd + Enter pentru trimitere
        </button>
      </div>
    </div>
  );
}