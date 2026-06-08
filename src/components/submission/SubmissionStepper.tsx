import { CheckCircle2, Clock, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmissionStepperProps {
  status: string;
}

export function SubmissionStepper({ status }: SubmissionStepperProps) {
  // Define steps
  const steps = [
    { id: 'submitted', label: 'Diajukan', icon: FileText },
    { id: 'review', label: 'Proses Review', icon: Clock },
    { id: 'final', label: status === 'revision' ? 'Perlu Revisi' : 'Disetujui', icon: status === 'revision' ? AlertTriangle : CheckCircle2 },
  ];

  const getStepStatus = (stepId: string) => {
    if (status === 'approved') return 'completed';
    if (status === 'revision') {
      if (stepId === 'submitted' || stepId === 'review') return 'completed';
      if (stepId === 'final') return 'error';
    }
    if (status === 'review') {
      if (stepId === 'submitted') return 'completed';
      if (stepId === 'review') return 'current';
      return 'pending';
    }
    if (status === 'submitted') {
      if (stepId === 'submitted') return 'current';
      return 'pending';
    }
    return 'pending';
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full" />
        
        {/* Active Line */}
        <div 
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full transition-all duration-500",
            status === 'submitted' ? "w-0" :
            status === 'review' ? "w-1/2 bg-warning" :
            status === 'revision' ? "w-full bg-destructive" :
            "w-full bg-success"
          )}
        />

        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          const StepIcon = step.icon;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-4 border-background transition-colors",
                  stepStatus === 'completed' ? "bg-success text-white" :
                  stepStatus === 'current' ? "bg-warning text-white" :
                  stepStatus === 'error' ? "bg-destructive text-white" :
                  "bg-muted text-muted-foreground"
                )}
              >
                <StepIcon className="w-4 h-4" />
              </div>
              <span 
                className={cn(
                  "text-[10px] sm:text-xs font-medium absolute -bottom-6 w-24 text-center",
                  stepStatus === 'completed' ? "text-success" :
                  stepStatus === 'current' ? "text-warning" :
                  stepStatus === 'error' ? "text-destructive" :
                  "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
