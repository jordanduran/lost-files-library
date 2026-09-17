import { FolderOpen, Minus, Square, X } from "lucide-react";

export function DeliveryTitle() {
  return (
    <div className="delivery-title">
      <span className="delivery-title-label">
        <FolderOpen size={14} aria-hidden="true" /> Downloads
      </span>
      <span className="delivery-controls" aria-hidden="true">
        <span>
          <Minus size={13} />
        </span>
        <span>
          <Square size={13} />
        </span>
        <span>
          <X size={13} />
        </span>
      </span>
    </div>
  );
}
