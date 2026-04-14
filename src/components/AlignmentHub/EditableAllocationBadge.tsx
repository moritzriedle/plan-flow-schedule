import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil, UserPlus, UserMinus, Plus, Minus, AlertTriangle } from 'lucide-react';
import { Employee } from '../../types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface EditableAllocationBadgeProps {
  employee: Employee;
  days: number;
  allocationId: string;
  isOverallocated: boolean;
  changeType?: 'new' | 'leaving' | 'increased' | 'decreased';
  totalEmployeeDaysInSprint: number;
  onSave: (allocationId: string, newDays: number) => Promise<boolean>;
  onDelete: (allocationId: string) => Promise<boolean>;
  canEdit: boolean;
}

const EditableAllocationBadge: React.FC<EditableAllocationBadgeProps> = ({
  employee,
  days,
  allocationId,
  isOverallocated,
  changeType,
  totalEmployeeDaysInSprint,
  onSave,
  onDelete,
  canEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(days));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const newDays = parseInt(editValue, 10);
  const isValid = !isNaN(newDays) && newDays >= 0 && newDays <= 10;
  const wouldOverallocate =
    isValid && totalEmployeeDaysInSprint - days + newDays > 10;

  const handleSave = async () => {
    if (!isValid) return;
    if (newDays === 0) {
      setSaving(true);
      await onDelete(allocationId);
      setSaving(false);
      setIsEditing(false);
      return;
    }
    if (newDays === days) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onSave(allocationId, newDays);
    setSaving(false);
    if (ok) setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(days));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (changeType === 'leaving') {
    return (
      <Badge variant="outline" className="text-xs flex items-center gap-1 opacity-50 line-through">
        <UserMinus className="w-3 h-3 text-destructive" />
        <span className="text-muted-foreground">{employee.name.split(' ')[0]}</span>
        <span className="opacity-70">0d</span>
      </Badge>
    );
  }

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 shadow-sm">
        <span className="text-xs font-medium truncate max-w-[60px]">
          {employee.name.split(' ')[0]}
        </span>
        <Input
          ref={inputRef}
          type="number"
          min={0}
          max={10}
          step={1}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-5 w-10 text-xs px-1 py-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          disabled={saving}
        />
        <span className="text-xs text-muted-foreground">d</span>
        {wouldOverallocate && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="w-3 h-3 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  This will result in {totalEmployeeDaysInSprint - days + newDays}d total (overallocated)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {!isValid && editValue !== '' && (
          <span className="text-xs text-destructive">!</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={handleSave}
          disabled={!isValid || saving}
        >
          <Check className="w-3 h-3 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`text-xs flex items-center gap-1 cursor-default group ${
        isOverallocated ? 'border-destructive bg-destructive/10' : ''
      } ${changeType === 'new' ? 'bg-green-500/20 border-green-500' : ''}`}
    >
      {changeType === 'new' && <UserPlus className="w-3 h-3 text-green-600" />}
      {changeType === 'increased' && <Plus className="w-3 h-3 text-green-600" />}
      {changeType === 'decreased' && <Minus className="w-3 h-3 text-destructive" />}
      <span>{employee.name.split(' ')[0]}</span>
      <span className="opacity-70">{days}d</span>
      {canEdit && (
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
          title="Edit allocation"
        >
          <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </Badge>
  );
};

export default EditableAllocationBadge;
