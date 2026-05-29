"use client";

import { ReactNode, SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children?: ReactNode;
}

export function Select({ className = "", children, style, ...rest }: SelectProps) {
  return (
    <select
      className={`cs-native ${className}`}
      style={{
        width: "100%",
        padding: "6px 14px",
        borderRadius: 20,
        border: "1px solid var(--hover)",
        background: "rgba(0,0,0,0.03)",
        color: "var(--t2)",
        fontSize: 13,
        cursor: "pointer",
        transition: "var(--transition)",
        whiteSpace: "nowrap",
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "10px 6px",
        paddingRight: 32,
        ...style,
      }}
      {...rest}
    >
      {children}
    </select>
  );
}
