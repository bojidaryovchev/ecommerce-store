"use client";

import { getUploadUrl } from "@/actions/upload-image.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, disabled = false, label = "Image" }) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Get presigned upload URL from server
      const result = await getUploadUrl(file.name, file.type);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // Upload file to S3 using presigned URL
      const uploadResponse = await fetch(result.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Update form with the file URL
      onChange(result.data.fileUrl);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Preview */}
      {value && (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border">
          <Image src={value} alt="Upload preview" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled || uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full sm:w-auto"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {value ? "Change Image" : "Upload Image"}
            </>
          )}
        </Button>

        {!value && <span className="text-muted-foreground flex items-center text-sm">or paste URL</span>}
      </div>

      {/* Manual URL Input */}
      {!value && (
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled || uploading}
        />
      )}

      <p className="text-muted-foreground text-xs">Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB.</p>
    </div>
  );
};

export default ImageUpload;
