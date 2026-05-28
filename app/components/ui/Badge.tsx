"use client";

export function Badge({
  children,
  color,
  className = "",
}: {
  children: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`badge ${className}`}
      style={color ? { backgroundColor: color, color: "#fff" } : undefined}
    >
      {children}
    </span>
  );
}
