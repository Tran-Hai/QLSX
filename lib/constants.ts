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

/** Maps installation item IDs to the production item ID that supplies the physical good for kho check.
 *  Items not listed (e.g. purchased hàng mua ngoài) have no production counterpart. */
export const KHO_INST_MAP: Record<string, string> = {
  lap_nhom_xingfa: "nhom_xingfa",
  lap_cua_nhom_ranh_c: "nhom_ranh_c",
  lap_tu_bep: "tu_bep_tu_quan_ao",
  lap_vach_kinh_mat_dung: "vach_kinh_mat_dung",
};

export const ROLES: Record<string, { label: string; short: string }> = {
  kt: { label: "\u{1F477} K\u1EF9 thu\u1EADt", short: "KT" },
  tssx: { label: "\u{1F527} T\u1ED5 tr\u01B0\u1EDFng SX", short: "TT-SX" },
  tsld: { label: "\u{1F528} T\u1ED5 tr\u01B0\u1EDFng L\u0110", short: "TT-L\u0110" },
  cn: { label: "\u{1F464} C\u00F4ng nh\u00E2n", short: "CN" },
};

export interface TaskTypeDef {
  id: string; label: string; icon: string; dept: string;
}

export const TASK_TYPES: TaskTypeDef[] = [
  // Kỹ thuật
  { id: "khao_sat", label: "Khảo sát công trình", icon: "\u{1FA9B}", dept: "kt" },
  { id: "boc_khoi_luong", label: "Bóc khối lượng vật tư", icon: "\u{1F4CA}", dept: "kt" },
  { id: "lap_du_toan", label: "Lập dự toán công trình", icon: "\u{1F4B9}", dept: "kt" },
  { id: "lap_bang_bao_gia", label: "Lập bảng báo giá", icon: "\u{1F4B0}", dept: "kt" },
  { id: "ra_ban_ve", label: "Ra bản vẽ công trình", icon: "\u{1F4D0}", dept: "kt" },
  { id: "dat_hang", label: "Đặt hàng vật tư", icon: "\u{1F4E6}", dept: "kt" },
  { id: "trien_khai_sx", label: "Triển khai sản xuất", icon: "\u{1F680}", dept: "kt" },
  { id: "kiem_tra_sx", label: "Kiểm tra sản xuất", icon: "\u{1F50D}", dept: "kt" },
  { id: "kiem_tra_ld", label: "Kiểm tra lắp đặt", icon: "\u{1F50E}", dept: "kt" },
  { id: "ban_giao_mat_bang", label: "Bàn giao mặt bằng lắp đặt", icon: "\u{1F3D7}\uFE0F", dept: "kt" },
  { id: "lam_viec_hien_truong", label: "Làm việc hiện trường với CĐT", icon: "\u{1F3E0}", dept: "kt" },
  { id: "lap_ho_so_hoan_cong", label: "Lập hồ sơ hoàn công", icon: "\u{1F4C1}", dept: "kt" },
  { id: "quan_ly_bao_hanh", label: "Quản lý bảo hành", icon: "\u{1F6E1}\uFE0F", dept: "kt" },
  // Kinh doanh
  { id: "tiep_can_khach", label: "Tiếp cận / gặp khách hàng", icon: "\u{1F91D}", dept: "kd" },
  { id: "thuong_luong_gia", label: "Thương lượng / đàm phán giá", icon: "\u{1F4AC}", dept: "kd" },
  { id: "chot_hop_dong", label: "Chốt hợp đồng", icon: "\u{270D}\uFE0F", dept: "kd" },
  { id: "cham_soc_khach", label: "Chăm sóc khách hàng sau bàn giao", icon: "\u{2B50}", dept: "kd" },
  // Sản xuất
  { id: "tong_hop_kl_sx", label: "Tổng hợp KL sản xuất trong ngày", icon: "\u{1F4CB}", dept: "sx" },
  { id: "xuat_nhap_kho", label: "Xuất nhập kho vật tư", icon: "\u{1F4E5}", dept: "sx" },
  // Lắp đặt
  { id: "tong_hop_kl_ld", label: "Tổng hợp KL lắp đặt trong ngày", icon: "\u{1F4CB}", dept: "ld" },
  { id: "van_chuyen_hang", label: "Vận chuyển hàng lên công trình", icon: "\u{1F69B}", dept: "ld" },
  // Kế toán
  { id: "ho_so_nghiem_thu", label: "Hồ sơ nghiệm thu / thanh toán", icon: "\u{1F4C4}", dept: "ke_toan" },
  { id: "theo_doi_cong_no", label: "Theo dõi công nợ", icon: "\u{1F4B3}", dept: "ke_toan" },
  { id: "quyet_toan", label: "Quyết toán công trình", icon: "\u{1F9FE}", dept: "ke_toan" },
  // Quản lý
  { id: "nhap_so_lieu", label: "Nhập số liệu file quản lý", icon: "\u{1F4BB}", dept: "ql" },
  { id: "bao_cao_tien_do", label: "Báo cáo tiến độ tuần / tháng", icon: "\u{1F4C8}", dept: "ql" },
  { id: "hop_noi_bo", label: "Họp nội bộ dự án", icon: "\u{1F91D}", dept: "ql" },
  { id: "khac", label: "Công việc khác", icon: "\u{1F4CC}", dept: "ql" },
];

export const TASK_DEPT_GROUPS = [
  { id: "kt", label: "Kỹ thuật" },
  { id: "kd", label: "Kinh doanh" },
  { id: "sx", label: "Sản xuất" },
  { id: "ld", label: "Lắp đặt" },
  { id: "ke_toan", label: "Kế toán" },
  { id: "ql", label: "Quản lý" },
];

export function getTaskTypeByDept(dept: string) {
  return TASK_TYPES.filter(t => t.dept === dept);
}

export const PRIO: Record<string, { l: string; c: string; dot: string }> = {
  normal: { l: "Bình thường", c: "var(--blue)", dot: "\u{1F535}" },
  high: { l: "Ưu tiên cao", c: "var(--red)", dot: "\u{1F534}" },
  low: { l: "Thấp", c: "var(--green)", dot: "\u{1F7E2}" },
};

export const DEPARTMENTS = [
  { id: "kt", label: "Kỹ thuật" },
  { id: "kd", label: "Kinh doanh" },
  { id: "sx", label: "Sản xuất" },
  { id: "ld", label: "Lắp đặt" },
  { id: "ke_toan", label: "Kế toán" },
  { id: "ql", label: "Quản lý" },
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
  activity_log: "Nh\u1EADt k\u00FD",
};

export const TABLE_WHITELIST = [
  "projects", "prod_logs", "inst_logs", "kho_entries",
  "staff", "tasks", "cong_nhat", "leaves", "app_settings",
  "activity_logs", "purchase_orders",
] as const;

export type TableName = typeof TABLE_WHITELIST[number];

export const TABLE_KEY_MAP: Record<string, string> = {
  prod_logs: "prodLogs",
  inst_logs: "instLogs",
  kho_entries: "khoEntries",
  cong_nhat: "congNhat",
  app_settings: "appSettings",
  activity_logs: "activityLogs",
  purchase_orders: "purchaseOrders",
};
