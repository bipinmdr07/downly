import { Download } from "./DownloadManager";
import { DownloadItem } from "./DownloadItem";
import { Card } from "@/components/ui/card";

interface DownloadListProps {
  downloads: Download[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
}

export const DownloadList = ({
  downloads,
  onPause,
  onResume,
  onRemove
}: DownloadListProps) => {
  if (downloads.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="text-muted-foreground text-lg">
            No downloads yet
          </div>
          <div className="text-muted-foreground text-sm mt-2">
            Add a URL above to start downloading
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Downloads</h2>
        <div className="text-sm text-muted-foreground">
          {downloads.filter(d => d.status === "downloading").length} active
        </div>
      </div>

      <div className="space-y-3">
        {downloads.map((download) => (
          <DownloadItem
            key={download.id}
            download={download}
            onPause={onPause}
            onResume={onResume}
            onRemove={onRemove}
          />
        ))}
      </div>
    </Card>
  );
};
