"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "danger" | "ghost" | "success";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
}) {
  const base = "btn";
  const v = `btn-${variant === "primary" ? "p" : variant === "danger" ? "d" : variant === "success" ? "g" : "ghost"}`;
  const s = size === "sm" ? "btn-sm" : "";
  return (
    <button className={`${base} ${v} ${s} ${className}`} {...props}>
      {children}
    </button>
  );
}
