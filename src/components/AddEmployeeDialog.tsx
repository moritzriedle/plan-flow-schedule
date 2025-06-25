
import * as React from "react";
import { usePlanner } from "@/contexts/PlannerContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, ExternalLink } from "lucide-react";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEmployeeDialog({ open, onOpenChange }: AddEmployeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Team Member
          </DialogTitle>
          <DialogDescription>
            Team members must register with their @proglove.de or @proglove.com email address to join the resource planner.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to add team members:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Share the application URL with new team members</li>
              <li>2. They need to register using their @proglove.de or @proglove.com email</li>
              <li>3. An email will be sent to them to set their password</li>
              <li>4. Once registered, they will automatically appear in the team list</li>
              <li>5. You can allocate projects to them even before they sign in</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              window.open('/auth', '_blank');
              onOpenChange(false);
            }}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Registration Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
