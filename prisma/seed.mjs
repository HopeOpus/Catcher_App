#!/usr/bin/env node

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL?.replace(/^"|"$/g, "");

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function parseAdminEmails(value) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function buildSeedAdminId(email) {
  return `seed-admin-${email.replace(/[^a-z0-9]+/gi, "-")}`.slice(0, 255);
}

function buildSeedAdminName(email) {
  const localPart = email.split("@")[0] ?? "admin";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "Admin User";
}

const user = {
  id: "default-user",
  email: "default@catcher.com",
  name: "Default User",
};

const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);

const preRegisteredProperties = [
  {
    id: "vehicle-1",
    name: "2023 Toyota Camry",
    type: "Vehicle",
    description: "Black sedan with leather interior",
    imageUrl: "/uploads/1kil7snsx_z7hzitf1g.jpg",
  },
  {
    id: "electronics-1",
    name: "iPhone 15 Pro",
    type: "Electronics",
    description: "128GB, Natural Titanium",
    imageUrl: "/uploads/84a6wjrel_13dq07umn.jpeg",
  },
  {
    id: "jewelry-1",
    name: "Rolex Submariner",
    type: "Jewelry",
    description: "Stainless steel with black dial",
    imageUrl: "/uploads/b8bqg5rqy_kedh7zmwm.jpg",
  },
];

const seedProperties = [
  {
    id: "seed-property-vehicle-1",
    userId: user.id,
    name: "2023 Toyota Camry",
    type: "Vehicle",
    serialNumber: "4T1BF1FK8RU123456",
    description: "Black sedan with leather interior",
    dateRegistered: new Date("2024-01-15"),
    status: "Stolen",
    photoUrl: "/uploads/1kil7snsx_z7hzitf1g.jpg",
  },
  {
    id: "seed-property-electronics-1",
    userId: user.id,
    name: "iPhone 15 Pro",
    type: "Electronics",
    serialNumber: "F123456789",
    description: "128GB, Natural Titanium",
    dateRegistered: new Date("2024-01-10"),
    status: "Stolen",
    photoUrl: "/uploads/84a6wjrel_13dq07umn.jpeg",
  },
  {
    id: "seed-property-jewelry-1",
    userId: user.id,
    name: "Rolex Submariner",
    type: "Jewelry",
    serialNumber: "M123456",
    description: "Stainless steel with black dial",
    dateRegistered: new Date("2024-01-05"),
    status: "Flagged",
    photoUrl: null,
  },
];

const propertyPhotos = [
  {
    id: "seed-photo-vehicle-1",
    propertyId: "seed-property-vehicle-1",
    fileName: "toyota-camry-front.jpg",
    fileUrl: "/uploads/1kil7snsx_z7hzitf1g.jpg",
    fileType: "image/jpeg",
  },
  {
    id: "seed-photo-electronics-1",
    propertyId: "seed-property-electronics-1",
    fileName: "iphone-15-pro.jpeg",
    fileUrl: "/uploads/84a6wjrel_13dq07umn.jpeg",
    fileType: "image/jpeg",
  },
  {
    id: "seed-photo-jewelry-1",
    propertyId: "seed-property-jewelry-1",
    fileName: "rolex-submariner.jpg",
    fileUrl: "/uploads/b8bqg5rqy_kedh7zmwm.jpg",
    fileType: "image/jpeg",
  },
];

const subscriptions = [
  {
    id: "seed-subscription-premium",
    userId: user.id,
    planId: "premium",
    planName: "Premium",
    price: 9.99,
    period: "monthly",
    status: "active",
    startDate: new Date("2026-03-01"),
    endDate: new Date("2026-04-01"),
  },
];

