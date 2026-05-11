"use client";

import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function TransactionPagination({
  page,
  totalPages,
  total,
  onPrevious,
  onNext,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} of {totalPages} ({total} records)
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={onPrevious}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
