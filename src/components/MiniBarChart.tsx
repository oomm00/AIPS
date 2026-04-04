"use client";

interface BarData {
  label: string; // e.g., "M", "T", "W"
  value: number;
  highlight?: boolean; // Highlight the max value
}

interface MiniBarChartProps {
  data: BarData[];
  height?: string;
  color?: "emerald" | "amber" | "sky" | "zinc";
}

const colorMap = {
  emerald: { base: "bg-emerald-500/20", highlight: "bg-emerald-500", text: "text-emerald-400" },
  amber: { base: "bg-amber-500/20", highlight: "bg-amber-500", text: "text-amber-400" },
  sky: { base: "bg-sky-500/20", highlight: "bg-sky-500", text: "text-sky-400" },
  zinc: { base: "bg-zinc-700/50", highlight: "bg-zinc-400", text: "text-zinc-300" },
};

export default function MiniBarChart({
  data,
  height = "h-12",
  color = "emerald",
}: MiniBarChartProps) {
  const maxVal = Math.max(...data.map(d => d.value));
  const colors = colorMap[color];

  return (
    <div className={`flex items-end gap-1.5 w-full ${height} mt-2`}>
      {data.map((item, i) => {
        const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
        const isHighlight = item.highlight;
        
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1 group">
            {/* Tooltip trigger area */}
            <div className="relative w-full flex flex-col justify-end h-full group-hover:opacity-100 transition-opacity">
              <div 
                className={`w-full rounded-sm ${isHighlight ? colors.highlight : colors.base} transition-all duration-500`}
                style={{ height: `${Math.max(percentage, 5)}%` }} // Minimum height so 0 isn't invisible if we want
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
