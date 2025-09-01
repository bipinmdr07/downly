<img width="120" height="120" src="public/logo.png" alt="Downly logo">

# Downly
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/bipinmdr07/downly)

Downly is a self-hosted, web-based download manager built with Next.js. It leverages the power of `aria2c` to provide a user-friendly interface for managing downloads, complete with real-time progress updates, pausing, and resuming capabilities.

## Features

- **Web-based UI**: Manage your downloads from any browser on your network.
- **Resumable Downloads**: Pause and resume downloads at any time, thanks to `aria2c`'s `--continue` feature.
- **Real-time Updates**: Track download progress, speed, and ETA in real-time without refreshing the page, powered by Server-Sent Events (SSE).
- **Persistent Queue**: Your download list is saved in a SQLite database, so you won't lose track of your files.
- **Auto-Resume on Startup**: Incomplete downloads are automatically resumed when the application starts.
- **File Management**: Choose to delete files from the disk when removing them from the download list.
- **Modern Tech Stack**: Built with Next.js, React, and TypeScript for a fast and reliable experience.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [SQLite](https://www.sqlite.org/index.html)
- **Download Engine**: `aria2c` (via Node.js `child_process`)
- **Real-time Communication**: Server-Sent Events (SSE)

## Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- **Node.js**: Version 20 or later is recommended.
- **`aria2c`**: You must have `aria2c` installed and accessible in your system's PATH.

To check if you have `aria2c` installed, run:
```bash
aria2c --version
```

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/bipinmdr07/downly.git
    cd downly
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file and configure the variables.

    ```env
    # This must be set to 'nodejs' for the backend logic to run.
    NEXT_RUNTIME=nodejs

    # Set the absolute path where your files will be downloaded.
    # Example for Linux/macOS: DOWNLOAD_LOCATION=/home/youruser/Downloads
    # Example for Windows: DOWNLOAD_LOCATION=C:\Users\youruser\Downloads
    DOWNLOAD_LOCATION=/path/to/your/downloads
    ```

4.  **Run the application:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser to start using Downly.

## Setting up downly as a systemctl service.
### Install downly

``` bash
npm i -g downly
```

### Get downly installed location

``` bash
which downly
```

### Create a systemctl service

``` bash
touch /etc/systemd/system/downly.service
```

Open copy the content below replace `<Full path to download location>`, `<Full path to db location>` and `<which downly>` and save
``` bash
[Unit]
Description="A simple download manager built with NextJS using feature of aria2c."
Documentation=https://www.npmjs.com/package/downly
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER
Group=$USER
ExecStart=<which downly> -l <Full path to download location> -d <Full path to db location>
Restart=always

[Install]
WantedBy=multi-user.target
Alias=downly.service
```

### enable the service

``` bash
systemctl daemon-reload
systemctl enable downly.service
```

## How It Works

- The frontend, built with **React** and **Next.js**, provides the user interface for adding and managing downloads.
- When a new download is added, a request is sent to a **Next.js API route**.
- The API route creates an entry in a local **SQLite** database and spawns a `aria2c` **child process** to handle the file download.
- The server continuously monitors the `stdout` output from the `aria2c` process, parsing it to extract progress percentage, download speed, and ETA.
- This progress information is broadcasted from the server to all connected clients in real-time using **Server-Sent Events (SSE)**.
- Pausing a download sends a `SIGINT` signal to the `aria2c` process. Resuming starts a new `aria2c` process with the `--continue` flag, allowing it to pick up where it left off.
- The application's `instrumentation.ts` file ensures that any non-completed downloads from previous sessions are automatically resumed upon server startup.
