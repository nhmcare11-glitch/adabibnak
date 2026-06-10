"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Calendar, Clock, Stethoscope, FileText, Pill, ChevronRight,
  CheckCircle, CalendarClock, Activity, Plus, Bell,
  LayoutDashboard, MessageSquare, Settings, Menu, X,
  User, Camera, Edit3, Phone, Mail, MapPin, Save,
  Heart, FileHeart, ShoppingBag
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrescriptionView } from "@/components/prescription-view";
import PaymentProfileForm from "./PaymentProfileForm";
import PatientPaymentCard from "./PatientPaymentCard";
import { updatePatientProfile } from "@/actions/patient-dashboard";
import InteractiveBodySection from "./InteractiveBodySection";
import LogoutButton from "@/components/shared/LogoutButton";
import ChatWindow from "@/components/chat/ChatWindow";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:      "#0d9488",
  primaryDark:  "#0f766e",
  primaryLight: "#f0fdfb",
  grad:         "linear-gradient(135deg,#0d9488,#0891b2)",
  border:       "#ccfbf1",
  borderMid:    "#99f6e4",
  text:         "#134e4a",
  textMid:      "#2d7a72",
  textLight:    "#5eaaa4",
  sidebar:      "#0a2422",
  sidebarHov:   "#112e2b",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusLabel = (s) => s==="SCHEDULED"?"مجدول":s==="COMPLETED"?"مكتمل":"ملغى";
const statusConfig = (s) => {
  if(s==="SCHEDULED") return {bg:"bg-amber-50",border:"border-amber-200",text:"text-amber-700",dot:"bg-amber-400"};
  if(s==="COMPLETED") return {bg:"bg-teal-50",border:"border-teal-200",text:"text-teal-700",dot:"bg-teal-500"};
  return {bg:"bg-red-50",border:"border-red-200",text:"text-red-600",dot:"bg-red-400"};
};
const fmtDate = (d) => { try{return format(new Date(d),"dd MMM yyyy",{locale:ar});}catch{return"—";} };
const fmtTime = (d) => { try{return format(new Date(d),"hh:mm a");}catch{return"—";} };
const getGreeting = () => { const h=new Date().getHours(); return h<12?"صباح الخير":h<18?"مساء الخير":"مساء النور"; };

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ user, activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const nav = [
    { key:"overview",       label:"لوحة التحكم",       icon:<LayoutDashboard className="h-[18px] w-[18px]"/> },
    { key:"upcoming",       label:"المواعيد القادمة",   icon:<CalendarClock   className="h-[18px] w-[18px]"/> },
    { key:"past",           label:"المواعيد السابقة",   icon:<CheckCircle     className="h-[18px] w-[18px]"/> },
    { key:"prescriptions",  label:"الوصفات الطبية",    icon:<FileText        className="h-[18px] w-[18px]"/> },
    { key:"doctors",        label:"أطبائي",             icon:<Stethoscope    className="h-[18px] w-[18px]"/> },
    { key:"medical-record", label:"ملفي الطبي",        icon:<Heart           className="h-[18px] w-[18px]"/> },
    { key:"messages",       label:"الرسائل",            icon:<MessageSquare   className="h-[18px] w-[18px]"/> },
    { key:"pharmacy",       label:"الصيدلية",           icon:<ShoppingBag     className="h-[18px] w-[18px]"/> },
    { key:"profile",        label:"ملفي الشخصي",       icon:<User            className="h-[18px] w-[18px]"/> },
  ];

  const NavBtn = ({item}) => {
    const isActive = activeTab === item.key;
    return (
      <button
        onClick={() => { setActiveTab(item.key); setMobileOpen(false); }}
        className="w-full flex items-center gap-3 px-3 py-[10px] rounded-xl text-[13.5px] font-medium transition-all duration-150"
        style={isActive
          ? { background:C.primary, color:"#fff", boxShadow:"0 4px 16px rgba(13,148,136,0.4)" }
          : { color:"rgba(255,255,255,0.55)" }
        }
        onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.background=C.sidebarHov; e.currentTarget.style.color="#fff"; }}}
        onMouseLeave={e=>{ if(!isActive){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,0.55)"; }}}
      >
        {item.icon}<span>{item.label}</span>
      </button>
    );
  };

  const Inner = () => (
    <div className="flex flex-col h-full" style={{background:C.sidebar}}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-[18px]" style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-[13px]" style={{background:C.grad}}>أ</div>
        <span className="font-bold text-white text-[15px] tracking-wide">أدابيبناك</span>
      </div>

      {/* User mini */}
      <div className="mx-3 mt-4 mb-1 p-3 rounded-2xl" style={{background:"rgba(13,148,136,0.15)",border:"1px solid rgba(13,148,136,0.3)"}}>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2" style={{borderColor:"rgba(45,191,184,0.5)"}}>
            <AvatarImage src={user.imageUrl}/>
            <AvatarFallback className="text-white font-bold text-sm" style={{background:C.primary}}>{user.name?.[0]??"م"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[13px] text-white truncate">{user.name?.split(" ")[0]}</p>
            <p className="text-[11px]" style={{color:"#5eead4"}}>مريض</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"/>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 py-2" style={{color:"rgba(94,234,212,0.4)"}}>القائمة الرئيسية</p>
        {nav.slice(0,6).map(item => <NavBtn key={item.key} item={item}/>)}

        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-2" style={{color:"rgba(94,234,212,0.4)"}}>التواصل والخدمات</p>
        <NavBtn item={nav[6]}/>
        <NavBtn item={nav[7]}/>

        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-2" style={{color:"rgba(94,234,212,0.4)"}}>الحساب</p>
        <NavBtn item={nav[8]}/>
      </nav>

      {/* Logout */}
      <LogoutButton
        className="w-full flex items-center gap-3 px-3 py-[10px] rounded-xl text-[13.5px] font-medium transition-all mt-3"
      />
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 overflow-hidden" style={{borderLeft:"1px solid rgba(255,255,255,0.05)"}}>
        <Inner/>
      </aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setMobileOpen(false)}/>
          <aside className="relative w-64 h-full shadow-2xl overflow-y-auto" style={{background:C.sidebar}}>
            <button onClick={()=>setMobileOpen(false)} className="absolute top-4 left-4 z-10 p-2 rounded-xl" style={{background:"rgba(255,255,255,0.08)",color:"#fff"}}>
              <X className="h-4 w-4"/>
            </button>
            <Inner/>
          </aside>
        </div>
      )}
    </>
  );
}

