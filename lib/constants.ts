export interface ItemDef {
  id: string;
  label: string;
  unit: string;
  dailyOutput: number;
  personnel: number;
  category: "sx" | "ld";
}

export const PROD_ITEMS: ItemDef[] = [
  { id: "nhom_xingfa", label: "Nhôm Xingfa, Nhôm hệ 55 vát cạnh, nhôm Topal Prima", unit: "m2", dailyOutput: 45, personnel: 6, category: "sx" },
  { id: "vach_kinh_mat_dung", label: "Vách kính hệ mặt dựng", unit: "m2", dailyOutput: 60, personnel: 6, category: "sx" },
  { id: "nhom_ranh_c", label: "Nhôm rãnh C", unit: "m2", dailyOutput: 40, personnel: 6, category: "sx" },
  { id: "cua_nhom_thuy_luc", label: "Cửa nhôm thủy lực", unit: "bộ", dailyOutput: 1, personnel: 2, category: "sx" },
  { id: "tu_bep_tu_quan_ao", label: "Tủ bếp, tủ quần áo", unit: "mét", dailyOutput: 4, personnel: 2, category: "sx" },
  { id: "canh_tu_tran", label: "Cánh tủ trạn", unit: "m2", dailyOutput: 25, personnel: 2, category: "sx" },
  { id: "tu_bep_nhom_noi_that", label: "Tủ bếp nhôm nội thất", unit: "m2", dailyOutput: 4, personnel: 2, category: "sx" },
  { id: "cua_nhom_truot_quay", label: "Cửa nhôm hệ trượt quay", unit: "m2", dailyOutput: 10, personnel: 2, category: "sx" },
  { id: "cua_nhom_slim", label: "Cửa nhôm hệ Slim", unit: "m2", dailyOutput: 10, personnel: 2, category: "sx" },
  { id: "cua_nhom_xep_truot", label: "Cửa nhôm hệ xếp trượt", unit: "m2", dailyOutput: 10, personnel: 2, category: "sx" },
];

export const INST_ITEMS: ItemDef[] = [
  { id: "lap_nhom_xingfa", label: "Lắp đặt nhôm Xingfa, nhôm hệ 55 vát cạnh, nhôm topal prima", unit: "m2", dailyOutput: 50, personnel: 5, category: "ld" },
  { id: "lap_cua_nhom_ranh_c", label: "Lắp đặt cửa nhôm rãnh C", unit: "m2", dailyOutput: 45, personnel: 5, category: "ld" },
  { id: "cua_go_nhua", label: "Cửa gỗ nhựa", unit: "bộ", dailyOutput: 5, personnel: 5, category: "ld" },
  { id: "cua_kinh_thuy_luc", label: "Cửa kính thủy lực", unit: "bộ", dailyOutput: 1, personnel: 2, category: "ld" },
  { id: "cua_kinh_truot", label: "Cửa kính trượt", unit: "bộ", dailyOutput: 1, personnel: 2, category: "ld" },
  { id: "vach_compact", label: "Vách compact", unit: "m2", dailyOutput: 50, personnel: 5, category: "ld" },
  { id: "vach_kinh_cuong_luc", label: "Vách kính cường lực", unit: "m2", dailyOutput: 50, personnel: 5, category: "ld" },
  { id: "lap_tran_san", label: "Lắp đặt trần, sàn", unit: "m2", dailyOutput: 60, personnel: 5, category: "ld" },
  { id: "lap_cua_cuon", label: "Lắp đặt Cửa cuốn", unit: "bộ", dailyOutput: 2, personnel: 5, category: "ld" },
  { id: "lap_tu_bep", label: "Lắp đặt tủ bếp", unit: "mét", dailyOutput: 10, personnel: 3, category: "ld" },
  { id: "lap_hop_ky_thuat_cua_cuon", label: "Lắp đặt hộp kỹ thuật cửa cuốn", unit: "bộ", dailyOutput: 1, personnel: 2, category: "ld" },
  { id: "lap_vach_kinh_mat_dung", label: "Lắp đặt vách kính hệ mặt dựng", unit: "m2", dailyOutput: 50, personnel: 5, category: "ld" },
  { id: "lap_cua_kinh_tu_dong", label: "Lắp đặt cửa kính tự động", unit: "bộ", dailyOutput: 1, personnel: 3, category: "ld" },
  { id: "lap_cabin_tam_kinh", label: "Lắp đặt cabin tắm kính", unit: "m2", dailyOutput: 40, personnel: 5, category: "ld" },
];

export const ALL_ITEMS = [...PROD_ITEMS, ...INST_ITEMS];

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
};

export const TABLE_WHITELIST = [
  "projects", "prod_logs", "inst_logs", "kho_entries",
  "staff", "tasks", "cong_nhat", "leaves", "app_settings",
] as const;

export type TableName = typeof TABLE_WHITELIST[number];

export const TABLE_KEY_MAP: Record<string, string> = {
  prod_logs: "prodLogs",
  inst_logs: "instLogs",
  kho_entries: "khoEntries",
  cong_nhat: "congNhat",
  app_settings: "appSettings",
};
