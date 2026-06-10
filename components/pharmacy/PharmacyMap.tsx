"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// إصلاح أيقونة الـ marker في Next.js
const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  drugId: string;
}

export default function PharmacyMap({ drugId }: Props) {
  const [pharmacies, setPharmacies] = useState([]);
  const [userLocation, setUserLocation] = useState({ lat: 36.7538, lng: 3.0588 }); // الجزائر العاصمة default

  useEffect(() => {
    // جلب موقع المستخدم
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  useEffect(() => {
    if (!drugId) return;
    fetch(`/api/pharmacy/pharmacies?lat=${userLocation.lat}&lng=${userLocation.lng}&drugId=${drugId}`)
      .then((r) => r.json())
      .then((data) => setPharmacies(data.pharmacies));
  }, [drugId, userLocation]);

  return (
    <div className="space-y-4">
      {/* الخريطة */}
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={13}
        className="h-64 w-full rounded-xl z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pharmacies.map((p: any) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={icon}>
            <Popup>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm">{p.address}</p>
              <span className={p.drugStatus === "available" ? "text-green-600" : "text-red-500"}>
                {p.drugStatus === "available" ? "✓ متوفر" : "✗ غير متوفر"}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* قائمة الصيدليات */}
      <div className="space-y-2">
        {pharmacies.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.distance.toFixed(1)} كم • {p.address}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              p.drugStatus === "available"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-500"
            }`}>
              {p.drugStatus === "available" ? "متوفر" : "غير متوفر"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}