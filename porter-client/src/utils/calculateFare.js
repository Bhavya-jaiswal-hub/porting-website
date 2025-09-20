export default function calculateFare(distanceInKm) {
  const baseFare = 40;
  const now = new Date();
  const hours = now.getHours();
  let perKmRate = 14;

  if (hours >= 8 && hours < 11) {
    perKmRate = distanceInKm <= 5 ? 19 : 14;
  } else if (hours >= 11 && hours < 17) {
    perKmRate = distanceInKm <= 5 ? 17.5 : distanceInKm <= 15 ? 12.5 : 9.5;
  } else if (hours >= 17 && hours < 24) {
    perKmRate = distanceInKm <= 5 ? 19 : 14;
  }

  return Math.round(baseFare + distanceInKm * perKmRate);
}
