import { useState, type CSSProperties } from "react";

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

function TruckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 20, height: 20 }}
    >
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 18, height: 18 }}
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 18, height: 18 }}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 18, height: 18 }}
    >
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 18, height: 18 }}
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 18, height: 18 }}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 18, height: 18 }}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 18, height: 18 }}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 18, height: 18 }}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 20, height: 20 }}
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ width: 18, height: 18 }}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function availabilityStyle(availability: EcoAideAvailability): CSSProperties {
  const baseStyle: CSSProperties = {
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 500,
  };

  if (availability === "Available") {
    return {
      ...baseStyle,
      color: "#166534",
      background: "#dcfce7",
    };
  }

  if (availability === "On Route") {
    return {
      ...baseStyle,
      color: "#92400e",
      background: "#fef3c7",
    };
  }

  return {
    ...baseStyle,
    color: "#6b7280",
    background: "#f3f4f6",
  };
}

export function EcoAideDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  const navItems = [
    { label: "Dashboard", icon: <GridIcon /> },
    { label: "Eco-Aide Management", icon: <UserIcon /> },
    { label: "Fleet Management", icon: <CarIcon /> },
    { label: "Route Management", icon: <MapIcon /> },
    { label: "Hauling Request Management", icon: <ClipboardIcon /> },
    { label: "Analytics", icon: <BarChartIcon /> },
    { label: "Notifications", icon: <BellIcon /> },
    { label: "Settings and System Configuration", icon: <SettingsIcon /> },
  ];

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
              color: "#fff",
            }}
          >
            <TruckIcon />
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
          {navItems.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label);
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
                  activeNav === label ? "rgba(255,255,255,0.12)" : "transparent",
                color:
                  activeNav === label ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 12.5,
                fontWeight: activeNav === label ? 600 : 400,
                textAlign: "left",
                borderLeft:
                  activeNav === label
                    ? "3px solid #4ade80"
                    : "3px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {icon}
              <span style={{ lineHeight: 1.3 }}>{label}</span>
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
                color: "#fff",
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
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              padding: 2,
            }}
          >
            <SettingsIcon />
          </button>
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
            background: "#fff",
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
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                display: "flex",
              }}
            >
              <MenuIcon />
            </button>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Dashboard</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                display: "flex",
                position: "relative",
              }}
            >
              <BellIcon />
              <span
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  background: "#ef4444",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "1.5px solid #fff",
                }}
              />
            </button>
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

        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <section style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 14,
                color: "#111",
              }}
            >
              Summary statistics
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 14,
              }}
            >
              {[
                { label: "Total Eco-Aides", value: "200" },
                { label: "Completed Pickups", value: "32" },
                { label: "Pending Requests", value: "12" },
                { label: "Revenue (Paid Services)", value: "200" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: "18px 20px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "#6b7280",
                      marginBottom: 6,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#111",
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              marginBottom: 24,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 14,
                  color: "#111",
                }}
              >
                Quick Status
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                {[
                  { label: "Active Pickups", value: "8" },
                  { label: "Unassigned Requests", value: "5" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      padding: "18px 20px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: "#111",
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </div>
                  </div>
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
                  color: "#fff",
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
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    Route Status Today
                  </span>
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "#fff",
                      padding: "2px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 11.5,
                    }}
                  >
                    View All
                  </button>
                </div>

                {[
                  { label: "In Progress", value: 3 },
                  { label: "Not Started", value: 4 },
                  { label: "Completed Today", value: 10 },
                  { label: "Total Routes", value: 17 },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <BoxIcon />
                    <span
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      {label}: <strong>{value}</strong>
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
                color: "#111",
              }}
            >
              Overview
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    Eco-Aide Availability
                  </span>
                  <button
                    type="button"
                    style={{
                      background: "#1a3a2e",
                      color: "#fff",
                      border: "none",
                      padding: "4px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 11.5,
                      fontWeight: 500,
                    }}
                  >
                    View All
                  </button>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#1a3a2e" }}>
                      {["Eco-Aide ID", "Eco-Aide", "Availability"].map(
                        (heading) => (
                          <th
                            key={heading}
                            style={{
                              padding: "9px 14px",
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: 12.5,
                              textAlign: "left",
                            }}
                          >
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
                          background: index % 2 === 0 ? "#fff" : "#f9fafb",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <td
                          style={{
                            padding: "9px 14px",
                            fontSize: 13,
                            color: "#374151",
                          }}
                        >
                          {ecoAide.id}
                        </td>
                        <td
                          style={{
                            padding: "9px 14px",
                            fontSize: 13,
                            color: "#374151",
                          }}
                        >
                          {ecoAide.name}
                        </td>
                        <td style={{ padding: "9px 14px" }}>
                          <span style={availabilityStyle(ecoAide.availability)}>
                            {ecoAide.availability}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ textAlign: "center", color: "#9ca3af" }}>
                  <BarChartIcon />
                  <p style={{ fontSize: 13, marginTop: 8 }}>
                    Analytics chart coming soon
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  Request Queue (On-Demand Request)
                </span>
                <button
                  type="button"
                  style={{
                    background: "#1a3a2e",
                    color: "#fff",
                    border: "none",
                    padding: "4px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  View All
                </button>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#1a3a2e" }}>
                    {[
                      "Request ID",
                      "Location",
                      "Waste Type",
                      "Status",
                      "Eco-Aide",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "9px 14px",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 12.5,
                          textAlign: "left",
                        }}
                      >
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
                        background: index % 2 === 0 ? "#fff" : "#f9fafb",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <td
                        style={{
                          padding: "9px 14px",
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        {request.id}
                      </td>
                      <td
                        style={{
                          padding: "9px 14px",
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        {request.location}
                      </td>
                      <td
                        style={{
                          padding: "9px 14px",
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        {request.wasteType}
                      </td>
                      <td style={{ padding: "9px 14px" }}>
                        <span
                          style={{
                            color: "#92400e",
                            background: "#fef3c7",
                            padding: "2px 10px",
                            borderRadius: 12,
                            fontSize: 12.5,
                            fontWeight: 500,
                          }}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "9px 14px",
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        {request.ecoAide}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}