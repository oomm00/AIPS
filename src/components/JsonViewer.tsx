"use client";

interface JsonViewerProps {
  data: unknown;
  maxHeight?: string;
}

function colorize(value: unknown): string {
  if (value === null) return "text-zinc-500";
  if (typeof value === "boolean") return "text-amber-400";
  if (typeof value === "number") return "text-sky-400";
  if (typeof value === "string") return "text-emerald-400";
  return "text-zinc-300";
}

function JsonNode({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const indent = "  ".repeat(depth);

  if (data === null) return <span className="text-zinc-500">null</span>;
  if (typeof data === "boolean") return <span className="text-amber-400">{String(data)}</span>;
  if (typeof data === "number") return <span className="text-sky-400">{data}</span>;
  if (typeof data === "string") return <span className="text-emerald-400">&quot;{data}&quot;</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-zinc-400">[]</span>;
    return (
      <span>
        {`[\n`}
        {data.map((item, i) => (
          <span key={i}>
            {indent}{"  "}<JsonNode data={item} depth={depth + 1} />{i < data.length - 1 ? "," : ""}{"\n"}
          </span>
        ))}
        {indent}{"]"}
      </span>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-zinc-400">{"{}"}</span>;
    return (
      <span>
        {"{\n"}
        {entries.map(([key, val], i) => (
          <span key={key}>
            {indent}{"  "}<span className="text-violet-400">&quot;{key}&quot;</span>:{" "}
            <JsonNode data={val} depth={depth + 1} />{i < entries.length - 1 ? "," : ""}{"\n"}
          </span>
        ))}
        {indent}{"}"}
      </span>
    );
  }

  return <span className={colorize(data)}>{String(data)}</span>;
}

export default function JsonViewer({ data, maxHeight = "400px" }: JsonViewerProps) {
  return (
    <div
      className="inset-terminal p-4 overflow-auto text-[11px] leading-relaxed whitespace-pre"
      style={{ maxHeight }}
    >
      <JsonNode data={data} />
    </div>
  );
}