// ── Top Header ─────────────────────────────────────────────────────────────────
function TopHeader({ user, setMobileOpen, setActiveTab }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20 bg-white" style={{borderBottom:"1px solid #ccfbf1"}}>
      <div className="flex items-center gap-4">
        <button onClick={()=>setMobileOpen(true)} className="lg:hidden p-2 rounded-xl" style={{background:C.primaryLight,color:C.primary}}>
          <Menu className="h-5 w-5"/>
        </button>
        <div>
          <h1 className="text-[17px] font-bold" style={{color:C.text}}>{getGreeting()}، {user.name?.split(" ")[0]} 👋</h1>
          <p className="text-[11.5px]" style={{color:C.textLight}}>معلومات تفصيلية عن صحتك</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={()=>{ setShowNotifs(!showNotifs); setShowProfileMenu(false); }}
            className="relative p-2.5 rounded-xl transition-colors"
            style={{background:C.primaryLight}}>
            <Bell className="h-[18px] w-[18px]" style={{color:C.primary}}/>
          </button>
          {showNotifs && (
            <div className="absolute top-12 left-0 w-72 rounded-2xl bg-white shadow-xl z-50 overflow-hidden" style={{border:"1px solid #ccfbf1"}}>
              <div className="px-4 py-3" style={{borderBottom:"1px solid #ccfbf1"}}>
                <p className="font-bold text-sm" style={{color:C.text}}>الإشعارات</p>
              </div>
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2" style={{color:"#a7f3d0"}}/>
                <p className="text-sm" style={{color:C.textLight}}>لا توجد إشعارات جديدة</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={()=>{ setShowProfileMenu(!showProfileMenu); setShowNotifs(false); }}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl transition-colors"
            style={{background:C.primaryLight, border:"1px solid #a7f3d0"}}>
            <Avatar className="h-8 w-8 border-2" style={{borderColor:C.primary}}>
              <AvatarImage src={user.imageUrl}/>
              <AvatarFallback className="text-white font-bold text-xs" style={{background:C.primary}}>{user.name?.[0]??"م"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold hidden sm:block" style={{color:C.text}}>{user.name?.split(" ")[0]}</span>
          </button>

          {showProfileMenu && (
            <div className="absolute top-12 left-0 w-52 rounded-2xl bg-white shadow-xl z-50 overflow-hidden" style={{border:"1px solid #ccfbf1"}}>
              <div className="p-3" style={{borderBottom:"1px solid #ccfbf1"}}>
                <p className="font-semibold text-sm" style={{color:C.text}}>{user.name}</p>
                <p className="text-xs mt-0.5" style={{color:C.textLight}}>{user.email}</p>
              </div>
              <div className="p-2">
                <button onClick={()=>{ setActiveTab("profile"); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-right"
                  style={{color:C.text}}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.primaryLight;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                  <User className="h-4 w-4" style={{color:C.primary}}/>ملفي الشخصي
                </button>
                <button onClick={()=>{ setActiveTab("overview"); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-right"
                  style={{color:C.text}}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.primaryLight;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                  <LayoutDashboard className="h-4 w-4" style={{color:C.primary}}/>لوحة التحكم
                </button>
                <div style={{borderTop:"1px solid #ccfbf1",margin:"6px 0"}}/>
                <LogoutButton
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-right"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, iconBg }) {
  return (
    <div className="rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden" style={{border:"1px solid #ccfbf1"}}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-white" style={{background:iconBg}}>{icon}</div>
      <p className="text-2xl font-bold leading-none" style={{color:C.text}}>{value}</p>
      <p className="text-sm mt-1" style={{color:C.textLight}}>{label}</p>
    </div>
  );
}

// ── Next Appointment Banner ───────────────────────────────────────────────────
function NextAppointmentBanner({ appt }) {
  if (!appt) return null;
  return (
    <div className="rounded-2xl overflow-hidden shadow-md" style={{background:C.grad}}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{background:"rgba(255,255,255,0.18)"}}>
            <CalendarClock className="h-7 w-7 text-white"/>
          </div>
          <div>
            <p className="text-[11px] font-medium mb-0.5" style={{color:"rgba(204,251,241,0.85)"}}>موعدك القادم</p>
            <p className="text-white font-bold text-lg leading-tight">Dr. {appt.doctor?.name}</p>
            <p className="text-sm" style={{color:"rgba(204,251,241,0.9)"}}>{appt.doctor?.specialty}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {[{i:<Calendar className="h-4 w-4 text-white"/>,v:fmtDate(appt.startTime)},{i:<Clock className="h-4 w-4 text-white"/>,v:fmtTime(appt.startTime)}].map((x,k)=>(
            <div key={k} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{background:"rgba(255,255,255,0.18)"}}>
              {x.i}<span className="text-white text-sm font-medium">{x.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Appointment Row ───────────────────────────────────────────────────────────
function AppointmentRow({ appt, onViewPrescription }) {
  const sc = statusConfig(appt.status);
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white transition-all duration-200"
        style={{border:"1px solid #ccfbf1"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.boxShadow="0 2px 16px rgba(13,148,136,0.1)";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#ccfbf1";e.currentTarget.style.boxShadow="none";}}>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-11 w-11 shrink-0 border-2" style={{borderColor:"#99f6e4"}}>
            <AvatarImage src={appt.doctor?.imageUrl}/>
            <AvatarFallback className="font-bold text-sm" style={{background:C.primaryLight,color:C.primary}}>{appt.doctor?.name?.[0]??"د"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{color:C.text}}>Dr. {appt.doctor?.name}</p>
            <p className="text-xs mt-0.5" style={{color:C.textLight}}>{appt.doctor?.specialty}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{color:C.textLight}}>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" style={{color:C.primary}}/>{fmtDate(appt.startTime)}</span>
          <span style={{color:"#99f6e4"}}>·</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" style={{color:C.primary}}/>{fmtTime(appt.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${sc.bg} ${sc.border} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>{statusLabel(appt.status)}
          </span>
          {appt.prescription && (
            <button onClick={()=>onViewPrescription(appt.prescription)}
              className="h-8 text-xs px-3 rounded-xl border font-medium transition-colors flex items-center gap-1.5"
              style={{borderColor:"#99f6e4",color:C.primary,background:C.primaryLight}}>
              <Pill className="h-3.5 w-3.5"/>وصفة
            </button>
          )}
        </div>
      </div>
      <PatientPaymentCard payment={appt.payment} appointment={appt}/>
    </div>
  );
}

// ── Doctor Card ───────────────────────────────────────────────────────────────
function DoctorCard({ doctor }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white transition-all duration-200"
      style={{border:"1px solid #ccfbf1"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.boxShadow="0 2px 12px rgba(13,148,136,0.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#ccfbf1";e.currentTarget.style.boxShadow="none";}}>
      <Avatar className="h-12 w-12 border-2 shrink-0" style={{borderColor:"#99f6e4"}}>
        <AvatarImage src={doctor.imageUrl}/>
        <AvatarFallback className="font-bold" style={{background:C.primaryLight,color:C.primary}}>{doctor.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm" style={{color:C.text}}>Dr. {doctor.name}</p>
        <p className="text-xs mt-0.5" style={{color:C.textLight}}>{doctor.specialty}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0" style={{color:"#99f6e4"}}/>
    </div>
  );
}

// ── Right Panel: Timeline ─────────────────────────────────────────────────────
function AppointmentTimeline({ appointments }) {
  const items = appointments.slice(0,4);
  const palette = [{dot:"#0d9488",text:"#0d9488"},{dot:"#f59e0b",text:"#d97706"},{dot:"#ef4444",text:"#dc2626"},{dot:"#0891b2",text:"#0e7490"}];
  return (
    <div className="rounded-2xl p-5 bg-white shadow-sm" style={{border:"1px solid #ccfbf1"}}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-sm" style={{color:C.text}}>جدول المواعيد</h3>
        <span className="text-xs font-medium cursor-pointer" style={{color:C.primary}}>عرض الكل ←</span>
      </div>
      {items.length===0 ? <p className="text-sm text-center py-6" style={{color:C.textLight}}>لا توجد مواعيد</p> : (
        <div className="relative">
          <div className="absolute right-[18px] top-5 bottom-5 w-px" style={{background:"#ccfbf1"}}/>
          <div className="space-y-5">
            {items.map((appt,i)=>(
              <div key={appt.id} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-xs font-bold shadow-sm"
                  style={{background:palette[i%4].dot}}>{i+1}</div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-xs" style={{color:C.textLight}}>{fmtDate(appt.startTime)} · {fmtTime(appt.startTime)}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{color:palette[i%4].text}}>{appt.doctor?.specialty ?? statusLabel(appt.status)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Right Panel: Prescriptions ────────────────────────────────────────────────
function PrescriptionsPanel({ prescriptions, onView }) {
  return (
    <div className="rounded-2xl p-5 bg-white shadow-sm" style={{border:"1px solid #ccfbf1"}}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{color:C.text}}>الوصفات الطبية</h3>
        <span className="text-xs font-medium cursor-pointer" style={{color:C.primary}}>عرض الكل ←</span>
      </div>
      {prescriptions.length===0 ? <p className="text-sm text-center py-6" style={{color:C.textLight}}>لا توجد وصفات بعد</p> : (
        <div className="space-y-3">
          {prescriptions.slice(0,3).map(rx=>(
            <button key={rx.id} onClick={()=>onView(rx)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right"
              style={{background:C.primaryLight,border:"1px solid #99f6e4"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#99f6e4";}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:"#ede9fe"}}>
                <Pill className="h-4 w-4" style={{color:"#7c3aed"}}/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{color:C.text}}>{rx.diagnosis??"وصفة طبية"}</p>
                <p className="text-xs mt-0.5" style={{color:C.textLight}}>{fmtDate(rx.appointmentDate)}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{color:"#99f6e4"}}/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Payment Section ───────────────────────────────────────────────────────────
function PaymentSection({ nextAppointment, user }) {
  const [showForm, setShowForm] = useState(false);
  if(!nextAppointment) return null;
  return (
    <div className="rounded-2xl p-5 bg-white shadow-sm" style={{border:"1px solid #ccfbf1"}}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{color:C.text}}>
          <Pill className="h-4 w-4" style={{color:"#7c3aed"}}/>الملف الطبي والدفع
        </h3>
        <button onClick={()=>setShowForm(!showForm)} className="text-xs font-medium" style={{color:C.primary}}>
          {showForm?"إخفاء":"تحديث"}
        </button>
      </div>
      {showForm && <div className="mb-3"><PaymentProfileForm appointmentId={nextAppointment.id} existingProfile={user.patientProfile} onSuccess={()=>setShowForm(false)}/></div>}
      {nextAppointment.payment
        ? <PatientPaymentCard payment={nextAppointment.payment} appointment={nextAppointment}/>
        : !showForm && (
          <button onClick={()=>setShowForm(true)}
            className="w-full p-4 rounded-xl border-2 border-dashed text-center transition-all"
            style={{borderColor:"#99f6e4"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.background=C.primaryLight;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#99f6e4";e.currentTarget.style.background="transparent";}}>
            <p className="text-sm font-medium" style={{color:C.textMid}}>أكمل ملفك الطبي</p>
            <p className="text-xs mt-1" style={{color:C.primary}}>اضغط هنا للبدء</p>
          </button>
        )
      }
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ icon, text, sub, link, linkLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{background:C.primaryLight,border:"1px solid #99f6e4"}}>{icon}</div>
      <p className="font-semibold text-sm" style={{color:C.text}}>{text}</p>
      {sub && <p className="text-xs mt-1.5 max-w-xs leading-relaxed" style={{color:C.textLight}}>{sub}</p>}
      {link && (
        <a href={link} className="mt-5 px-5 py-2.5 rounded-xl text-white text-sm font-medium inline-flex items-center gap-2" style={{background:C.grad}}>
          <Plus className="h-4 w-4"/>{linkLabel}
        </a>
      )}
    </div>
  );
}

// ── Location Picker ───────────────────────────────────────────────────────────
const LeafletMap = dynamic(() => import("./LocationMap"), { ssr: false });

function LocationField({ city, setCity, setLat, setLng }) {
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords,  setCoords]  = useState(null);

  async function handleGPS() {
    if (!navigator.geolocation) return alert("متصفحك لا يدعم GPS");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const name = data.address?.city || data.address?.town || data.address?.state || "";
          setCity(name);
          setLat(latitude);
          setLng(longitude);
        } catch {}
        setShowMap(true);
        setLoading(false);
      },
      () => { alert("تعذّر تحديد الموقع، تأكد من إذن الموقع في المتصفح"); setLoading(false); }
    );
  }

  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textMid }}>
        المدينة / المنطقة
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white transition-all"
        style={{ border: "1px solid #ccfbf1" }}
        onFocusCapture={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)"; }}
        onBlurCapture={e  => { e.currentTarget.style.borderColor = "#ccfbf1"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <MapPin className="h-4 w-4" style={{ color: C.textLight }} />
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="مدينتك أو منطقتك"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: C.text }}
        />
        <button
          type="button"
          onClick={handleGPS}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
          style={{ background: loading ? "#5eaaa4" : C.grad }}
        >
          {loading
            ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
            : <MapPin className="h-3.5 w-3.5"/>
          }
          {loading ? "جاري..." : "تحديد موقعي"}
        </button>
      </div>

      {showMap && coords && (
        <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: "1px solid #99f6e4", height: 280 }}>
          <LeafletMap
            coords={coords}
            setCoords={setCoords}
            onConfirm={async (lat, lng) => {
              setLat(lat); setLng(lng);
              try {
                const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                const data = await res.json();
                const name = data.address?.city || data.address?.town || data.address?.state || "";
                if (name) setCity(name);
              } catch {}
              setShowMap(false);
            }}
            onClose={() => setShowMap(false)}
          />
        </div>
      )}
    </div>
  );
}

// ── Profile Field ─────────────────────────────────────────────────────────────
function ProfileField({ label, icon: Icon, value, onChange, type="text", placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{color:C.textMid}}>{label}</label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white transition-all"
        style={{border:"1px solid #ccfbf1"}}
        onFocusCapture={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.boxShadow="0 0 0 3px rgba(13,148,136,0.1)";}}
        onBlurCapture={e=>{e.currentTarget.style.borderColor="#ccfbf1";e.currentTarget.style.boxShadow="none";}}
      >
        <div style={{color:C.textLight}}>{Icon}</div>
        <input
          type={type}
          value={value}
          onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{color:C.text}}
        />
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ user }) {
  const [name,  setName]  = useState(user.name  ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.patientProfile?.phone ?? "");
  const [city,  setCity]  = useState(user.patientProfile?.city      ?? "");
  const [lat,   setLat]   = useState(user.patientProfile?.latitude   ?? null);
  const [lng,   setLng]   = useState(user.patientProfile?.longitude  ?? null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [previewUrl, setPreviewUrl] = useState(user.imageUrl ?? null);
  const [imageFile,  setImageFile]  = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const fileInputRef = useRef(null);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("الرجاء اختيار صورة صالحة");
    if (file.size > 5 * 1024 * 1024) return alert("حجم الصورة يجب أن يكون أقل من 5MB");
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updatePatientProfile({ name, phone, city, latitude: lat, longitude: lng });
      if (result?.error) { alert(result.error); }
      else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch (e) {
      alert("حدث خطأ غير متوقع، حاول مجدداً");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Avatar section */}
      <div className="rounded-2xl p-6 bg-white shadow-sm" style={{border:"1px solid #ccfbf1"}}>
        <h2 className="font-bold text-base mb-5 flex items-center gap-2" style={{color:C.text}}>
          <span className="w-1 h-5 rounded-full inline-block" style={{background:C.primary}}/>
          الصورة الشخصية
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0 cursor-pointer group" onClick={()=>fileInputRef.current?.click()}>
            <Avatar className="h-24 w-24 border-4 transition-all" style={{borderColor:"#99f6e4"}}>
              <AvatarImage src={previewUrl} style={{objectFit:"cover"}}/>
              <AvatarFallback className="text-white text-3xl font-bold" style={{background:C.grad}}>{user.name?.[0]??"م"}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{background:"rgba(13,148,136,0.55)"}}>
              <Camera className="h-6 w-6 text-white"/>
            </div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md"
              style={{background:C.grad}}>
              <Camera className="h-4 w-4"/>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>
          <div className="flex-1">
            <p className="font-bold text-base" style={{color:C.text}}>{user.name}</p>
            <p className="text-sm mt-0.5" style={{color:C.textLight}}>{user.email}</p>
            {imageFile ? (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium truncate"
                  style={{background:C.primaryLight, border:"1px solid #99f6e4", color:C.textMid}}>
                  ✓ {imageFile.name}
                </div>
                <button onClick={()=>{ setImageFile(null); setPreviewUrl(user.imageUrl ?? null); }}
                  className="text-xs px-2 py-1.5 rounded-lg"
                  style={{color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca"}}>
                  إلغاء
                </button>
              </div>
            ) : (
              <button onClick={()=>fileInputRef.current?.click()}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{background:C.grad, color:"#fff"}}>
                <Camera className="h-4 w-4"/>تغيير الصورة
              </button>
            )}
            <p className="text-xs mt-2" style={{color:C.textLight}}>PNG أو JPG · أقل من 5MB</p>
          </div>
        </div>
      </div>

      {/* Info form */}
      <div className="rounded-2xl p-6 bg-white shadow-sm" style={{border:"1px solid #ccfbf1"}}>
        <h2 className="font-bold text-base mb-5 flex items-center gap-2" style={{color:C.text}}>
          <span className="w-1 h-5 rounded-full inline-block" style={{background:C.primary}}/>
          المعلومات الشخصية
        </h2>
        <div className="space-y-4">
          <ProfileField label="الاسم الكامل"       icon={<User  className="h-4 w-4"/>} value={name}  onChange={setName}  placeholder="اسمك الكامل"/>
          <ProfileField label="البريد الإلكتروني"  icon={<Mail  className="h-4 w-4"/>} value={email} onChange={setEmail} type="email" placeholder="بريدك الإلكتروني"/>
          <ProfileField label="رقم الهاتف"         icon={<Phone className="h-4 w-4"/>} value={phone} onChange={setPhone} placeholder="رقم هاتفك"/>
          <LocationField city={city} setCity={setCity} setLat={setLat} setLng={setLng} />
        </div>
        {lat && lng && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{background:C.primaryLight, border:"1px solid #99f6e4"}}>
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{color:C.primary}}/>
            <span style={{color:C.textMid}}>تم تحديد الموقع: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
          </div>
        )}
        <button onClick={handleSave} disabled={saving}
          className="mt-6 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          style={{background:saving?"#5eaaa4":C.grad, opacity:saving?0.8:1}}>
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>جاري الحفظ...</>
            : saved
            ? <><CheckCircle className="h-4 w-4"/>تم الحفظ بنجاح!</>
            : <><Save className="h-4 w-4"/>حفظ التغييرات</>
          }
        </button>
      </div>

      {/* Stats summary */}
      <div className="rounded-2xl p-6 bg-white shadow-sm" style={{border:"1px solid #ccfbf1"}}>
        <h2 className="font-bold text-base mb-4 flex items-center gap-2" style={{color:C.text}}>
          <span className="w-1 h-5 rounded-full inline-block" style={{background:C.primary}}/>
          ملخص النشاط الطبي
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            {label:"إجمالي المواعيد", icon:<Calendar  className="h-5 w-5 mx-auto mb-1" style={{color:C.primary}}/>},
            {label:"وصفات طبية",      icon:<Pill       className="h-5 w-5 mx-auto mb-1" style={{color:"#7c3aed"}}/>},
            {label:"أطباء متابعون",  icon:<Stethoscope className="h-5 w-5 mx-auto mb-1" style={{color:"#0891b2"}}/>},
          ].map((item,i)=>(
            <div key={i} className="p-3 rounded-xl" style={{background:C.primaryLight,border:"1px solid #ccfbf1"}}>
              {item.icon}
              <p className="text-xs mt-1" style={{color:C.textLight}}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ data, onViewPrescription }) {
  const { stats, upcoming, past, prescriptions, doctors, user } = data;
  const nextAppt = upcoming[0] ?? null;
  const recentAppts = [...upcoming,...past].slice(0,3);

  return (
    <div className="space-y-6">
      <NextAppointmentBanner appt={nextAppt}/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Activity className="h-5 w-5"/>}        label="إجمالي المواعيد" value={stats.total}         iconBg={C.grad}/>
        <StatCard icon={<CalendarClock className="h-5 w-5"/>}   label="مواعيد قادمة"    value={stats.upcoming}      iconBg="linear-gradient(135deg,#f59e0b,#d97706)"/>
        <StatCard icon={<CheckCircle className="h-5 w-5"/>}     label="مكتملة"           value={stats.completed}     iconBg="linear-gradient(135deg,#10b981,#059669)"/>
        <StatCard icon={<FileText className="h-5 w-5"/>}        label="وصفات طبية"       value={stats.prescriptions} iconBg="linear-gradient(135deg,#8b5cf6,#7c3aed)"/>
      </div>
      <InteractiveBodySection />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2 text-[15px]" style={{color:C.text}}>
              <span className="w-1 h-5 rounded-full inline-block" style={{background:C.primary}}/>آخر المواعيد
            </h2>
            <a href="/doctors" className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl" style={{background:C.grad}}>
              <Plus className="h-3.5 w-3.5"/>احجز موعداً
            </a>
          </div>
          {recentAppts.length===0
            ? <EmptyState icon={<CalendarClock className="h-7 w-7" style={{color:C.primary}}/>} text="لا توجد مواعيد" sub="احجز موعدك الأول مع أحد الأطباء" link="/doctors" linkLabel="ابحث عن طبيب"/>
            : recentAppts.map(a=><AppointmentRow key={a.id} appt={a} onViewPrescription={onViewPrescription}/>)
          }
        </div>
        <div className="space-y-4">
          <AppointmentTimeline appointments={[...upcoming,...past]}/>
          <PrescriptionsPanel prescriptions={prescriptions} onView={onViewPrescription}/>
          <PaymentSection nextAppointment={nextAppt} user={user}/>
        </div>
      </div>
      {doctors.length>0 && (
        <div>
          <h2 className="font-bold flex items-center gap-2 text-[15px] mb-4" style={{color:C.text}}>
            <span className="w-1 h-5 rounded-full inline-block" style={{background:C.primary}}/>قائمة أطبائي
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {doctors.map(d=><DoctorCard key={d.id} doctor={d}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Medical Record Tab ────────────────────────────────────────────────────────
function MedicalRecordTab() {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-xl flex items-center gap-2" style={{color: C.text}}>
        <span className="w-1 h-6 rounded-full inline-block" style={{background: "#ef4444"}}/>
        ملفي الطبي
      </h2>
      <div className="rounded-2xl p-6 bg-white shadow-sm" style={{border: "1px solid #ccfbf1"}}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{background: "linear-gradient(135deg,#ef4444,#dc2626)"}}>
            <FileHeart className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{color: C.text}}>الملف الطبي الشامل</h3>
            <p className="text-sm mt-0.5" style={{color: C.textLight}}>أدخل معلوماتك الطبية الكاملة</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed mb-4" style={{color: C.textMid}}>
          يحتوي ملفك الطبي على جميع المعلومات الصحية الأساسية التي يحتاجها طبيبك لفهم حالتك بشكل أفضل.
        </p>
        <a
          href="/patient-dashboard/medical-record"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
          style={{background: "linear-gradient(135deg,#ef4444,#dc2626)"}}
        >
          <Heart className="h-4 w-4" />فتح ملفي الطبي<ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

// ── Pharmacy Tab ──────────────────────────────────────────────────────────────
function PharmacyTab() {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-xl flex items-center gap-2" style={{color: C.text}}>
        <span className="w-1 h-6 rounded-full inline-block" style={{background: "#0891b2"}}/>
        الصيدلية الإلكترونية
      </h2>
      <div className="rounded-2xl p-6 bg-white shadow-sm" style={{border: "1px solid #ccfbf1"}}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
            style={{background: "linear-gradient(135deg,#0891b2,#0e7490)"}}>
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{color: C.text}}>صيدليتك الإلكترونية</h3>
            <p className="text-sm mt-0.5" style={{color: C.textLight}}>ابحث عن دواء أو ارفع وصفتك</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon:"🔍", title:"بحث عن دواء",     desc:"ابحث بالاسم أو التصنيف" },
            { icon:"📋", title:"رفع وصفة طبية",   desc:"استخراج الأدوية بالذكاء الاصطناعي" },
            { icon:"📍", title:"أقرب صيدلية",     desc:"خريطة الصيدليات القريبة منك" },
          ].map((f,i) => (
            <div key={i} className="p-4 rounded-xl text-center" style={{background:C.primaryLight, border:"1px solid #99f6e4"}}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-xs font-bold" style={{color:C.text}}>{f.title}</p>
              <p className="text-xs mt-1" style={{color:C.textLight}}>{f.desc}</p>
            </div>
          ))}
        </div>

        <a
          href="/pharmacy"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
          style={{background: "linear-gradient(135deg,#0891b2,#0e7490)"}}
        >
          <ShoppingBag className="h-4 w-4" />فتح الصيدلية<ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

// ── Messages Tab ──────────────────────────────────────────────────────────────
function MessagesTab({ user, conversations = [] }) {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0] || null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[78vh]">
      <div className="bg-white rounded-3xl overflow-hidden" style={{border:"1px solid #ccfbf1",boxShadow:"0 4px 24px rgba(13,148,136,0.06)"}}>
        <div className="p-4 border-b" style={{borderColor:"#ccfbf1"}}>
          <h2 className="font-bold text-lg" style={{color:C.text}}>الأطباء</h2>
        </div>
        <div className="overflow-y-auto h-[calc(78vh-70px)]">
          {conversations.length===0 ? (
            <div className="p-6 text-center"><p style={{color:C.textLight}}>لا توجد محادثات</p></div>
          ) : (
            conversations.map((conv) => {
              const active = selectedConversation?.id === conv.id;
              return (
                <button key={conv.id} onClick={()=>setSelectedConversation(conv)}
                  className="w-full p-4 flex items-center gap-3 text-right transition-all"
                  style={{background:active?"#f0fdfa":"transparent",borderBottom:"1px solid #f0fdfa"}}>
                  <Avatar className="h-12 w-12 border-2 border-teal-200">
                    <AvatarImage src={conv.doctorImage}/>
                    <AvatarFallback>{conv.doctorName?.[0]||"د"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{color:C.text}}>د. {conv.doctorName}</p>
                    <p className="text-xs truncate" style={{color:C.textLight}}>{conv.lastMessage||conv.doctorSpecialty||"طبيب"}</p>
                  </div>
                  {conv.unreadCount>0 && (
                    <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{background:C.primary}}>
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="bg-white rounded-3xl overflow-hidden" style={{border:"1px solid #ccfbf1",boxShadow:"0 4px 24px rgba(13,148,136,0.06)"}}>
        {selectedConversation ? (
          <ChatWindow
            conversationId={selectedConversation.id}
            initialMessages={[]}
            currentUserId={user.id}
            currentUserRole="PATIENT"
            otherPerson={{name:selectedConversation.doctorName,imageUrl:selectedConversation.doctorImage,specialty:selectedConversation.doctorSpecialty}}
            conversations={conversations}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p style={{color:C.textLight}}>اختر طبيباً لبدء المحادثة</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function PatientDashboardClient({ data }) {
  const { user, stats, upcoming, past, prescriptions, doctors } = data;
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const titles = {
    overview:"لوحة التحكم",
    upcoming:"المواعيد القادمة",
    past:"المواعيد السابقة",
    prescriptions:"الوصفات الطبية",
    doctors:"أطبائي",
    profile:"ملفي الشخصي",
    "medical-record":"ملفي الطبي",
    messages:"الرسائل",
    pharmacy:"الصيدلية الإلكترونية",
  };

  const dots = {
    overview:C.primary,
    upcoming:"#f59e0b",
    past:"#10b981",
    prescriptions:"#8b5cf6",
    doctors:"#0891b2",
    profile:C.primary,
    "medical-record":"#ef4444",
    messages:C.primary,
    pharmacy:"#0891b2",
  };

  return (
    <div className="flex min-h-screen" dir="rtl" style={{background:C.primaryLight}}>
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader user={user} setMobileOpen={setMobileOpen} setActiveTab={setActiveTab}/>
        <main className="flex-1 p-6 overflow-auto">

          {activeTab==="overview"        && <OverviewTab data={{...data,user}} onViewPrescription={setSelectedPrescription}/>}
          {activeTab==="profile"         && <ProfileTab user={user}/>}
          {activeTab==="medical-record"  && <MedicalRecordTab/>}
          {activeTab==="pharmacy"        && <PharmacyTab/>}
          {activeTab==="messages"        && <MessagesTab user={user} conversations={data.conversations||[]}/>}

          {["upcoming","past","prescriptions","doctors"].includes(activeTab) && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl flex items-center gap-2" style={{color:C.text}}>
                <span className="w-1 h-6 rounded-full inline-block" style={{background:dots[activeTab]}}/>
                {titles[activeTab]}
              </h2>

              {activeTab==="upcoming" && (
                upcoming.length===0
                  ? <EmptyState icon={<CalendarClock className="h-8 w-8" style={{color:C.primary}}/>} text="لا توجد مواعيد قادمة" sub="تصفح الأطباء واحجز موعدك الأول" link="/doctors" linkLabel="ابحث عن طبيب"/>
                  : upcoming.map(a=><AppointmentRow key={a.id} appt={a} onViewPrescription={setSelectedPrescription}/>)
              )}

              {activeTab==="past" && (
                past.length===0
                  ? <EmptyState icon={<CheckCircle className="h-8 w-8" style={{color:C.primary}}/>} text="لا توجد مواعيد سابقة بعد"/>
                  : past.map(a=><AppointmentRow key={a.id} appt={a} onViewPrescription={setSelectedPrescription}/>)
              )}

              {activeTab==="prescriptions" && (
                prescriptions.length===0
                  ? <EmptyState icon={<FileText className="h-8 w-8" style={{color:C.primary}}/>} text="لا توجد وصفات طبية بعد" sub="ستظهر هنا بعد أن يكتب لك طبيبك وصفة"/>
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {prescriptions.map(rx=>(
                        <button key={rx.id} onClick={()=>setSelectedPrescription(rx)}
                          className="p-5 rounded-2xl bg-white text-right w-full transition-all"
                          style={{border:"1px solid #ccfbf1"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#8b5cf6";e.currentTarget.style.boxShadow="0 4px 20px rgba(139,92,246,0.1)";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#ccfbf1";e.currentTarget.style.boxShadow="none";}}>
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{background:"#ede9fe"}}>
                            <Pill className="h-5 w-5" style={{color:"#7c3aed"}}/>
                          </div>
                          <p className="font-bold text-sm" style={{color:C.text}}>{rx.diagnosis??"وصفة طبية"}</p>
                          <p className="text-xs mt-1" style={{color:C.textLight}}>د. {rx.doctor?.name} · {rx.doctor?.specialty}</p>
                          <p className="text-xs mt-0.5" style={{color:"#99f6e4"}}>{fmtDate(rx.appointmentDate)}</p>
                          <div className="flex items-center justify-between mt-3 pt-3" style={{borderTop:"1px solid #ccfbf1"}}>
                            <span className="text-xs" style={{color:C.textLight}}>{Array.isArray(rx.medications)?rx.medications.length:0} أدوية</span>
                            <span className="text-xs font-medium" style={{color:"#7c3aed"}}>عرض الوصفة ←</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
              )}

              {activeTab==="doctors" && (
                doctors.length===0
                  ? <EmptyState icon={<Stethoscope className="h-8 w-8" style={{color:C.primary}}/>} text="لم تتشاور مع أي طبيب بعد" link="/doctors" linkLabel="تصفح الأطباء"/>
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {doctors.map(d=><DoctorCard key={d.id} doctor={d}/>)}
                    </div>
                  )
              )}
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!selectedPrescription} onOpenChange={()=>setSelectedPrescription(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base" style={{color:C.text}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"#ede9fe"}}>
                <Pill className="h-4 w-4" style={{color:"#7c3aed"}}/>
              </div>
              الوصفة الطبية
            </DialogTitle>
          </DialogHeader>
          <PrescriptionView prescription={selectedPrescription}/>
        </DialogContent>
      </Dialog>
    </div>
  );
}