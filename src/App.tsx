import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { XrozenAI } from "@/components/ai/XrozenAI";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import VideoPreview from "./pages/VideoPreview";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Editors from "./pages/Editors";
import Clients from "./pages/Clients";
// Temporarily commented until migration is approved
// import Invoices from "./pages/Invoices";
import AdminUsers from "./pages/AdminUsers";
import AdminPlans from "./pages/AdminPlans";
import AdminAPI from "./pages/AdminAPI";
import AdminProjects from "./pages/AdminProjects";
import AdminPayments from "./pages/AdminPayments";
import AdminLogs from "./pages/AdminLogs";
import Settings from "./pages/Settings";
import EditorWorkSheet from "./pages/EditorWorkSheet";
import ClientWorkSheet from "./pages/ClientWorkSheet";
import XrozenAIPage from "./pages/XrozenAI";
import NotFound from "./pages/NotFound";
import SubscriptionSelect from "./pages/SubscriptionSelect";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminPlansManagement from "./pages/AdminPlansManagement";
import AdminSettings from "./pages/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/video-preview/:versionId" element={<VideoPreview />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/plans" element={<AdminPlans />} />
          <Route path="/admin/api" element={<AdminAPI />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/plans-management" element={<AdminPlansManagement />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/subscription-select" element={<SubscriptionSelect />} />
          <Route path="/editors" element={<Editors />} />
          <Route path="/editors/:editorId/worksheet" element={<EditorWorkSheet />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:clientId/worksheet" element={<ClientWorkSheet />} />
          {/* <Route path="/invoices" element={<Invoices />} /> */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/xrozen-ai" element={<XrozenAIPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <XrozenAI />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
