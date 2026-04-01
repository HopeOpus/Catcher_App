import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";
import {
  buildUserProfileStatus,
  normalizeProfileValue,
} from "@/lib/profile";
import { normalizeStoredPhotoUrl } from "@/lib/catcher-domain";

const PHONE_NUMBER_PATTERN = /^[0-9+()\-\s]{7,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPhoneNumber(value: string) {
  return PHONE_NUMBER_PATTERN.test(value);
}

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value);
}

async function getCurrentProfileStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      profileImageUrl: true,
      phoneNumber: true,
      nextOfKinEmail: true,
      nextOfKinPhone: true,
    },
  });

  if (!user) {
    return null;
  }

  return buildUserProfileStatus({
    ...user,
    profileImageUrl: user.profileImageUrl
      ? normalizeStoredPhotoUrl(user.profileImageUrl)
      : null,
  });
}

export async function GET() {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const profileStatus = await getCurrentProfileStatus(authenticatedUser.userId);

    if (!profileStatus) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(profileStatus);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const body = await request.json();
    const profileImageUrl = normalizeProfileValue(body.profileImageUrl);
    const phoneNumber = normalizeProfileValue(body.phoneNumber);
    const nextOfKinEmail = normalizeProfileValue(body.nextOfKinEmail);
    const nextOfKinPhone = normalizeProfileValue(body.nextOfKinPhone);

    const fieldErrors: Record<string, string> = {};

    if (profileImageUrl && profileImageUrl.length > 500) {
      fieldErrors.profileImageUrl =
        "Profile image URL is too long. Please upload the picture again.";
    }

    if (!phoneNumber) {
      fieldErrors.phoneNumber = "Phone number is required.";
    } else if (!isValidPhoneNumber(phoneNumber)) {
      fieldErrors.phoneNumber =
        "Enter a valid phone number using 7 to 20 digits or symbols.";
    }

    if (!nextOfKinEmail) {
      fieldErrors.nextOfKinEmail = "Next of kin email is required.";
    } else if (!isValidEmail(nextOfKinEmail)) {
      fieldErrors.nextOfKinEmail = "Enter a valid email address.";
    }

    if (!nextOfKinPhone) {
      fieldErrors.nextOfKinPhone = "Next of kin phone number is required.";
    } else if (!isValidPhoneNumber(nextOfKinPhone)) {
      fieldErrors.nextOfKinPhone =
        "Enter a valid phone number using 7 to 20 digits or symbols.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          error: "Please correct the highlighted fields.",
          fieldErrors,
        },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: authenticatedUser.userId },
      data: {
        profileImageUrl: profileImageUrl
          ? normalizeStoredPhotoUrl(profileImageUrl)
          : null,
        phoneNumber,
        nextOfKinEmail,
        nextOfKinPhone,
      },
    });

    const profileStatus = await getCurrentProfileStatus(authenticatedUser.userId);

    if (!profileStatus) {
      return NextResponse.json(
        { error: "Profile not found after update" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...profileStatus,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
