"use client";

import { SelectHTMLAttributes } from "react";

export function Select({
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`sel ${className}`} {...props}>
      {children}
    </select>
  );
}
