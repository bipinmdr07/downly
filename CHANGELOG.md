# 1.2.1 - 2025-09-01
### Fixed
- Rename of downloadPath to downloadLocation in cli.js.
- add missing `downly start` in service file.

# 1.2.0 - 2025-09-01
### Added
- **Aria2 integration**: Add aria2c as default download tool replacing wget, adding support for downloading torrent content using torrent file or magnet link.
- **CLI**`-d, --db-location` for providing the custom location for downloads.sqlite file to be placed for record persistence on downly update with `npm i -g downly`

### Changed
- **CLI** `-d, --download-path` is changes with `-l, --download-location`

# 1.1.2 - 2025-08-22
- **CLI**: Add the missing dependencies ignored by npmignore.

# 1.1.1 - 2025-08-21
- **CLI**: Add the cli compatibility to execute downly directly after install.
- **Configurable**: pass `-d, --download-path` for setting download path, `-c, --config` for sending the path to config.js file, `-p, --port` for setting port, `-h, --hostname` to set hostname.

# 1.0.0 - 2025-08-21
- **Web-based UI**: Manage your downloads from any browser on your network.
- **Resumable Downloads**: Pause and resume downloads at any time, thanks to `wget`'s `--continue` feature.
- **Real-time Updates**: Track download progress, speed, and ETA in real-time without refreshing the page, powered by Server-Sent Events (SSE).
- **Persistent Queue**: Your download list is saved in a SQLite database, so you won't lose track of your files.
- **Auto-Resume on Startup**: Incomplete downloads are automatically resumed when the application starts.
- **File Management**: Choose to delete files from the disk when removing them from the download list.
- **Modern Tech Stack**: Built with Next.js, React, and TypeScript for a fast and reliable experience.
