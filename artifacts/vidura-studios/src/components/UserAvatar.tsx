import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  name: string;
  className?: string;
  fallbackClassName?: string;
  imgClassName?: string;
}

/**
 * Shows the user's profile photo when a URL is available and the image loads
 * successfully. Falls back to initials on error or when no URL is stored.
 *
 * Uses a plain <img> tag instead of Radix AvatarImage to avoid Radix's
 * internal image-status detection silently treating external URLs as "not
 * loaded" and hiding the image even when the network request succeeds.
 */
export default function UserAvatar({
  avatarUrl,
  name,
  className,
  fallbackClassName,
  imgClassName,
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  // Reset failure flag whenever the URL changes (e.g. after a new upload)
  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const initials = getInitials(name || "VS");
  const showImage = Boolean(avatarUrl) && !imgFailed;

  return (
    <Avatar className={className}>
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={name}
          onError={() => setImgFailed(true)}
          className={cn(
            "aspect-square h-full w-full object-cover rounded-full",
            imgClassName
          )}
        />
      ) : (
        <AvatarFallback
          className={cn("bg-[#004D40] text-white font-bold", fallbackClassName)}
        >
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
