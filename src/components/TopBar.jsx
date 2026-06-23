export default function TopBar() {
  return (
    <header
      style={{
        height: 70,
        background: "#fff",
        borderBottom:
          "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        padding: "0 24px",
      }}
    >
      <h2>Admin Portal</h2>

      <div>
        Welcome Admin
      </div>
    </header>
  );
}