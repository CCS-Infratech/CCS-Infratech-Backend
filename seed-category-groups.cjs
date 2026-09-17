require("dotenv").config();

const { PrismaClient, ProjectCategory } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("========================================");
  console.log(" Creating Category-Based Project Groups");
  console.log("========================================");

  const groups = [
    {
      name: "Residential",
      slug: "residential",
      description:
        "Residential developments and premium living projects by CCS Infratech.",
      coverImageUrl: "/images/amor.avif",
      sortOrder: 1,
      category: ProjectCategory.RESIDENTIAL,
    },
    {
      name: "Commercial",
      slug: "commercial",
      description:
        "Commercial developments and business-focused projects by CCS Infratech.",
      coverImageUrl: "/images/aerial.png",
      sortOrder: 2,
      category: ProjectCategory.COMMERCIAL,
    },
    {
      name: "Industrial",
      slug: "industrial",
      description:
        "Industrial and infrastructure projects by CCS Infratech.",
      coverImageUrl: "/images/COLD-STORAGE.jpg",
      sortOrder: 3,
      category: ProjectCategory.INDUSTRIAL,
    },
  ];

  for (const item of groups) {
    const group = await prisma.projectGroup.upsert({
      where: {
        slug: item.slug,
      },
      update: {
        name: item.name,
        description: item.description,
        coverImageUrl: item.coverImageUrl,
        isActive: true,
        sortOrder: item.sortOrder,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        coverImageUrl: item.coverImageUrl,
        isActive: true,
        sortOrder: item.sortOrder,
      },
    });

    const result = await prisma.project.updateMany({
      where: {
        category: item.category,
      },
      data: {
        groupId: group.id,
      },
    });

    console.log("");
    console.log(`✅ ${item.name}`);
    console.log(`   Group ID: ${group.id}`);
    console.log(`   Projects assigned: ${result.count}`);
  }

  console.log("");
  console.log("========================================");
  console.log(" GROUPS READY");
  console.log("========================================");

  const groupsWithProjects = await prisma.projectGroup.findMany({
    where: {
      slug: {
        in: ["residential", "commercial", "industrial"],
      },
    },
    include: {
      projects: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          published: true,
        },
        orderBy: {
          title: "asc",
        },
      },
      _count: {
        select: {
          projects: true,
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  console.log(JSON.stringify(groupsWithProjects, null, 2));
}

main()
  .catch((error) => {
    console.error("❌ GROUP CREATION FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
