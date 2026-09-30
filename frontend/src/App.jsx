import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailyUpload from './pages/DailyUpload';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Productivity from './pages/Productivity';
import Employees from './pages/Employees';
import Analytics from './pages/Analytics';
import UploadHistory from './pages/UploadHistory';
import Settings from './pages/Settings';
import EmployeeDetailModal from './components/Common/EmployeeDetailModal';
import InstallPrompt from './components/Common/InstallPrompt';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Login />;
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleUploadSuccess = (uploadedDate) => {
    if (uploadedDate) {
      setSelectedDate(uploadedDate);
    }
    setActiveTab('dashboard');
    handleRefresh();
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation with Mobile Drawer Support */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          key={`header-${refreshKey}`}
          activeTab={activeTab}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onRefresh={handleRefresh}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8" key={`content-${selectedDate}-${refreshKey}`}>
            {activeTab === 'dashboard' && (
              <Dashboard
                selectedDate={selectedDate}
                onSelectEmployee={setSelectedEmployee}
              />
            )}
            {activeTab === 'upload' && (
              <DailyUpload onUploadSuccess={handleUploadSuccess} />
            )}
            {activeTab === 'attendance' && (
              <Attendance
                selectedDate={selectedDate}
                onSelectEmployee={setSelectedEmployee}
              />
            )}
            {activeTab === 'reports' && (
              <Reports
                selectedDate={selectedDate}
                onSelectEmployee={setSelectedEmployee}
              />
            )}
            {activeTab === 'productivity' && (
              <Productivity
                selectedDate={selectedDate}
                onSelectEmployee={setSelectedEmployee}
              />
            )}
            {activeTab === 'employees' && (
              <Employees onSelectEmployee={setSelectedEmployee} />
            )}
            {activeTab === 'analytics' && (
              <Analytics selectedDate={selectedDate} />
            )}
            {activeTab === 'history' && <UploadHistory />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </main>
      </div>

      {/* Employee Detail Slide-over / Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employeeIdentifier={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <InstallPrompt />
    </AuthProvider>
  );
}
