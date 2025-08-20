import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen } from "lucide-react";

interface AddDownloadFormProps {
  onAddDownload: (url: string, downloadPath: string) => void;
}

export const AddDownloadForm = ({ onAddDownload }: AddDownloadFormProps) => {
  const [url, setUrl] = useState("https://dl3.downloadly.ir/Files/Elearning/Udemy_Creating_3D_environments_in_Blender_1080_2024-9_Downloadly.ir.part01.rar?nocache=1755441999");
  /* const [downloadPath, setDownloadPath] = useState("/home/user/Downloads"); */
  const [downloadPath, setDownloadPath] = useState("/Users/leapfrog/Desktop/tmp");


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAddDownload(url.trim(), downloadPath);
      setUrl("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Download
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">File URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/file.zip"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="downloadPath">Download Path</Label>
              <div className="flex gap-2">
                <Input
                  id="downloadPath"
                  type="text"
                  value={downloadPath}
                  onChange={(e) => setDownloadPath(e.target.value)}
                />
                <Button type="button" variant="outline" size="icon">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Download
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
