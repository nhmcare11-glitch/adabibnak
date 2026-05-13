import { User, Star, Calendar, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import StartChatButton from "@/components/start-chat-button";

export function DoctorCard({ doctor }) {
  return (
    <Card className="border-blue-900/20 hover:border-blue-700/40 transition-all">
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            {doctor.imageUrl ? (
              <img
                src={doctor.imageUrl}
                alt={doctor.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-blue-400" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <h3 className="font-medium text-foreground text-lg">{doctor.name}</h3>
              <Badge
                variant="outline"
                className="bg-blue-900/20 border-blue-900/30 text-blue-400 self-start"
              >
                <Star className="h-3 w-3 mr-1" />
                تم التحقق
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-1">
              {doctor.specialty} • {doctor.experience} سنوات خبرة
            </p>

            <div className="mt-4 line-clamp-2 text-sm text-muted-foreground mb-4">
              {doctor.description}
            </div>

            {/* الأزرار */}
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button
                asChild
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                <Link href={`/doctors/${doctor.specialty}/${doctor.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  عرض الملف وحجز
                </Link>
              </Button>

              <StartChatButton doctorId={doctor.id} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}