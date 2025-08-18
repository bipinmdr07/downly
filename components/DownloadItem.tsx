import { Download } from "./DownloadManager";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Square,
  Trash2,
  FileDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Folder
} from "lucide-react";
import { formatDistanceToNow, formatDuration, intervalToDuration } from "date-fns";

interface DownloadItemProps {
  download: Download;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onStop: (id: string) => void;
  onRemove: (id: string) => void;
}

const getStatusIcon = (status: Download["status"]) => {
  switch (status) {
    case "downloading":
      return <FileDown className="h-4 w-4 animate-pulse" />;
    case "paused":
      return <Pause className="h-4 w-4" />;
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "error":
      return <AlertCircle className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    default:
      return <FileDown className="h-4 w-4" />;
  }
};

const getStatusVariant = (status: Download["status"]) => {
  switch (status) {
    case "downloading":
      return "default";
    case "paused":
      return "secondary";
    case "completed":
      return "success" as any;
    case "error":
      return "destructive";
    case "pending":
      return "outline";
    default:
      return "secondary";
  }
};

export const DownloadItem = ({
  download,
  onPause,
  onResume,
  onStop,
  onRemove
}: DownloadItemProps) => {
  const canPause = download.status === "downloading";
  const canResume = download.status === "paused";
  const canStop = download.status === "downloading" || download.status === "pending";

  const duration = intervalToDuration({
    start: 0,
    end: (download.eta || 0) * 1000
  })

  const formattedEta = formatDuration(duration, {
    format: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
    zero: false
  })

  return (
    <div className="p-4 border rounded-lg space-y-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{download.filename}</h3>
            <Badge variant={getStatusVariant(download.status)} className="shrink-0">
              {getStatusIcon(download.status)}
              <span className="ml-1 capitalize">{download.status}</span>
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground truncate">
            {download.url}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              <span className="truncate">{download.downloadPath}</span>
            </div>
            <span>{download.size}</span>
            {console.log({ download })}
            <span>Added {formatDistanceToNow(new Date(download.addedAt || download.added_at), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-4">
          {canResume && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onResume(download.id)}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}

          {canPause && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPause(download.id)}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}

          {canStop && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStop(download.id)}
            >
              <Square className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemove(download.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {download.status !== "completed" && download.status !== "error" && (
        <div className="space-y-2">
          <Progress value={download.progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{download.progress}%</span>
            <div className="flex gap-4">
              {download.speed && <span>{download.speed}</span>}
              {download.eta && <span>ETA: {download.eta}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
