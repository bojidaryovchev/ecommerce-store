"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  className?: string;
  disabled?: boolean;
}

interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

const ImageUpload: React.FC<Props> = ({ value, onChange, folder = "categories", className, disabled }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setIsUploading(true);

      try {
        // Get presigned URL
        const presignedResponse = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            folder,
          }),
        });

        if (!presignedResponse.ok) {
          const errorData = (await presignedResponse.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to get upload URL");
        }

        const { uploadUrl, publicUrl } = (await presignedResponse.json()) as PresignedUrlResponse;

        // Upload to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        onChange(publicUrl);
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(error instanceof Error ? error.message : "Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [folder, onChange],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border">
          <Image src={value} alt="Uploaded image" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "flex aspect-video w-full max-w-xs cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            (disabled || isUploading) && "cursor-not-allowed opacity-50",
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="text-muted-foreground mb-2 h-10 w-10 animate-spin" />
              <p className="text-muted-foreground text-sm">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="text-muted-foreground mb-2 h-10 w-10" />
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-muted-foreground text-xs">PNG, JPG, GIF, WebP up to 5MB</p>
            </>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {value ? "Change Image" : "Upload Image"}
      </Button>
    </div>
  );
};

export default ImageUpload;
