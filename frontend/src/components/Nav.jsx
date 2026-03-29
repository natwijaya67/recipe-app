import { NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>🥘 Cookmark</div>
      <div style={styles.links}>
        {/* <NavLink to="/" style={({ isActive }) => ({
          ...styles.link,
          ...(isActive ? styles.linkActive : {})
        })}>
          Parse recipe
        </NavLink> */}
        <NavLink to="/" style={({ isActive }) => ({
          ...styles.link,
          ...(isActive ? styles.linkActive : {})
        })}>
          Collection
        </NavLink>
        <NavLink to="/GroceryList" style={({ isActive }) => ({
          ...styles.link,
          ...(isActive ? styles.linkActive : {})
        })}>
          Grocery List
        </NavLink>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", height: "52px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fff",
  },
  logo: { fontSize: "15px", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" },
  links: { display: "flex", gap: "4px" },
  link: {
    fontSize: "13px", color: "#6b7280", padding: "6px 12px",
    borderRadius: "6px", textDecoration: "none", transition: "all 0.15s",
  },
  linkActive: { background: "#f3f4f6", color: "#111827", fontWeight: "500" },
};