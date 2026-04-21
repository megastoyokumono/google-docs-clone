import { Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/documents/:documentId" element={<EditorPage />} />
    </Routes>
  );
}
