import AppErrorBoundary from "./components/common/AppErrorBoundary";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AppErrorBoundary>
      <AppRoutes />
    </AppErrorBoundary>
  );
}
