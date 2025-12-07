// Minimal location helpers used by components
export const getCurrentLocation = async ({ timeout = 10000 } = {}) => {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return {
      ok: false,
      error: "Geolocation is not supported in this environment",
    };
  }

  return new Promise((resolve) => {
    let finished = false;

    const onSuccess = (pos) => {
      if (finished) return;
      finished = true;
      resolve({
        ok: true,
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        },
      });
    };

    const onError = (err) => {
      if (finished) return;
      finished = true;
      resolve({ ok: false, error: err?.message || String(err) });
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout,
    });

    // Fallback timeout in case the browser behaves unexpectedly
    setTimeout(() => {
      if (finished) return;
      finished = true;
      resolve({ ok: false, error: "Location request timed out" });
    }, timeout + 500);
  });
};

export const buildMapsLink = (lat, lng) => {
  if (!lat || !lng) return null;
  try {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  } catch (e) {
    return null;
  }
};

export default {
  getCurrentLocation,
  buildMapsLink,
};
