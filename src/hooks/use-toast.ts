import toast from "react-hot-toast";

export function useToast() {
  return {
    toast: ({
      title,
      description,
      variant,
    }: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => {
      const message = description ? `${title}\n${description}` : title || "";

      if (variant === "destructive") {
        toast.error(message);
      } else {
        toast.success(message);
      }
    },
  };
}
