import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { AnomalyEvent } from '../../types/simulator';

interface AnomalyLogTableProps {
  logs: AnomalyEvent[];
}

export function AnomalyLogTable({ logs }: AnomalyLogTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.08] p-3.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {logs.length > 0 ? (
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          )}
          <h4 className="text-xs font-semibold text-[#1D1D1F]">
            Safety Cutoff &amp; Anomaly Log
          </h4>
        </div>
        <span className="font-mono text-[11px] text-[#6E6E73] tabular-nums">
          {logs.length} {logs.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {logs.length === 0 ? (
        <p className="text-[11px] text-[#6E6E73] bg-[#F5F5F7] rounded-xl px-3 py-2.5">
          No voltage anomalies recorded. Trigger a Grid Fault Test above to verify
          sub-50ms cutoff and instant mobile alert delivery.
        </p>
      ) : (
        <div className="overflow-x-auto max-h-[130px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                <th className="pb-1.5 pr-2">Time</th>
                <th className="pb-1.5 pr-2">Fault</th>
                <th className="pb-1.5 pr-2">Reading</th>
                <th className="pb-1.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] text-[11px]">
              {logs.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-1.5 pr-2 font-mono text-[#6E6E73] whitespace-nowrap tabular-nums">
                    {entry.simulatedTimestamp}
                  </td>
                  <td className="py-1.5 pr-2 font-semibold text-[#DC2626] whitespace-nowrap">
                    {entry.type}
                  </td>
                  <td className="py-1.5 pr-2 font-mono font-semibold text-[#1D1D1F] whitespace-nowrap tabular-nums">
                    {entry.measuredValue}
                  </td>
                  <td className="py-1.5 text-[#047857] whitespace-nowrap">
                    {entry.actionTaken}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

