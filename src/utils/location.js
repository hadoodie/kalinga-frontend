export const getCurrentLocation = ({ timeout = 10000 } = {}) =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({
        ok: false,
        error: "Geolocation is not supported in this browser.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        });
      },
      (error) => {
        let message = error?.message || "Unable to acquire location.";

        switch (error?.code) {
          case error?.PERMISSION_DENIED:
            message = "Location permission denied by the user.";
            break;
          case error?.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error?.TIMEOUT:
            message = "Location request timed out.";
            break;
          default:
            break;
        }

        resolve({ ok: false, error: message });
      },
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });

export const buildMapsLink = (latitude, longitude) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
