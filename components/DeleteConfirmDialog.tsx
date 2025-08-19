import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deleteFile: boolean) => void;
  filename: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  filename
}: DeleteConfirmDialogProps) {
  const [deleteFile, setDeleteFile] = useState(false);

  const handleConfirm = () => {
    onConfirm(deleteFile);
    onOpenChange(false);
    setDeleteFile(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setDeleteFile(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Download</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete "{filename}"?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="delete-file"
            checked={deleteFile}
            onCheckedChange={(checked) => setDeleteFile(checked as boolean)}
          />
          <label
            htmlFor="delete-file"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Also delete the file from disk
          </label>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
