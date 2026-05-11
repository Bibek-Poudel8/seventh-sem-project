import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

export default function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        delta > 0 ? "text-emerald-500" : "text-red-500",
      )}
    >
      {delta > 0 ? (
        <FontAwesomeIcon icon={faArrowTrendUp} className="h-3 w-3" />
      ) : (
        <FontAwesomeIcon icon={faArrowTrendDown} className="h-3 w-3" />
      )}
      {Math.abs(delta)}% from last month
    </span>
  );
}
