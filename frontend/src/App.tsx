import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CarsPage from "./pages/CarsPage";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="cars" element={<CarsPage />} />
      </Route>
    </Routes>
  );
}
