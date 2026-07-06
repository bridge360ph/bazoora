import type { CSSProperties } from "react";

/* ---------------- PAGE SHELL ---------------- */
export const layout: CSSProperties = {
  display: "flex",
  height: "100vh",
  background: "#f3f6f4",
  fontFamily: "Inter, sans-serif",
  position: "relative",
};

export const mainWrap: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  overflowY: "auto",
};

export const content: CSSProperties = {
  padding: 18,
};

/* ---------------- SIDEBAR ---------------- */
export const sidebar: CSSProperties = {
  width: 230,
  background: "#0f2a1f",
  color: "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: 14,
};

export const logo: CSSProperties = { marginBottom: 10 };

export const navItem: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 8px",
  fontSize: 13,
  opacity: 0.65,
  borderRadius: 10,
  cursor: "pointer",
};

export const navItemActive: CSSProperties = {
  ...navItem,
  opacity: 1,
  fontWeight: 700,
  background: "rgba(255,255,255,0.1)",
};

export const sidebarBottom: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  paddingTop: 14,
  borderTop: "1px solid rgba(255,255,255,0.1)",
};

export const avatar: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "#e0983f",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 13,
  flexShrink: 0,
};

export const drawerBackdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  zIndex: 30,
};

export const drawerPanel: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: 230,
  background: "#0f2a1f",
  color: "white",
  padding: 14,
  zIndex: 31,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

/* ---------------- HEADER ---------------- */
export const header: CSSProperties = {
  height: 60,
  background: "#0f2a1f",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 18px",
  flexShrink: 0,
};

export const leftHeader: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
};

export const headerTitle: CSSProperties = {
  flex: 1,
  textAlign: "center",
  fontWeight: 800,
};

export const rightHeader: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 12,
};

export const bellWrap: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.12)",
};

export const topAvatar: CSSProperties = avatar;

/* ---------------- BOTTOM NAV (mobile) ---------------- */
export const bottomNav: CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  height: 64,
  background: "#0f2a1f",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  zIndex: 20,
};

export const bottomNavItem: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  color: "rgba(255,255,255,0.6)",
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
};

export const bottomNavItemActive: CSSProperties = {
  ...bottomNavItem,
  color: "#ffffff",
};

/* ---------------- FAB (mobile — Messages + Profile) ---------------- */
export const fabWrap: CSSProperties = {
  position: "fixed",
  left: 18,
  bottom: 84,
  zIndex: 25,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

export const fabActions: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 10,
  marginBottom: 12,
};

export const fabActionBtn: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#fff",
  color: "#0f2a1f",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 700,
  boxShadow: "0 6px 16px rgba(0,0,0,0.14)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const fabMain: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 18,
  background: "#0f2a1f",
  color: "#fff",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 20px rgba(0,0,0,0.28)",
  cursor: "pointer",
};

/* ---------------- GENERIC CARD SHELLS (reusable stat cards) ---------------- */
export const topCards: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12,
  marginBottom: 16,
};

export const topCardsMobile: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginBottom: 16,
};

export const smallCard: CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: 14,
  border: "1px solid #e5e7eb",
  minWidth: 0,
};

export const smallCardRow: CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: 14,
  border: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  minWidth: 0,
};

export const smallLabel: CSSProperties = {
  fontSize: 12,
  opacity: 0.6,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const smallValue: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
};

export const rowBetween: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
};

export const pillOrangeSmall: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  background: "#ffedd5",
  color: "#9a3412",
  padding: "4px 10px",
  borderRadius: 999,
  flexShrink: 0,
};

export const pillGreenSmall: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  background: "#dcfce7",
  color: "#166534",
  padding: "4px 10px",
  borderRadius: 999,
  flexShrink: 0,
};
