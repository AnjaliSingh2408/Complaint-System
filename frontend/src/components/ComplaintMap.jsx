import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const ComplaintMap = ({
  complaint,
}) => {
  const latitude =
    complaint.location.coordinates[1];

  const longitude =
    complaint.location.coordinates[0];

  return (
    <div
      style={{
        height: "280px",
        width: "100%",
        marginTop: "12px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={[
          latitude,
          longitude,
        ]}
        zoom={18}
        scrollWheelZoom={true}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            latitude,
            longitude,
          ]}
        >
          <Popup>
            Complaint Location
            <br />
            {
              complaint.location
                .address
            }
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default ComplaintMap;