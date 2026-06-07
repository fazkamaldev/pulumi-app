import { NavLink, Outlet } from "react-router-dom";
import Footer from "./Footer";
import Icon from "./Icon";

export default function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <NavLink
            className="navbar-brand d-flex align-items-center gap-2"
            to="/"
          >
            <Icon size={28} title="Pulumi App" />
            Pulumi App
          </NavLink>
          <div className="navbar-nav">
            <NavLink className="nav-link" to="/">
              Home
            </NavLink>
            <NavLink className="nav-link" to="/settings">
              Settings
            </NavLink>
            <NavLink className="nav-link" to="/cars">
              Cars
            </NavLink>
          </div>
        </div>
      </nav>
      <main className="container flex-grow-1 pb-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
