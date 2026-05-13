import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 500 }}>
        403 — غير مصرح لك بالدخول
      </h1>
      <p style={{ color: "#888", maxWidth: 400, lineHeight: 1.7 }}>
        ليس لديك صلاحية للوصول إلى هذه الصفحة. إذا كنت تعتقد أن هذا خطأ،
        تواصل مع الدعم.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1.5rem",
          background: "#000",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          fontSize: "14px",
        }}
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}