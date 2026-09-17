const AMENITY_ICON_BASE =
  'https://ccs-infratech-635891305240-ap-south-1-an.s3.ap-south-1.amazonaws.com/amenities';

const AMENITY_FILES: Record<string, string> = {
  'car parks': 'parked-car.png',
  'car park': 'parked-car.png',
  vanity: 'vanity.png',
  wardrobe: 'wardrobe.png',
  security: 'security-camera.png',
  gym: 'dumbbell.png',
  swimming: 'swimming.png',
  'swimming pool': 'swimming.png',
  'running track': 'run.png',
  'indoor games': 'game.png',
  'multipurpose hall': 'high-school.png',
};

export function resolveAmenityImageUrl(name: string, imageUrl?: string | null): string {
  const file = AMENITY_FILES[name.trim().toLowerCase()];
  if (file) {
    return `${AMENITY_ICON_BASE}/${file}`;
  }

  return imageUrl || '';
}
