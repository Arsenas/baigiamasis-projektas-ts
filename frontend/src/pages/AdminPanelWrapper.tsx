import React from "react";
import { Navigate } from "react-router-dom";
import mainStore from "../store/mainStore";
import AdminPanel from "./AdminPanel";

const AdminPanelWrapper: React.FC = () => {
  const { currentUser } = mainStore();

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <AdminPanel />;
};

export default AdminPanelWrapper;
