"use client";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
export function AddToCart({
  beatId,
  licenseId = "mp3",
}: {
  beatId: string;
  licenseId?: string;
}) {
  const added = useCart((s) =>
    s.items.some(
      (item) => item.beatId === beatId && item.licenseId === licenseId,
    ),
  );
  const add = useCart((s) => s.add);
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={added ? "License is in cart" : "Add MP3 license to cart"}
      onClick={() => add({ beatId, licenseId })}
    >
      {added ? <Check /> : <Plus />}
      <span className="add-label">{added ? "Added" : "Add"}</span>
    </Button>
  );
}