const propertyCoverages = [
  {
    id: "seed-coverage-vehicle-1",
    propertyId: "seed-property-vehicle-1",
    userId: user.id,
    planCode: "yearly",
    planName: "Yearly Property Coverage",
    priceNgnKobo: 500000,
    currency: "NGN",
    status: "active",
    startsAt: new Date("2026-01-15T00:00:00.000Z"),
    expiresAt: new Date("2027-01-15T00:00:00.000Z"),
    graceEndsAt: new Date("2027-01-22T00:00:00.000Z"),
    paystackReference: "seed-paystack-reference-vehicle-1",
  },
  {
    id: "seed-coverage-electronics-1",
    propertyId: "seed-property-electronics-1",
    userId: user.id,
    planCode: "monthly",
    planName: "Monthly Property Coverage",
    priceNgnKobo: 80000,
    currency: "NGN",
    status: "active",
    startsAt: new Date("2026-03-10T00:00:00.000Z"),
    expiresAt: new Date("2026-04-09T00:00:00.000Z"),
    graceEndsAt: new Date("2026-04-16T00:00:00.000Z"),
    paystackReference: "seed-paystack-reference-electronics-1",
  },
  {
    id: "seed-coverage-jewelry-1",
    propertyId: "seed-property-jewelry-1",
    userId: user.id,
    planCode: "free",
    planName: "Free Property Coverage",
    priceNgnKobo: 0,
    currency: "NGN",
    status: "active",
    startsAt: new Date("2026-01-05T00:00:00.000Z"),
    expiresAt: null,
    graceEndsAt: null,
    paystackReference: null,
  },
];

const stolenReports = [
  {
    id: "seed-stolen-report-vehicle-1",
    userId: user.id,
    propertyId: "seed-property-vehicle-1",
    propertyName: "2023 Toyota Camry",
    serialNumber: "4T1BF1FK8RU123456",
    dateReported: new Date("2024-01-15"),
    location: "Lagos, Nigeria",
    description:
      "Vehicle was stolen from my driveway while parked overnight. Last seen at 10 PM.",
    status: "UnderInvestigation",
    evidenceUrls: ["/evidence1.jpg", "/evidence2.jpg"],
  },
  {
    id: "seed-stolen-report-electronics-1",
    userId: user.id,
    propertyId: "seed-property-electronics-1",
    propertyName: "iPhone 15 Pro",
    serialNumber: "F123456789",
    dateReported: new Date("2024-01-10"),
    location: "Abuja, Nigeria",
    description:
      "Phone was stolen during a robbery at the shopping mall. Had tracking enabled.",
    status: "Reported",
    evidenceUrls: ["/evidence3.jpg"],
  },
];

async function main() {
  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email, name: user.name },
    create: user,
  });

  for (const adminEmail of adminEmails) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: "Admin",
      },
      create: {
        id: buildSeedAdminId(adminEmail),
        email: adminEmail,
        name: buildSeedAdminName(adminEmail),
        role: "Admin",
      },
    });
  }

  for (const property of preRegisteredProperties) {
    await prisma.preRegisteredProperty.upsert({
      where: { id: property.id },
      update: property,
      create: property,
    });
  }

  for (const property of seedProperties) {
    await prisma.property.upsert({
      where: { id: property.id },
      update: property,
      create: property,
    });
  }

  for (const photo of propertyPhotos) {
    await prisma.propertyPhoto.upsert({
      where: { id: photo.id },
      update: photo,
      create: photo,
    });
  }

  for (const subscription of subscriptions) {
    await prisma.subscription.upsert({
      where: { id: subscription.id },
      update: subscription,
      create: subscription,
    });
  }

  for (const coverage of propertyCoverages) {
    await prisma.propertyCoverage.upsert({
      where: { id: coverage.id },
      update: coverage,
      create: coverage,
    });
  }

  for (const report of stolenReports) {
    await prisma.stolenReport.upsert({
      where: { id: report.id },
      update: report,
      create: report,
    });
  }

  console.log(
    `Remote database seeded successfully. Admin users ensured: ${adminEmails.length}.`,
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

