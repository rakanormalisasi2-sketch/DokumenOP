import { Badge } from '@/components/ui/badge';
import { DocumentStatus, STATUS_LABELS } from '@/types';

interface StatusBadgeProps {
  status: DocumentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={status}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
