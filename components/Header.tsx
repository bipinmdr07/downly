import { Download, Folder } from "lucide-react";

interface HeaderProps {
  downloadCount: number;
}

export const Header = ({ downloadCount }: HeaderProps) => {
  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Download Manager</h1>
              <p className="text-muted-foreground">
                {downloadCount} files in queue
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="h-4 w-4" />
            <span>Downly</span>
          </div>
        </div>
      </div>
    </div>
  );
};
