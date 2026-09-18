import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const walkthroughs = [
  {
    id: 'amor-overview',
    title: 'Amor Project Overview',
    description:
      'Take a first look at the setting, architecture, and lifestyle at Amor.',
    videoUrl:
      'https://res.cloudinary.com/dtwlug9w9/video/upload/v1767467893/video_eb0r0t.mp4',
    thumbnail: '/images/DayView.png',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'amor-living',
    title: 'A Day at Amor',
    description:
      'Explore the spaces designed for relaxed, modern family living.',
    videoUrl:
      'https://res.cloudinary.com/dtwlug9w9/video/upload/v1767467893/video_eb0r0t.mp4',
    thumbnail: '/images/ClubhouseNightView.jpg',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'amor-amenities',
    title: 'Amenities Walkthrough',
    description:
      'Discover the amenities and outdoor spaces that complete the community.',
    videoUrl:
      'https://res.cloudinary.com/dtwlug9w9/video/upload/v1767467893/video_eb0r0t.mp4',
    thumbnail: '/images/BadmintonCourt.png',
    isActive: true,
    sortOrder: 2,
  },
];

async function main() {
  for (const walkthrough of walkthroughs) {
    await prisma.walkthrough.upsert({
      where: { id: walkthrough.id },
      update: walkthrough,
      create: walkthrough,
    });

    console.log(`Seeded: ${walkthrough.title}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
