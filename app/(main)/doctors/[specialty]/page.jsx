import { redirect } from "next/navigation";
import { getDoctorsBySpecialty } from "@/actions/doctors-listing";
import { DoctorCard } from "../components/doctor-card";
import { PageHeader } from "@/components/page-header";

export default async function DoctorSpecialtyPage({ params }) {
  const { specialty } = await params;

  // Redirect to main doctors page if no specialty is provided
  if (!specialty) {
    redirect("/doctors");
  }

  // Fetch doctors by specialty
  const { doctors, error } = await getDoctorsBySpecialty(specialty);

  if (error) {
    console.error("خطأ في جلب الأطباء:", error);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={decodeURIComponent(specialty)}
        backLink="/doctors"
        backLabel="جميع التخصصات"
      />

      {doctors && doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-foreground mb-2">
            لا يوجد أطباء متاحون
          </h3>
          <p className="text-muted-foreground">
            لا يوجد حاليًا أطباء معتمدون في هذا التخصص. يرجى معاودة التحقق لاحقًا أو اختيار تخصص آخر
          </p>
        </div>
      )}
    </div>
  );
}