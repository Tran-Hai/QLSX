export const PN = [
  { id: "ong", label: "Ống", unit: "cuộn" },
  { id: "day", label: "Dây", unit: "cuộn" },
  { id: "ke", label: "Kệ", unit: "bộ" },
  { id: "thung", label: "Thùng", unit: "cái" },
  { id: "bulon", label: "Bu lông", unit: "bộ" },
  { id: "phu_kien", label: "Phụ kiện", unit: "bộ" },
  { id: "noi", label: "Nối ống", unit: "cái" },
  { id: "ke_noi", label: "Kệ nối", unit: "cái" },
];
export const LN = PN;

export const ROLES: Record<string, { label: string; short: string }> = {
  kt: { label: "\u{1F477} K\u1EF9 thu\u1EADt", short: "KT" },
  tssx: { label: "\u{1F527} T\u1ED5 tr\u01B0\u1EDFng SX", short: "TT-SX" },
  tsld: { label: "\u{1F528} T\u1ED5 tr\u01B0\u1EDFng L\u0110", short: "TT-L\u0110" },
  cn: { label: "\u{1F464} C\u00F4ng nh\u00E2n", short: "CN" },
};

export const TASK_TYPES = [
  { id: "nghiem_thu", label: "\u{1F4CB} Nghi\u1EC7m thu" },
  { id: "kiem_tra", label: "\u{1F50D} Ki\u1EC3m tra" },
  { id: "bao_tri", label: "\u{1F527} B\u1EA3o tr\u00EC" },
  { id: "hop", label: "\u{1F4C5} H\u1ECDp" },
  { id: "khac", label: "\u{1F4CC} Kh\u00E1c" },
];

export const PRIO: Record<string, { l: string; c: string }> = {
  urgent: { l: "Kh\u1EA9n", c: "var(--red)" },
  high: { l: "Cao", c: "var(--warn)" },
  normal: { l: "Th\u01B0\u1EDDng", c: "var(--green)" },
  low: { l: "Th\u1EA5p", c: "var(--t3)" },
};

export const DEPARTMENTS = [
  { id: "ql", label: "Qu\u1EA3n l\u00FD" },
  { id: "kt", label: "K\u1EF9 thu\u1EADt" },
  { id: "sx", label: "S\u1EA3n xu\u1EA5t" },
  { id: "ld", label: "L\u1EAFp \u0111\u1EB7t" },
];

export const TAB_NAMES: Record<string, string> = {
  dashboard: "T\u1ED5ng quan",
  projects: "C\u00F4ng tr\u00ECnh",
  staff: "Nh\u00E2n s\u1EF1",
  tasks: "C\u00F4ng t\u00E1c",
  calendar: "L\u1ECBch KH",
  report: "B\u00E1o c\u00E1o",
  production: "S\u1EA3n xu\u1EA5t",
  warehouse: "Kho",
  daily_labor: "C\u00F4ng nh\u1EADt",
  installation: "L\u1EAFp \u0111\u1EB7t",
  weekly_plan: "KH tu\u1EA7n",
  sync: "\u0110\u1ED3ng b\u1ED9",
};

export const TABLE_WHITELIST = [
  "projects", "prod_logs", "inst_logs", "kho_entries",
  "staff", "tasks", "cong_nhat", "leaves", "app_settings",
] as const;

export type TableName = typeof TABLE_WHITELIST[number];
