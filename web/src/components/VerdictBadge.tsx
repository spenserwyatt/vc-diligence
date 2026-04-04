"use client";

const colorMap: Record<string, string> = {
  red: "bg-vc-red text-white",
  green: "bg-vc-green text-white",
  amber: "bg-vc-amber text-white",
};

export function VerdictBadge({
  verdict,
  color,
  size = "md",
}: {
  verdict: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }[size];

  return (
    <span
      className={`inline-block font-bold rounded ${sizeClass} ${colorMap[color] || "bg-gray-400 text-white"}`}
    >
      {verdict}
    </span>
  );
}
