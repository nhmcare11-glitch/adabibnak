export const metadata = {
  title: "Find Doctors - Adabibanek",
  description: "تصفح وحدد المواعيد مع أفضل مقدمي الرعاية الصحية",
};

export default async function DoctorsLayout({ children }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">{children}</div>
    </div>
  );
}
