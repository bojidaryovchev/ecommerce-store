"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({});

type GetUploadUrlResult =
  | {
      success: true;
      data: {
        uploadUrl: string;
        fileUrl: string;
        key: string;
      };
    }
  | { success: false; error: string };

export async function getUploadUrl(fileName: string, fileType: string): Promise<GetUploadUrlResult> {
  try {
    // Validate file type (images only)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(fileType)) {
      return {
        success: false,
        error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
      };
    }

    // Generate unique file name
    const fileExtension = fileName.split(".").pop();
    const key = `uploads/${uuidv4()}.${fileExtension}`;

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_UPLOADS_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    // Construct the public URL
    const fileUrl = `https://${process.env.NEXT_PUBLIC_UPLOADS_BUCKET}.s3.amazonaws.com/${key}`;

    return {
      success: true,
      data: {
        uploadUrl,
        fileUrl,
        key,
      },
    };
  } catch (error) {
    console.error("Error generating upload URL:", error);

    return {
      success: false,
      error: "Failed to generate upload URL. Please try again.",
    };
  }
}
