import React from "react";

function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <h3>⚙️ Smart Energy AI</h3>
      <button onClick={onLogout} className="logout-btn">
        Logout
      </button>
    </nav>
  );
}

export default Navbar;
