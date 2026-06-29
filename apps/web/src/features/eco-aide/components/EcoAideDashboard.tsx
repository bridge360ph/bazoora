import { HaulingRequestManagementPage } from "../../hauling-requests/components/HaulingRequestManagementPage";
import { RouteManagementPage } from "../../route-management/components/RouteManagementPage";
import { FleetManagementPage } from "../../fleet-management/components/FleetManagementPage";
import { useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "../../../components/Button";
import { StatCard } from "../../../components/StatCard";
import { StatusBadge } from "../../../components/StatusBadge";
import { EcoAideManagementPage } from "../../eco-aides/components/EcoAideManagementPage";

type EcoAideAvailability = "Available" | "On Route" | "Off Duty";
type RequestStatus = "Pending" | "Assigned" | "Completed";

interface EcoAide {
  id: string;
  name: string;
  availability: EcoAideAvailability;
}

interface RequestItem {
  id: string;
  location: string;
  wasteType: string;
  status: RequestStatus;
  ecoAide: string;
}

const ecoAides: EcoAide[] = [
  { id: "EA-001", name: "John Mendoza", availability: "Available" },
  { id: "EA-002", name: "Emil Perez", availability: "On Route" },
  { id: "EA-003", name: "Ferdinand Ramos", availability: "Available" },
  { id: "EA-004", name: "Mark Santiago", availability: "Off Duty" },
  { id: "EA-005", name: "Romy Rosario", availability: "On Route" },
];

const requestQueue: RequestItem[] = [
  {
    id: "Req-001",
    location: "San Juan",
    wasteType: "Recyclable",
    status: "Pending",
    ecoAide: "-",
  },
  {
    id: "Req-002",
    location: "San Pedro",
    wasteType: "Regular/Non-Recyclable",
    status: "Pending",
    ecoAide: "John Mendoza",
  },
  {
    id: "Req-003",
    location: "San Mateo",
    wasteType: "Regular/Non-Recyclable",
    status: "Pending",
    ecoAide: "Emil Flores",
  },
  {
    id: "Req-004",
    location: "Poblacion",
    wasteType: "Recyclable",
    status: "Pending",
    ecoAide: "-",
  },
];

const navItems = [
  { label: "Dashboard", icon: "▦" },
  { label: "Eco-Aide Management", icon: "◉" },
  { label: "Fleet Management", icon: "▣" },
  { label: "Route Management", icon: "◇" },
  { label: "Hauling Request Management", icon: "▤" },
  { label: "Analytics", icon: "▥" },
  { label: "Notifications", icon: "●" },
  { label: "Settings and System Configuration", icon: "⚙" },
];

const summaryStats = [
  { label: "Total Eco-Aides", value: "200" },
  { label: "Completed Pickups", value: "32" },
  { label: "Pending Requests", value: "12" },
  { label: "Revenue (Paid Services)", value: "200" },
];

const quickStats = [
  { label: "Active Pickups", value: "8" },
  { label: "Unassigned Requests", value: "5" },
];

const routeStats = [
  { label: "In Progress", value: 3 },
  { label: "Not Started", value: 4 },
  { label: "Completed Today", value: 10 },
  { label: "Total Routes", value: 17 },
];

export function EcoAideDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  const isEcoAideManagementPage = activeNav === "Eco-Aide Management";
  const isFleetManagementPage = activeNav === "Fleet Management";
  const isRouteManagementPage = activeNav === "Route Management";
  const isHaulingRequestManagementPage =
  activeNav === "Hauling Request Management";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: "#f5f5f5",
        color: "#1a1a1a",
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          width: 190,
          background: "#1a3a2e",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "20px 16px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#ffffff",
            }}
          >
            <span style={{ fontSize: 20 }}>▣</span>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: 1,
                  lineHeight: 1.1,
                }}
              >
                BAZOORA
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Hauling Admin
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "10px 0" }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setActiveNav(item.label);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 16px",
                border: "none",
                cursor: "pointer",
                background:
                  activeNav === item.label
                    ? "rgba(255,255,255,0.12)"
                    : "transparent",
                color:
                  activeNav === item.label
                    ? "#ffffff"
                    : "rgba(255,255,255,0.6)",
                fontSize: 12.5,
                fontWeight: activeNav === item.label ? 600 : 400,
                textAlign: "left",
                borderLeft:
                  activeNav === item.label
                    ? "3px solid #4ade80"
                    : "3px solid transparent",
              }}
            >
              <span style={{ width: 18 }}>{item.icon}</span>
              <span style={{ lineHeight: 1.3 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div
          style={{
            padding: "12px 14px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#4ade80",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
              color: "#1a3a2e",
              flexShrink: 0,
            }}
          >
            JD
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: "#ffffff",
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              John Doe
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 10.5,
              }}
            >
              Unit #4029
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            style={{
              color: "rgba(255,255,255,0.5)",
              padding: 2,
            }}
          >
            ⚙
          </Button>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            padding: "0 24px",
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              variant="ghost"
              size="sm"
              style={{
                fontSize: 18,
                padding: 0,
              }}
            >
              ≡
            </Button>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{activeNav}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Button
              variant="ghost"
              size="sm"
              style={{
                position: "relative",
                padding: 0,
                fontSize: 16,
              }}
            >
              ●
              <span
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  background: "#ef4444",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "1.5px solid #ffffff",
                }}
              />
            </Button>

            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#4ade80,#16a34a)",
                border: "2px solid #e5e7eb",
              }}
            />
          </div>
        </header>

        {isEcoAideManagementPage ? (
    <EcoAideManagementPage />
    ) : isFleetManagementPage ? (
   <FleetManagementPage />
    ) : isRouteManagementPage ? (
      <RouteManagementPage />
    ) : isHaulingRequestManagementPage ? (
    <HaulingRequestManagementPage />
    ) : (
          
         <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            <section style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 14,
                  color: "#111111",
                }}
              >
                Summary statistics
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 14,
                }}
              >
                {summaryStats.map((stat) => (
                  <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                  />
                ))}
              </div>
            </section>

            <section
              style={{
                marginBottom: 24,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 14,
                    color: "#111111",
                  }}
                >
                  Quick Status
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 14,
                  }}
                >
                  {quickStats.map((stat) => (
                    <StatCard
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ height: 42 }} />
                <div
                  style={{
                    background: "#1a3a2e",
                    borderRadius: 10,
                    padding: "18px 20px",
                    color: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                      gap: 12,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      Route Status Today
                    </span>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>

                  {routeStats.map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span>▦</span>
                      <span
                        style={{
                          fontSize: 13,
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        {stat.label}: <strong>{stat.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 14,
                  color: "#111111",
                }}
              >
                Overview
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 18,
                  marginBottom: 18,
                }}
              >
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      Eco-Aide Availability
                    </span>
                    <Button size="sm">View All</Button>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        minWidth: 420,
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#1a3a2e" }}>
                          {["Eco-Aide ID", "Eco-Aide", "Availability"].map(
                            (heading) => (
                              <th key={heading} style={tableHeaderStyle}>
                                {heading}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        {ecoAides.map((ecoAide, index) => (
                          <tr
                            key={ecoAide.id}
                            style={{
                              background:
                                index % 2 === 0 ? "#ffffff" : "#f9fafb",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            <td style={tableCellStyle}>{ecoAide.id}</td>
                            <td style={tableCellStyle}>{ecoAide.name}</td>
                            <td style={{ padding: "9px 14px" }}>
                              <StatusBadge status={ecoAide.availability} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div
                  style={{
                    ...cardStyle,
                    minHeight: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: 24 }}>▥</div>
                    <p style={{ fontSize: 13, marginTop: 8 }}>
                      Analytics chart coming soon
                    </p>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    Request Queue (On-Demand Request)
                  </span>
                  <Button size="sm">View All</Button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: 720,
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#1a3a2e" }}>
                        {[
                          "Request ID",
                          "Location",
                          "Waste Type",
                          "Status",
                          "Eco-Aide",
                        ].map((heading) => (
                          <th key={heading} style={tableHeaderStyle}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {requestQueue.map((request, index) => (
                        <tr
                          key={request.id}
                          style={{
                            background:
                              index % 2 === 0 ? "#ffffff" : "#f9fafb",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <td style={tableCellStyle}>{request.id}</td>
                          <td style={tableCellStyle}>{request.location}</td>
                          <td style={tableCellStyle}>{request.wasteType}</td>
                          <td style={{ padding: "9px 14px" }}>
                            <StatusBadge status={request.status} />
                          </td>
                          <td style={tableCellStyle}>{request.ecoAide}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "14px 18px",
  borderBottom: "1px solid #e5e7eb",
};

const tableHeaderStyle: CSSProperties = {
  padding: "9px 14px",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: 12.5,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tableCellStyle: CSSProperties = {
  padding: "9px 14px",
  fontSize: 13,
  color: "#374151",
  whiteSpace: "nowrap",
};