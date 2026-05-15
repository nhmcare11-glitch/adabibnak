"use client";

import { useState, useEffect } from "react";
import { 
  updateDoctorStatus, 
  updateDoctorActiveStatus,
  getAllUsers,
  getVisitorsAndDoctorsStats,
  getMonthlyAppointmentsStats,
  getMonthlyPatientsStats,
  getAppointmentCompletionRate,
  getPatientSatisfactionRate,
  getDoctorsPerformance,
  getSpecialtiesDistribution,
  getReports,
  getGrowthStats,
  getRecentActivities,
  createReport,
  updateReport,
  deleteReport,
} from "@/actions/admin";
import {
  getDoctorAvailabilityForAdmin,
  setDoctorAvailabilityByAdmin,
} from "@/actions/availability";
import AdminAvailabilityManager from "./AdminAvailabilityManager";
import {
  Users, AlertCircle, CheckCircle2, CalendarDays,
  Stethoscope, UserCheck, ChevronDown, Mail, Briefcase,
  Clock, FileText, X, Check, LayoutDashboard, BarChart3,
  FileBarChart, Settings, Home, TrendingUp, TrendingDown,
  Filter, Download, Plus, Shield, Activity,
  Calendar, UserPlus, Eye, User, UserCog, IdCard,
  Phone, MapPin, Calendar as CalendarIcon, Star, MessageCircle,
  Search, MoreVertical, Trash2, Edit, RefreshCw, PieChart
} from "lucide-react";

import LogoutButton from "@/components/shared/LogoutButton";


