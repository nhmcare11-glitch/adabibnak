"use client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function DraggableMarker({ coords, setCoords }) {
  useMapEvents({
    click(e) { setCoords({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return (
    <Marker
      position={[coords.lat, coords.lng]}
      draggable
      eventHandlers={{
        dragend: (e) => setCoords({
          lat: e.target.getLatLng().lat,
          lng: e.target.getLatLng().lng,
        }),
      }}
    />
  );
}

export default function LocationMap({ coords, setCoords, onConfirm, onClose }) {
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DraggableMarker coords={coords} setCoords={setCoords} />
      </MapContainer>

      {/* تلميح */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, background: "rgba(0,0,0,0.65)", color: "#fff",
        borderRadius: 8, padding: "5px 12px", fontSize: 12, whiteSpace: "nowrap"
      }}>
        اضغط على الخريطة أو اسحب المؤشر لتحديد موقعك
      </div>

      {/* أزرار */}
      <div style={{
        position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, display: "flex", gap: 8
      }}>
        <button
          onClick={() => onConfirm(coords.lat, coords.lng)}
          style={{
            background: "#0d9488", color: "#fff", border: "none",
            borderRadius: 10, padding: "8px 20px", fontWeight: 700,
            fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.4)"
          }}
        >
          ✓ تأكيد الموقع
        </button>
        <button
          onClick={onClose}
          style={{
            background: "#fff", color: "#555", border: "1px solid #ddd",
            borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer"
          }}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}