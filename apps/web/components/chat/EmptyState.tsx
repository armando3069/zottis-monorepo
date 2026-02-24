import { MessageSquare } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Selectează o conversație</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Alege o conversație din listă pentru a vizualiza mesajele și a beneficia de funcțiile
          inteligente
        </p>
      </div>
    </div>
  );
}