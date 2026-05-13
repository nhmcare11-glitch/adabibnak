import { getCurrentUser } from "@/actions/user";
import { redirect } from "next/navigation";
import { getAllAppointmentsForSecretary, getDoctorsListForSecretary, getPatientsListForSecretary } from "@/actions/secretary";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Users, UserRound, MessageCircle, CreditCard } from "lucide-react";
import SecretaryAppointmentsList from "./_components/appointments-list";
import SecretaryPatientsList from "./_components/patients-list";
import SecretaryDoctorsList from "./_components/doctors-list";
import ConversationsList from "@/components/conversations-list";
import SecretaryPaymentsList from "./_components/secretary-payments";

export default async function SecretaryDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SECRETARY") redirect("/onboarding");

  const [appointmentsData, doctorsData, patientsData] = await Promise.all([
    getAllAppointmentsForSecretary(),
    getDoctorsListForSecretary(),
    getPatientsListForSecretary(),
  ]);

  return (
    <div className="container mx-auto p-4" suppressHydrationWarning>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">لوحة تحكم السكرتيرة</h1>
        <p className="text-muted-foreground">
          مرحباً {user.name}، يمكنك إدارة المواعيد والمرضى من هنا
        </p>
      </div>

      <Tabs
        defaultValue="appointments"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        suppressHydrationWarning
      >
        <TabsList className="md:col-span-1 bg-muted/30 border h-auto flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0">
          <TabsTrigger value="appointments" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <Calendar className="h-4 w-4 mr-2 hidden md:inline" />
            <span>المواعيد</span>
          </TabsTrigger>

          <TabsTrigger value="payments" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <CreditCard className="h-4 w-4 mr-2 hidden md:inline" />
            <span>المدفوعات</span>
          </TabsTrigger>

          <TabsTrigger value="patients" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <Users className="h-4 w-4 mr-2 hidden md:inline" />
            <span>المرضى</span>
          </TabsTrigger>

          <TabsTrigger value="doctors" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <UserRound className="h-4 w-4 mr-2 hidden md:inline" />
            <span>الأطباء</span>
          </TabsTrigger>

          <TabsTrigger value="conversations" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <MessageCircle className="h-4 w-4 mr-2 hidden md:inline" />
            <span>المحادثات</span>
          </TabsTrigger>
        </TabsList>

        <div className="md:col-span-3">
          <TabsContent value="appointments" className="border-none p-0">
            <SecretaryAppointmentsList
              appointments={appointmentsData.appointments || []}
            />
          </TabsContent>

          {/* ✅ تاب المدفوعات الجديد */}
          <TabsContent value="payments" className="border-none p-0">
            <SecretaryPaymentsList
              appointments={appointmentsData.appointments || []}
            />
          </TabsContent>

          <TabsContent value="patients" className="border-none p-0">
            <SecretaryPatientsList patients={patientsData.patients || []} />
          </TabsContent>

          <TabsContent value="doctors" className="border-none p-0">
            <SecretaryDoctorsList doctors={doctorsData.doctors || []} />
          </TabsContent>

          <TabsContent value="conversations" className="border-none p-0">
            <ConversationsList userRole="SECRETARY" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}