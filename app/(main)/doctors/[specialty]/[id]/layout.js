import { getDoctorById } from "@/actions/appointments";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({ params }) {
  const { id } = await params;

  const { doctor } = await getDoctorById(id);
  return {
    title: `Dr. ${doctor.name} - Adabibanek`,
    description: `احجز موعدًا مع Dr. ${doctor.name}, ${doctor.specialty} متخصص في ${doctor.experience} سنوات الخبرة.`,
  };
}

export default async function DoctorProfileLayout({ children, params }) {
  const { id } = await params;
  const { doctor } = await getDoctorById(id);

  if (!doctor) redirect("/doctors");

  return (
    <div className="container mx-auto">
      <PageHeader
        // icon={<Stethoscope />}
        title={"Dr. " + doctor.name}
        backLink={`/doctors/${doctor.specialty}`}
        backLabel={`Back to ${doctor.specialty}`}
      />

      {children}
    </div>
  );
}