const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --bg-dark: #0a0e1a;
    --bg-card: rgba(18, 25, 45, 0.6);
    --border-glow: rgba(76, 130, 250, 0.2);
    --accent-primary: #4c82fa;
    --accent-secondary: #a855f7;
    --accent-success: #10b981;
    --accent-warning: #f59e0b;
    --accent-danger: #ef4444;
    --accent-info: #06b6d4;
    --text-primary: #ffffff;
    --text-secondary: rgba(255,255,255,0.65);
    --text-muted: rgba(255,255,255,0.35);
    --glass-bg: rgba(255,255,255,0.03);
    --glass-border: rgba(255,255,255,0.06);
  }

  .admin-root {
    font-family: 'Cairo', sans-serif;
    direction: rtl;
    background: radial-gradient(ellipse at 20% 0%, #0f172a, #020617);
    min-height: 100vh;
    color: var(--text-primary);
  }

  .top-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(16px);
    background: rgba(5, 10, 25, 0.75);
    border-bottom: 1px solid var(--glass-border);
    padding: 0 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #4c82fa, #a855f7);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-text {
    font-size: 1.2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #fff, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .nav-links {
    display: flex;
    gap: 6px;
    background: rgba(255,255,255,0.03);
    padding: 4px 8px;
    border-radius: 40px;
    border: 1px solid var(--glass-border);
    flex-wrap: wrap;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 32px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-link:hover {
    background: rgba(76, 130, 250, 0.1);
    color: white;
  }

  .nav-link.active {
    background: linear-gradient(135deg, rgba(76,130,250,0.2), rgba(168,85,247,0.2));
    color: white;
    border: 1px solid rgba(76,130,250,0.4);
  }

  .pending-count {
    background: #f59e0b;
    color: #000;
    font-size: 0.6rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 20px;
    margin-right: 4px;
  }

  .home-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--glass-border);
    border-radius: 40px;
    padding: 6px 16px;
    font-size: 0.8rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .home-btn:hover {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
  }

  .main-content {
    padding: 28px 32px;
    max-width: 1600px;
    margin: 0 auto;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 18px;
    margin-bottom: 32px;
  }

  .stat-card {
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    padding: 18px 20px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    border-color: rgba(76,130,250,0.4);
    box-shadow: 0 20px 35px -12px rgba(0,0,0,0.3);
  }

  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .stat-icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 6px;
  }

  .stat-trend {
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
  }

  .charts-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }

  .chart-card {
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    padding: 20px;
    transition: all 0.3s;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--glass-border);
    flex-wrap: wrap;
    gap: 10px;
  }

  .chart-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    height: 220px;
    padding: 10px 0;
  }

  .bar-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .bar {
    width: 100%;
    background: linear-gradient(180deg, #4c82fa, #a855f7);
    border-radius: 12px 12px 6px 6px;
    transition: height 0.5s ease;
  }

  .bar-label {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .metrics-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 18px;
    margin-bottom: 32px;
  }

  .metric-pie {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    padding: 18px;
    text-align: center;
  }

  .pie-ring {
    width: 100px;
    height: 100px;
    margin: 0 auto 12px;
    position: relative;
  }

  .ring-bg {
    stroke: rgba(255,255,255,0.1);
  }

  .ring-fill {
    stroke: url(#gradient);
    stroke-linecap: round;
    transition: stroke-dasharray 0.8s ease;
  }

  .users-table-container {
    overflow-x: auto;
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
  }

  .users-table th {
    text-align: right;
    padding: 14px 12px;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-muted);
    border-bottom: 1px solid var(--glass-border);
  }

  .users-table td {
    padding: 14px 12px;
    font-size: 0.8rem;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.75rem;
  }

  .role-badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    display: inline-block;
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    display: inline-block;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  .modal-content {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    border: 1px solid rgba(76,130,250,0.3);
    border-radius: 28px;
    width: 90%;
    max-width: 500px;
    max-height: 85vh;
    overflow-y: auto;
    padding: 24px;
    animation: slideUp 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .btn-icon {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }

  .btn-primary {
    background: linear-gradient(135deg, #4c82fa, #a855f7);
    border: none;
    padding: 8px 18px;
    border-radius: 40px;
    color: white;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    transform: scale(1.02);
    opacity: 0.9;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-outline {
    background: transparent;
    border: 1px solid var(--glass-border);
    padding: 8px 16px;
    border-radius: 40px;
    color: var(--text-secondary);
    font-size: 0.75rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
    transition: all 0.2s;
  }

  .btn-outline:hover {
    background: rgba(255,255,255,0.05);
  }

  .btn-danger {
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(239,68,68,0.3);
    color: #ef4444;
  }

  .search-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--glass-border);
    border-radius: 40px;
    padding: 8px 16px;
    color: white;
    font-family: inherit;
    width: 200px;
  }

  .search-input:focus {
    outline: none;
    border-color: #4c82fa;
  }

  .report-form-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 10px 14px;
    color: white;
    font-family: 'Cairo', sans-serif;
    font-size: 0.85rem;
    transition: border-color 0.2s;
  }

  .report-form-input:focus {
    outline: none;
    border-color: #4c82fa;
  }

  .report-textarea {
    width: 100%;
    min-height: 220px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 12px 14px;
    color: white;
    font-family: 'Cairo', sans-serif;
    font-size: 0.85rem;
    line-height: 1.8;
    resize: vertical;
    transition: border-color 0.2s;
  }

  .report-textarea:focus {
    outline: none;
    border-color: #4c82fa;
  }

  .report-select {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 10px 14px;
    color: white;
    font-family: 'Cairo', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .report-select option {
    background: #1e293b;
  }

  .form-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
  }

  .settings-group {
    margin-bottom: 24px;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid var(--glass-border);
  }

  .toggle-switch {
    width: 44px;
    height: 24px;
    background: rgba(255,255,255,0.1);
    border-radius: 30px;
    cursor: pointer;
    position: relative;
    transition: 0.2s;
  }

  .toggle-switch.active {
    background: #4c82fa;
  }

  .toggle-knob {
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    right: 3px;
    transition: 0.2s;
  }

  .toggle-switch.active .toggle-knob {
    right: 21px;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-up {
    animation: fadeUp 0.4s ease both;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(76,130,250,0.2);
    border-top: 3px solid #4c82fa;
    border-right: 3px solid #a855f7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ============================================================
// Components
// ============================================================

function StatCard({ icon: Icon, label, value, trend, trendUp, accent, delay }) {
  return (
    <div className="stat-card animate-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-header">
        <div className="stat-icon" style={{ background: `${accent}20`, color: accent }}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className="stat-trend" style={{ color: trendUp ? '#10b981' : '#ef4444' }}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
      <div className="stat-value">{value?.toLocaleString() || 0}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function BarChartComponent({ data, labels, title }) {
  const maxVal = Math.max(...data, 1);
  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">{title}</span>
        <Filter size={14} color="rgba(255,255,255,0.3)" />
      </div>
      <div className="bar-chart">
        {data.map((val, i) => (
          <div key={i} className="bar-item">
            <div className="bar" style={{ height: `${(val / maxVal) * 150}px` }}></div>
            <div className="bar-label">{labels[i]}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PercentageCard({ label, value, delay }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="metric-pie animate-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="pie-ring">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4c82fa" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10" className="ring-bg" />
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10" stroke="url(#gradient)"
            strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 50 50)"
            className="ring-fill" />
          <text x="50" y="55" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{value}%</text>
        </svg>
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function DistributionChart({ doctors, patients, visitors, total }) {
  const doctorsPercent = total > 0 ? (doctors / total) * 100 : 0;
  const patientsPercent = total > 0 ? (patients / total) * 100 : 0;
  const visitorsPercent = total > 0 ? (visitors / total) * 100 : 0;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">📊 توزيع المستخدمين على المنصة</span>
        <PieChart size={14} color="rgba(255,255,255,0.3)" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 160, height: 160, position: 'relative' }}>
          <svg width="160" height="160" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradDoctor" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4c82fa" /><stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="gradPatient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="gradVisitor" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
            {doctors > 0 && <path d={getPieSlicePath(doctorsPercent, 0, 100)} fill="url(#gradDoctor)" stroke="#0f172a" strokeWidth="1" />}
            {patients > 0 && <path d={getPieSlicePath(patientsPercent, doctorsPercent, 100)} fill="url(#gradPatient)" stroke="#0f172a" strokeWidth="1" />}
            {visitors > 0 && <path d={getPieSlicePath(visitorsPercent, doctorsPercent + patientsPercent, 100)} fill="url(#gradVisitor)" stroke="#0f172a" strokeWidth="1" />}
            <text x="50" y="52" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{total}</text>
            <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8">إجمالي</text>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: 'linear-gradient(135deg,#4c82fa,#a855f7)' }}></div>
            <span style={{ fontSize: '0.8rem' }}>الأطباء: {doctors} ({Math.round(doctorsPercent)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: 'linear-gradient(135deg,#10b981,#34d399)' }}></div>
            <span style={{ fontSize: '0.8rem' }}>المرضى: {patients} ({Math.round(patientsPercent)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: 'linear-gradient(135deg,#f59e0b,#fb923c)' }}></div>
            <span style={{ fontSize: '0.8rem' }}>الزوار: {visitors} ({Math.round(visitorsPercent)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPieSlicePath(percent, startPercent, total) {
  const startAngle = (startPercent / total) * 360 - 90;
  const endAngle = ((startPercent + percent) / total) * 360 - 90;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = 50 + 40 * Math.cos(startRad);
  const y1 = 50 + 40 * Math.sin(startRad);
  const x2 = 50 + 40 * Math.cos(endRad);
  const y2 = 50 + 40 * Math.sin(endRad);
  const largeArc = percent > 50 ? 1 : 0;
  return `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function DoctorDetailsModal({ doctor, onClose, onApprove, onReject }) {
  if (!doctor) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>تفاصيل الطبيب</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#4c82fa,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
            {doctor.name?.charAt(0) || 'د'}
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{doctor.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doctor.specialty || 'غير محدد'}</div>
          </div>
        </div>
        <div className="detail-row"><Mail size={16} color="#4c82fa" /><div><strong>البريد الإلكتروني</strong><br/>{doctor.email}</div></div>
        <div className="detail-row"><Phone size={16} color="#10b981" /><div><strong>رقم الهاتف</strong><br/>{doctor.phone || 'غير متوفر'}</div></div>
        <div className="detail-row"><Briefcase size={16} color="#f59e0b" /><div><strong>سنوات الخبرة</strong><br/>{doctor.experience || 0} سنة</div></div>
        <div className="detail-row"><Stethoscope size={16} color="#a855f7" /><div><strong>التخصص</strong><br/>{doctor.specialty || 'غير محدد'}</div></div>
        <div className="detail-row"><FileText size={16} color="#06b6d4" /><div><strong>الوصف</strong><br/>{doctor.description || 'لا يوجد وصف'}</div></div>
        <div className="detail-row"><CalendarIcon size={16} color="#818cf8" /><div><strong>تاريخ التسجيل</strong><br/>{doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString('ar-DZ') : '-'}</div></div>
        {doctor.verificationStatus === 'PENDING' && (
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => onApprove(doctor.id)}><Check size={14} /> قبول الطبيب</button>
            <button className="btn-outline btn-danger" style={{ flex: 1 }} onClick={() => onReject(doctor.id)}><X size={14} /> رفض الطبيب</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState({ notifications: true, compactMode: false, autoSave: true, darkMode: true });
  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">⚙️ الإعدادات والتفضيلات</span>
        <button className="btn-primary" onClick={() => alert('تم حفظ الإعدادات')}>حفظ التغييرات</button>
      </div>
      <div className="settings-group">
        {[
          { key: 'notifications', label: 'الإشعارات والتنبيهات', desc: 'تحديثات بطاقات النشاط والتنبيهات' },
          { key: 'compactMode', label: 'الوضع المضغوط', desc: 'تقليل المسافات والحركات' },
          { key: 'autoSave', label: 'الحفظ التلقائي', desc: 'حفظ التغييرات فوراً' },
          { key: 'darkMode', label: 'الوضع الليلي', desc: 'المظهر الداكن' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="setting-item">
            <div>
              <div style={{ fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{desc}</div>
            </div>
            <div className={`toggle-switch ${settings[key] ? 'active' : ''}`} onClick={() => toggle(key)}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 12 }}>
        <button className="btn-outline">استعادة الإعدادات الافتراضية</button>
        <button className="btn-primary">تطبيق الإعدادات</button>
      </div>
    </div>
  );
}

// ============================================================
// Report Editor Modal Component
// ============================================================
function ReportEditorModal({ report, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: report?.name || '',
    type: report?.type || 'PDF',
    status: report?.status || 'مكتمل',
    content: report?.content || '',
  });
  const [saving, setSaving] = useState(false);
  const isEditing = !!report;

  const handleSave = async () => {
    if (!form.name.trim()) { alert("أدخل اسم التقرير"); return; }
    setSaving(true);
    try {
      const result = isEditing
        ? await updateReport({ id: report.id, ...form })
        : await createReport(form);

      if (result?.success) {
        onSaved();
        onClose();
      } else {
        alert("حدث خطأ: " + (result?.error || "غير معروف"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {isEditing ? '✏️ تعديل التقرير' : '📝 إنشاء تقرير جديد'}
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {/* اسم التقرير */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">اسم التقرير *</label>
          <input
            className="report-form-input"
            type="text"
            placeholder="مثال: تقرير المواعيد — أبريل 2026"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
        </div>

        {/* النوع والحالة */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="form-label">نوع التقرير</label>
            <select className="report-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="Word">Word</option>
              <option value="تقرير إداري">تقرير إداري</option>
              <option value="تقرير مالي">تقرير مالي</option>
              <option value="تقرير طبي">تقرير طبي</option>
            </select>
          </div>
          <div>
            <label className="form-label">الحالة</label>
            <select className="report-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="مكتمل">مكتمل</option>
              <option value="قيد الإعداد">قيد الإعداد</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="مسودة">مسودة</option>
            </select>
          </div>
        </div>

        {/* محتوى التقرير */}
        <div style={{ marginBottom: 24 }}>
          <label className="form-label">محتوى التقرير</label>
          <textarea
            className="report-textarea"
            placeholder="اكتب محتوى التقرير هنا... (ملاحظات، إحصائيات، توصيات، نتائج...)"
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
          />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'left' }}>
            {form.content.length} حرف
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onClose}>إلغاء</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ جاري الحفظ...' : isEditing ? '💾 حفظ التعديلات' : '✅ إنشاء التقرير'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Report View Modal
// ============================================================
function ReportViewModal({ report, onClose, onEdit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📄 {report.name}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-outline" onClick={() => { onClose(); onEdit(report); }}>
              <Edit size={14} /> تعديل
            </button>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(76,130,250,0.15)', color: '#4c82fa', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
            {report.type}
          </span>
          <span style={{
            background: report.status === 'مكتمل' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
            color: report.status === 'مكتمل' ? '#10b981' : '#f59e0b',
            padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600
          }}>
            {report.status}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', alignSelf: 'center' }}>
            📅 {report.date}
          </span>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--glass-border)',
          borderRadius: 16,
          padding: 20,
          minHeight: 180,
          fontSize: '0.9rem',
          lineHeight: 2,
          whiteSpace: 'pre-wrap',
          color: report.content ? 'var(--text-secondary)' : 'var(--text-muted)',
          fontStyle: report.content ? 'normal' : 'italic',
        }}>
          {report.content || 'لا يوجد محتوى لهذا التقرير بعد. اضغط تعديل لإضافة محتوى.'}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Dashboard Component
// ============================================================
export default function AdminDashboard({ stats, pendingDoctors, verifiedDoctors }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [allUsers, setAllUsers] = useState({ doctors: [], patients: [], visitors: [] });
  const [distributionStats, setDistributionStats] = useState({
    doctorsCount: 0, patientsCount: 0, visitorsCount: 0,
    total: 0, doctorsPercentage: 0, patientsPercentage: 0, visitorsPercentage: 0
  });
  const [analyticsData, setAnalyticsData] = useState({
    monthlyAppointments: new Array(12).fill(0),
    monthlyPatients: new Array(12).fill(0),
    months: [], completionRate: 0, satisfactionRate: 0,
    doctorsPerformance: [], specialtiesDistribution: [],
    doctorsGrowth: 0, appointmentsGrowth: 0, recentActivities: []
  });
  const [reports, setReports] = useState([]);

  // Report modal states
  const [reportEditorOpen, setReportEditorOpen] = useState(false);
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null); // report being edited or viewed

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      try {
        const [
          appointmentsStats, monthlyPatients, completionRate, satisfactionRate,
          doctorsPerformance, specialties, growthStats, activities,
          reportsData, usersData, visitorsStats
        ] = await Promise.all([
          getMonthlyAppointmentsStats(), getMonthlyPatientsStats(),
          getAppointmentCompletionRate(), getPatientSatisfactionRate(),
          getDoctorsPerformance(), getSpecialtiesDistribution(),
          getGrowthStats(), getRecentActivities(8),
          getReports(), getAllUsers(), getVisitorsAndDoctorsStats()
        ]);

        setAnalyticsData({
          monthlyAppointments: appointmentsStats?.total || new Array(12).fill(0),
          monthlyPatients: monthlyPatients || new Array(12).fill(0),
          months: appointmentsStats?.months || [],
          completionRate: completionRate || 0,
          satisfactionRate: satisfactionRate || 0,
          doctorsPerformance: doctorsPerformance || [],
          specialtiesDistribution: specialties || [],
          doctorsGrowth: growthStats?.doctorsGrowth || 0,
          appointmentsGrowth: growthStats?.appointmentsGrowth || 0,
          recentActivities: activities || []
        });
        setReports(reportsData || []);
        setAllUsers(usersData || { doctors: [], patients: [], visitors: [] });
        setDistributionStats(visitorsStats || {
          doctorsCount: 0, patientsCount: 0, visitorsCount: 0,
          total: 0, doctorsPercentage: 0, patientsPercentage: 0, visitorsPercentage: 0
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [usersData, visitorsStats] = await Promise.all([getAllUsers(), getVisitorsAndDoctorsStats()]);
        setAllUsers(usersData);
        setDistributionStats(visitorsStats);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshReports = async () => {
    const newReports = await getReports();
    setReports(newReports);
  };

  const handleDoctorUpdate = async (doctorId, status) => {
    try {
      const fd = new FormData();
      fd.append("doctorId", doctorId);
      fd.append("status", status);
      await updateDoctorStatus(fd);
      alert(`تم ${status === 'VERIFIED' ? 'قبول' : 'رفض'} الطبيب بنجاح`);
      window.location.reload();
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handleDeleteReport = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقرير؟")) return;
    const result = await deleteReport(id);
    if (result?.success) {
      await refreshReports();
    } else {
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const getRoleBadge = (role) => {
    const config = {
      doctor: { label: 'طبيب', color: '#4c82fa', bg: 'rgba(76,130,250,0.15)' },
      patient: { label: 'مريض', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
      visitor: { label: 'زائر', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
      admin: { label: 'مدير', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' }
    };
    const c = config[role] || config.visitor;
    return <span className="role-badge" style={{ background: c.bg, color: c.color }}>{c.label}</span>;
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { label: 'نشط', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
      inactive: { label: 'غير نشط', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
      pending: { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    };
    const c = config[status] || config.active;
    return <span className="status-badge" style={{ background: c.bg, color: c.color }}>{c.label}</span>;
  };

  const months = analyticsData.months.length ? analyticsData.months :
    ['يناير','فبراير','مارس','إبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  const getTrendForStat = (current, previous) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${Math.round(change)}%`;
  };

  const filterUsers = (users) => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const allDoctorsList = [...(allUsers.doctors || []), ...verifiedDoctors, ...pendingDoctors];
  const uniqueDoctors = allDoctorsList.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  const patientsList = allUsers.patients || [];
  const visitorsList = allUsers.visitors || [];

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="admin-root">
          <div className="top-nav">
            <div className="logo-area">
              <div className="logo-icon"><Shield size={20} /></div>
              <span className="logo-text">Adabibnek | لوحة الأدمين</span>
            </div>
          </div>
          <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: 16 }}>
            <div className="loading-spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل البيانات...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="admin-root">
        {/* Top Nav */}
        <div className="top-nav">
          <div className="logo-area">
            <div className="logo-icon"><Shield size={20} /></div>
            <span className="logo-text">Adabibnek | لوحة الأدمين</span>
          </div>
          <div className="nav-links">
            <div className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={16} /> الرئيسية
            </div>
            <div className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
              <BarChart3 size={16} /> التحليلات
            </div>
            <div className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
              <AlertCircle size={16} /> قيد التحقق
              {pendingDoctors.length > 0 && <span className="pending-count">{pendingDoctors.length}</span>}
            </div>
            <div className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              <Users size={16} /> جميع المستخدمين
            </div>
            <div className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
              <FileBarChart size={16} /> التقارير
            </div>
            <div className={`nav-link ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => setActiveTab('schedules')}>
              <Calendar size={16} /> جداول الأطباء
            </div>
            <div className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings size={16} /> الإعدادات
            </div>
          </div>
           <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
  }}
>

  <div
    className="home-btn"
    onClick={() => window.location.href = "/"}
  >
    <Home size={16} />
    الصفحة الرئيسية
  </div>

  <LogoutButton className="home-btn" />

</div>
        </div>

        <div className="main-content">

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              <div className="stats-grid">
                <StatCard icon={Stethoscope} label="إجمالي الأطباء" value={distributionStats.doctorsCount || stats.totalDoctors} trend={getTrendForStat(distributionStats.doctorsCount, distributionStats.doctorsCount - Math.floor(distributionStats.doctorsCount * 0.1))} trendUp accent="#4c82fa" delay={0} />
                <StatCard icon={AlertCircle} label="قيد التحقق" value={pendingDoctors.length} trend={`+${pendingDoctors.length}`} trendUp accent="#f59e0b" delay={50} />
                <StatCard icon={UserCheck} label="أطباء موثقون" value={verifiedDoctors.length} trend={getTrendForStat(verifiedDoctors.length, verifiedDoctors.length - Math.floor(verifiedDoctors.length * 0.05))} trendUp accent="#10b981" delay={100} />
                <StatCard icon={Users} label="المرضى" value={distributionStats.patientsCount || stats.totalPatients} trend={getTrendForStat(distributionStats.patientsCount, distributionStats.patientsCount - Math.floor(distributionStats.patientsCount * 0.12))} trendUp accent="#06b6d4" delay={150} />
                <StatCard icon={User} label="الزوار" value={distributionStats.visitorsCount} trend={`+${distributionStats.visitorsCount}`} trendUp accent="#f59e0b" delay={200} />
                <StatCard icon={CalendarDays} label="المواعيد" value={stats.totalAppointments} trend={`+${analyticsData.appointmentsGrowth}%`} trendUp={analyticsData.appointmentsGrowth >= 0} accent="#a855f7" delay={250} />
                <StatCard icon={CheckCircle2} label="مواعيد مكتملة" value={stats.completedAppointments} trend={`${analyticsData.completionRate}%`} trendUp accent="#10b981" delay={300} />
              </div>

              <div className="charts-row">
                <DistributionChart doctors={distributionStats.doctorsCount} patients={distributionStats.patientsCount} visitors={distributionStats.visitorsCount} total={distributionStats.total} />
                <BarChartComponent title="📈 المواعيد الشهرية" data={analyticsData.monthlyAppointments.slice(0, 6)} labels={months.slice(0, 6)} />
              </div>

              <div className="charts-row">
                <BarChartComponent title="👥 المرضى الجدد شهرياً" data={analyticsData.monthlyPatients.slice(0, 6)} labels={months.slice(0, 6)} />
                <div className="chart-card">
                  <div className="chart-header"><span className="chart-title">📊 نسبة الزوار إلى الأطباء</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 0' }}>
                    {[
                      { label: 'الزوار', pct: distributionStats.visitorsPercentage, count: distributionStats.visitorsCount, color: 'linear-gradient(90deg,#f59e0b,#fb923c)' },
                      { label: 'الأطباء', pct: distributionStats.doctorsPercentage, count: distributionStats.doctorsCount, color: 'linear-gradient(90deg,#4c82fa,#a855f7)' },
                      { label: 'المرضى', pct: distributionStats.patientsPercentage, count: distributionStats.patientsCount, color: 'linear-gradient(90deg,#10b981,#34d399)' },
                    ].map(({ label, pct, count, color }) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span>{label}</span><span>{pct}% ({count})</span>
                        </div>
                        <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6 }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="metrics-row">
                <PercentageCard label="نسبة إنجاز المواعيد" value={analyticsData.completionRate} delay={0} />
                <PercentageCard label="رضا المرضى" value={analyticsData.satisfactionRate} delay={100} />
                <PercentageCard label="نمو الأطباء" value={Math.abs(analyticsData.doctorsGrowth)} delay={200} />
                <PercentageCard label="نمو المواعيد" value={Math.abs(analyticsData.appointmentsGrowth)} delay={300} />
              </div>
            </>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <>
              <div className="charts-row">
                <div className="chart-card">
                  <div className="chart-header"><span className="chart-title">🏆 أداء الأطباء (حسب عدد المواعيد)</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {analyticsData.doctorsPerformance.slice(0, 5).map((doc, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 100, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${(doc.appointments / Math.max(...analyticsData.doctorsPerformance.map(d => d.appointments), 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#4c82fa,#a855f7)', borderRadius: 4 }}></div>
                        </div>
                        <div style={{ fontSize: '0.7rem', minWidth: 40 }}>{doc.appointments} موعد</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-header"><span className="chart-title">🎯 توزيع التخصصات</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analyticsData.specialtiesDistribution.map((spec, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                          <span>{spec.name}</span><span>{spec.percentage}% ({spec.count})</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${spec.percentage}%`, height: '100%', background: 'linear-gradient(90deg,#4c82fa,#a855f7)', borderRadius: 6 }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Pending Doctors Tab */}
          {activeTab === 'pending' && (
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">⏳ الأطباء قيد التحقق ({pendingDoctors.length})</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={14} />
                  <input type="text" placeholder="بحث..." className="search-input" style={{ width: 150 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              {pendingDoctors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <p>لا يوجد أطباء قيد التحقق</p>
                </div>
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr><th>الطبيب</th><th>البريد الإلكتروني</th><th>التخصص</th><th>تاريخ التسجيل</th><th>الإجراءات</th></tr>
                    </thead>
                    <tbody>
                      {filterUsers(pendingDoctors).map((doctor) => (
                        <tr key={doctor.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="user-avatar" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>{doctor.name?.charAt(0) || 'د'}</div>
                              <div><div style={{ fontWeight: 600 }}>{doctor.name}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doctor.specialty}</div></div>
                            </div>
                          </td>
                          <td>{doctor.email}</td>
                          <td>{doctor.specialty || '—'}</td>
                          <td>{doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString('ar-DZ') : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-icon" onClick={() => setSelectedDoctor(doctor)}><Eye size={16} color="#4c82fa" /></button>
                              <button className="btn-icon" onClick={() => handleDoctorUpdate(doctor.id, 'VERIFIED')}><Check size={16} color="#10b981" /></button>
                              <button className="btn-icon" onClick={() => handleDoctorUpdate(doctor.id, 'REJECTED')}><X size={16} color="#ef4444" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* All Users Tab */}
          {activeTab === 'users' && (
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">👥 جميع المستخدمين</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search size={14} />
                    <input type="text" placeholder="بحث..." className="search-input" style={{ width: 200 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button className="btn-icon" onClick={() => window.location.reload()}><RefreshCw size={16} /></button>
                </div>
              </div>
              <div style={{ marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(76,130,250,0.1)', padding: '8px 16px', borderRadius: 40 }}>👨‍⚕️ الأطباء: <strong>{uniqueDoctors.length}</strong></div>
                <div style={{ background: 'rgba(16,185,129,0.1)', padding: '8px 16px', borderRadius: 40 }}>🧑 المرضى: <strong>{patientsList.length}</strong></div>
                <div style={{ background: 'rgba(168,85,247,0.1)', padding: '8px 16px', borderRadius: 40 }}>📊 الإجمالي: <strong>{uniqueDoctors.length + patientsList.length}</strong></div>
              </div>
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr><th>المستخدم</th><th>البريد الإلكتروني</th><th>الدور</th><th>الحالة</th><th>تاريخ التسجيل</th><th>الإجراءات</th></tr>
                  </thead>
                  <tbody>
                    {filterUsers([
                      ...uniqueDoctors.map(d => ({ ...d, role: 'doctor' })),
                      ...patientsList.map(p => ({ ...p, role: 'patient' })),
                      ...visitorsList.map(v => ({ ...v, role: 'visitor' }))
                    ]).map((user, idx) => (
                      <tr key={user.id || idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="user-avatar" style={{ background: user.role === 'doctor' ? 'linear-gradient(135deg,#4c82fa,#a855f7)' : user.role === 'patient' ? 'linear-gradient(135deg,#10b981,#34d399)' : 'linear-gradient(135deg,#f59e0b,#fb923c)' }}>
                              {user.name?.charAt(0) || (user.role === 'doctor' ? 'د' : 'م')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{user.name || '—'}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.specialty || user.phone || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>{user.email || '—'}</td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>{getStatusBadge(user.status || 'active')}</td>
                        <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-DZ') : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-icon" onClick={() => user.role === 'doctor' && setSelectedDoctor(user)}><Eye size={16} color="#4c82fa" /></button>
                            <button className="btn-icon"><Edit size={16} color="#f59e0b" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">📊 التقارير المحفوظة ({reports.length})</span>
                <button className="btn-primary" onClick={() => { setActiveReport(null); setReportEditorOpen(true); }}>
                  <Plus size={14} /> إنشاء تقرير جديد
                </button>
              </div>

              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <FileBarChart size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <p>لا توجد تقارير محفوظة بعد</p>
                  <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => { setActiveReport(null); setReportEditorOpen(true); }}>
                    إنشاء أول تقرير
                  </button>
                </div>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr><th>اسم التقرير</th><th>التاريخ</th><th>الحالة</th><th>النوع</th><th>الإجراءات</th></tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>
                          <button
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.85rem', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)' }}
                            onClick={() => { setActiveReport(r); setReportViewOpen(true); }}
                          >
                            {r.name}
                          </button>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{r.date}</td>
                        <td>
                          <span className="status-badge" style={{
                            background: r.status === 'مكتمل' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            color: r.status === 'مكتمل' ? '#10b981' : '#f59e0b'
                          }}>{r.status}</span>
                        </td>
                        <td>{r.type}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-icon" title="عرض" onClick={() => { setActiveReport(r); setReportViewOpen(true); }}>
                              <Eye size={15} color="#4c82fa" />
                            </button>
                            <button className="btn-icon" title="تعديل" onClick={() => { setActiveReport(r); setReportEditorOpen(true); }}>
                              <Edit size={15} color="#f59e0b" />
                            </button>
                            <button className="btn-icon" title="حذف" onClick={() => handleDeleteReport(r.id)}>
                              <Trash2 size={15} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Schedules Tab */}
          {activeTab === 'schedules' && (
            <div className="chart-card" style={{ padding: 0, background: 'none', border: 'none' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>📅 إدارة جداول الأطباء</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  حدد أيام وأوقات عمل كل طبيب. الأطباء يشوفون جدولهم فقط بدون تعديل.
                </p>
              </div>
              <AdminAvailabilityManager
                verifiedDoctors={verifiedDoctors}
                getAvailabilityFn={getDoctorAvailabilityForAdmin}
                setAvailabilityFn={setDoctorAvailabilityByAdmin}
              />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && <SettingsPanel />}

        </div>
      </div>

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <DoctorDetailsModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onApprove={(id) => { handleDoctorUpdate(id, 'VERIFIED'); setSelectedDoctor(null); }}
          onReject={(id) => { handleDoctorUpdate(id, 'REJECTED'); setSelectedDoctor(null); }}
        />
      )}

      {/* Report Editor Modal */}
      {reportEditorOpen && (
        <ReportEditorModal
          report={activeReport}
          onClose={() => { setReportEditorOpen(false); setActiveReport(null); }}
          onSaved={refreshReports}
        />
      )}

      {/* Report View Modal */}
      {reportViewOpen && activeReport && (
        <ReportViewModal
          report={activeReport}
          onClose={() => { setReportViewOpen(false); setActiveReport(null); }}
          onEdit={(r) => { setActiveReport(r); setReportEditorOpen(true); }}
        />
      )}
    </>
  );
}