import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { Plant } from "@/lib/plants";
import { PLANT_COLORS, plantRadius } from "@/lib/plants";

export default function PlantsMap({ plants }: { plants: Plant[] }) {
  return (
    <MapContainer center={[39.0, 35.2]} zoom={6} className="h-[450px] w-full" scrollWheelZoom={false}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {plants.map((p) => {
        const color = PLANT_COLORS[p.type];
        const dashed = p.status === "under construction" || p.status === "uncertain";
        const lignite = p.type === "coal" && p.fuel === "domestic lignite";
        return (
          <CircleMarker
            key={p.name}
            center={[p.lat, p.lon]}
            radius={plantRadius(p.capacity_mw)}
            pathOptions={{
              color,
              weight: lignite ? 3 : 1.5,
              fillColor: color,
              fillOpacity: lignite ? 0 : 0.75,
              dashArray: dashed ? "4 3" : undefined,
            }}
          >
            <Popup>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <strong style={{ fontSize: 14 }}>{p.name}</strong>
                <br />
                Type: {p.type}
                <br />
                Fuel: {p.fuel}
                <br />
                Capacity: {p.capacity_mw.toLocaleString("en-US")} MW
                <br />
                Status: {p.status}
                {p.note && (
                  <>
                    <br />
                    <em>{p.note}</em>
                  </>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
