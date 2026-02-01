# EduApp

A React-based educational application built with Vite and Tailwind CSS.

## Project Structure

```
EduApp/
├── src/
│   └── App.jsx           # Main application component
├── index.html            # HTML entry point
├── package.json          # Project dependencies and scripts
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── README.md             # This file
```

## Prerequisites

- Node.js (LTS version recommended)
- npm (comes with Node.js)

## Installation

1. Clone or navigate to this project directory
2. Install dependencies:

```bash
npm install
```

## Running the App

### Local Development

Start the development server with:

```bash
npm run dev
```

This will start the app on:
- **Local**: http://localhost:5173/

### Access from Phone on Local Network

To access the app from your phone on the same WiFi network:

```bash
npm run dev -- --host
```

You'll see output like this in Terminal:

```
  VITE v5.4.21  ready in 312 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.42:5173/
```

The `Network:` line shows your Mac's IP address on the local network (yours will be different). Type that Network URL into Safari or Chrome on your phone:

```
http://192.168.1.42:5173
```

Replace `192.168.1.42` with the actual IP address shown in your terminal.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Technologies

- **React** 18.3.1 - UI library
- **Vite** 5.0.8 - Build tool and dev server
- **Tailwind CSS** 3.4.1 - Utility-first CSS framework
- **PostCSS** 8.4.32 - CSS processing
- **Autoprefixer** 10.4.17 - Vendor prefix automation

## Notes

- The app uses Tailwind CSS for styling
- All styles are utility-based (no custom CSS files needed)
- Hot module replacement (HMR) is enabled for fast development
