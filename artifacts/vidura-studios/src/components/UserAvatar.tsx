import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
 * Displays a user's avatar image when a URL is available,
 * or falls back to their initials when it is not (or when the image fails to load).
 *
 * Load order:
 *   1. On mount — renders AvatarImage with the stored URL from the user's profile.
 *   2. On error  — AvatarFallback (initials) is shown automatically by Radix.
 *   3. No URL    — AvatarFallback (initials) is shown immediately.
 */
export default function UserAvatar({
  avatarUrl,
  name,
  className,
  fallbackClassName,
  imgClassName,
}: UserAvatarProps) {
  const initials = getInitials(name || "VS");

  return (
    <Avatar className={className}>
      {avatarUrl ? (
        <AvatarImage
          src={avatarUrl}
          alt={name}
          className={cn("object-cover", imgClassName)}
        />
      ) : null}
      <AvatarFallback className={cn("bg-[#004D40] text-white font-bold", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
