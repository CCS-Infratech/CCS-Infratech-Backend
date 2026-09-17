require("dotenv").config();

const {
  PrismaClient,
  ProjectStatus,
  ProjectCategory,
} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("========================================");
  console.log(" Adding REAL CCS Projects");
  console.log("========================================");

  // Find an active admin to use as author
  const admin = await prisma.user.findFirst({
    where: {
      role: "admin",
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  if (!admin) {
    throw new Error("No active admin user found.");
  }

  console.log(`Using admin: ${admin.username} (${admin.email})`);

  // ==================================================
  // AMOR
  // ==================================================

  const amor = await prisma.project.upsert({
    where: {
      slug: "amor-reality",
    },

    update: {
      title: "AMOR",

      description:
        "AMOR represents our ambition to redefine modern living. As Lucknow's first AI-powered villa community, this RERA-approved project features 105 luxurious villas that blend Roman-inspired architecture with cutting-edge smart home technology.",

      content:
        "AMOR represents our ambition to redefine modern living. As Lucknow's first AI-powered villa community, this RERA-approved project features 105 luxurious villas that blend Roman-inspired architecture with cutting-edge smart home technology.",

      logoUrl: "/logo/amor-logo64.png",

      status: ProjectStatus.UNDER_CONSTRUCTION,

      category: ProjectCategory.RESIDENTIAL,

      featured: true,

      published: true,

      publishedAt: new Date(),

      overviewHeadline: "Redefining modern living",

      overviewDescription:
        "AMOR represents our ambition to redefine modern living. As Lucknow's first AI-powered villa community, this RERA-approved project features 105 luxurious villas that blend Roman-inspired architecture with cutting-edge smart home technology.",

      location: "Lucknow, UP",

      locationDetails:
        "AMOR, Sarai Shekh Farm, Near SBI Bank and Nayara Petrol Pump, Satrikhroad, Chinhat, Lucknow - 227105",

      authorId: admin.id,
    },

    create: {
      title: "AMOR",

      slug: "amor-reality",

      description:
        "AMOR represents our ambition to redefine modern living. As Lucknow's first AI-powered villa community, this RERA-approved project features 105 luxurious villas that blend Roman-inspired architecture with cutting-edge smart home technology.",

      content:
        "AMOR represents our ambition to redefine modern living. As Lucknow's first AI-powered villa community, this RERA-approved project features 105 luxurious villas that blend Roman-inspired architecture with cutting-edge smart home technology.",

      logoUrl: "/logo/amor-logo64.png",

      status: ProjectStatus.UNDER_CONSTRUCTION,

      category: ProjectCategory.RESIDENTIAL,

      featured: true,

      published: true,

      publishedAt: new Date(),

      overviewHeadline: "Redefining modern living",

      overviewDescription:
        "AMOR represents our ambition to redefine modern living. As Lucknow's first AI-powered villa community, this RERA-approved project features 105 luxurious villas that blend Roman-inspired architecture with cutting-edge smart home technology.",

      location: "Lucknow, UP",

      locationDetails:
        "AMOR, Sarai Shekh Farm, Near SBI Bank and Nayara Petrol Pump, Satrikhroad, Chinhat, Lucknow - 227105",

      authorId: admin.id,
    },
  });

  // Remove old gallery records for this project
  await prisma.projectImage.deleteMany({
    where: {
      projectId: amor.id,
    },
  });

  // Add AMOR main image
  await prisma.projectImage.create({
    data: {
      projectId: amor.id,
      url: "/images/amor.avif",
      filename: "amor.avif",
      alt: "AMOR luxury villa community in Lucknow",
      caption: "AMOR — Luxury villa community in Lucknow",
      isFeatured: true,
      displayOrder: 0,
    },
  });

  console.log("✅ AMOR created/updated");

  // ==================================================
  // CHISTI COLD STORAGE
  // ==================================================

  const coldStorage = await prisma.project.upsert({
    where: {
      slug: "chisti-cold-storage",
    },

    update: {
      title: "Chisti Cold Storage",

      description:
        "Our journey from agricultural trade to cold storage reflects our ability to evolve while staying true to our core values of integrity, innovation, and excellence in preserving quality.",

      content:
        "Our journey from agricultural trade to cold storage reflects our ability to evolve while staying true to our core values of integrity, innovation, and excellence in preserving quality.",

      // Required by the current schema.
      // No separate Chisti logo asset is currently available.
      logoUrl: "",

      status: ProjectStatus.COMPLETED,

      category: ProjectCategory.INDUSTRIAL,

      featured: false,

      published: true,

      publishedAt: new Date(),

      overviewHeadline: "From agricultural trade to cold storage",

      overviewDescription:
        "Our journey from agricultural trade to cold storage reflects our ability to evolve while staying true to our core values of integrity, innovation, and excellence in preserving quality.",

      location: "Lucknow, UP",

      locationDetails: "Lucknow, UP",

      authorId: admin.id,
    },

    create: {
      title: "Chisti Cold Storage",

      slug: "chisti-cold-storage",

      description:
        "Our journey from agricultural trade to cold storage reflects our ability to evolve while staying true to our core values of integrity, innovation, and excellence in preserving quality.",

      content:
        "Our journey from agricultural trade to cold storage reflects our ability to evolve while staying true to our core values of integrity, innovation, and excellence in preserving quality.",

      logoUrl: "",

      status: ProjectStatus.COMPLETED,

      category: ProjectCategory.INDUSTRIAL,

      featured: false,

      published: true,

      publishedAt: new Date(),

      overviewHeadline: "From agricultural trade to cold storage",

      overviewDescription:
        "Our journey from agricultural trade to cold storage reflects our ability to evolve while staying true to our core values of integrity, innovation, and excellence in preserving quality.",

      location: "Lucknow, UP",

      locationDetails: "Lucknow, UP",

      authorId: admin.id,
    },
  });

  // Remove old gallery records for this project
  await prisma.projectImage.deleteMany({
    where: {
      projectId: coldStorage.id,
    },
  });

  // Add Cold Storage main image
  await prisma.projectImage.create({
    data: {
      projectId: coldStorage.id,
      url: "/images/COLD-STORAGE.jpg",
      filename: "COLD-STORAGE.jpg",
      alt: "Chisti Cold Storage in Lucknow",
      caption: "Chisti Cold Storage",
      isFeatured: true,
      displayOrder: 0,
    },
  });

  console.log("✅ Chisti Cold Storage created/updated");

  // ==================================================
  // FINAL OUTPUT
  // ==================================================

  console.log("");
  console.log("========================================");
  console.log(" REAL PROJECTS READY");
  console.log("========================================");

  console.log("");
  console.log("AMOR");
  console.log({
    id: amor.id,
    title: amor.title,
    slug: amor.slug,
    category: amor.category,
    status: amor.status,
    published: amor.published,
    image: "/images/amor.avif",
  });

  console.log("");
  console.log("Chisti Cold Storage");
  console.log({
    id: coldStorage.id,
    title: coldStorage.title,
    slug: coldStorage.slug,
    category: coldStorage.category,
    status: coldStorage.status,
    published: coldStorage.published,
    image: "/images/COLD-STORAGE.jpg",
  });

  console.log("");
  console.log("Public URLs:");
  console.log("https://www.ccsinfratech.com/projects");
  console.log("https://www.ccsinfratech.com/projects/amor-reality");
  console.log("https://www.ccsinfratech.com/projects/chisti-cold-storage");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ SEED FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
