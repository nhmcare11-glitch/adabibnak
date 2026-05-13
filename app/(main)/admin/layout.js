import { verifyAdmin } from "@/actions/admin";
import { redirect } from "next/navigation";
import { ShieldCheck, Activity, Sparkles } from "lucide-react";

export const metadata = {
  title: "لوحة الأدمين - عدبيبنك",
  description: "إدارة الأطباء والمرضى وإعدادات المنصة - لوحة تحكم احترافية",
};

export default async function AdminLayout({ children }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/onboarding");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .admin-shell {
          min-height: 100vh;
          background: #0a0e1a;
          background-image: 
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(76,130,250,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(168,85,247,0.12) 0%, transparent 60%),
            repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 2px, transparent 2px, transparent 8px);
          font-family: 'Cairo', sans-serif;
          direction: rtl;
        }
        
        .admin-topbar {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(5, 10, 25, 0.75);
          backdrop-filter: blur(16px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .admin-topbar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-icon-wrapper {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #4c82fa, #a855f7);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(76,130,250,0.3);
        }
        
        .admin-topbar-logo span {
          font-size: 1.25rem;
          font-weight: 800;
          background: linear-gradient(135deg, #ffffff, #a855f7, #4c82fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: shimmer 3s ease infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .admin-topbar-badge {
          font-size: 0.7rem;
          padding: 4px 14px;
          border-radius: 99px;
          background: linear-gradient(135deg, rgba(76,130,250,0.15), rgba(168,85,247,0.15));
          color: #a78bfa;
          border: 1px solid rgba(167,139,250,0.3);
          font-weight: 600;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .admin-topbar-stats {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        
        .topbar-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        
        .topbar-stat-value {
          font-weight: 700;
          color: white;
          background: rgba(255,255,255,0.1);
          padding: 2px 8px;
          border-radius: 20px;
        }
        
        .admin-body {
          display: flex;
          min-height: calc(100vh - 64px);
        }
        
        .admin-content {
          flex: 1;
          overflow-y: auto;
        }
        
        /* Custom Scrollbar */
        .admin-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .admin-content::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        
        .admin-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #4c82fa, #a855f7);
          border-radius: 10px;
        }
        
        /* Loading animation */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10,14,26,0.95);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeOut 0.3s ease 0.5s forwards;
        }
        
        @keyframes fadeOut {
          to { opacity: 0; visibility: hidden; }
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(76,130,250,0.2);
          border-top: 3px solid #4c82fa;
          border-right: 3px solid #a855f7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="admin-shell">
        <div className="admin-topbar">
          <div className="admin-topbar-logo">
            <div className="logo-icon-wrapper">
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <span>عدبيبنك</span>
          </div>
          <div className="admin-topbar-stats">
            <div className="topbar-stat">
              <Activity size={12} />
              <span>النظام نشط</span>
              <span className="topbar-stat-value">● مباشر</span>
            </div>
            <div className="admin-topbar-badge">
              <Sparkles size={12} />
              لوحة الأدمين
            </div>
          </div>
        </div>
        <div className="admin-body">
          <div className="admin-content">
            {children}
          </div>
        </div>
        
      
      </div>
    </>
  );
}