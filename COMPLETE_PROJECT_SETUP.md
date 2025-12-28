# Complete Enamorado Radio Project Setup

## 📁 Full Project Structure

Create this exact folder structure on your computer:

```
enamorado-radio/
├── client/
│   └── src/
│       ├── components/
│       │   └── ui/
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── badge.tsx
│       │       ├── slider.tsx
│       │       └── toaster.tsx
│       ├── hooks/
│       │   ├── use-toast.ts
│       │   └── useWebSocket.ts
│       ├── lib/
│       │   ├── queryClient.ts
│       │   └── utils.ts
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── RadioLanding.tsx
│       │   ├── MobileRadio.tsx
│       │   └── not-found.tsx
│       ├── types/
│       │   └── audio.ts
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── shared/
│   └── schema.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── drizzle.config.ts
├── components.json
└── .gitignore
```

## 🚀 Step-by-Step Setup

### 1. Create the Project Folder
```bash
mkdir enamorado-radio
cd enamorado-radio
```

### 2. Root Level Files

**package.json**
```json
{
  "name": "enamorado-radio",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build --outDir dist/public",
    "build:server": "esbuild server/index.ts --bundle --platform=node --outfile=dist/server.js --external:express --external:ws",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@tanstack/react-query": "^5.17.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/ws": "^8.5.10",
    "@vitejs/plugin-react": "^4.2.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "drizzle-orm": "^0.29.3",
    "drizzle-zod": "^0.5.1",
    "esbuild": "^0.19.12",
    "express": "^4.18.2",
    "lucide-react": "^0.323.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.3",
    "tailwind-merge": "^2.2.1",
    "tailwindcss": "^3.4.1",
    "tailwindcss-animate": "^1.0.7",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.12",
    "wouter": "^3.0.0",
    "ws": "^8.16.0",
    "zod": "^3.22.4",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  }
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  },
  "include": ["client/src", "server", "shared"]
}
```

**vite.config.ts**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
```

**tailwind.config.ts**
```typescript
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./client/src/**/*.{ts,tsx}",
    "./index.html",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

**postcss.config.js**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**index.html**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Enamorado Radio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/client/src/main.tsx"></script>
  </body>
</html>
```

**.gitignore**
```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.production

# Database
*.db
*.sqlite

# Build outputs
build/
dist/
```

## 📱 How to Run the Project

### Option 1: Use the Single Server (Recommended)
The project is set up with a single server that handles both frontend and backend:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** to:
   - Home page: `http://localhost:5000/`
   - Mobile Radio: `http://localhost:5000/mobile`
   - Radio Landing: `http://localhost:5000/radio`

### Option 2: Get the Full Code Files
To get all the detailed component code, refer to these files I created:

- **CLIENT_CODE.md** - All React components and client-side code
- **SERVER_CODE.md** - Backend API routes and server setup  
- **COMPONENTS_CODE.md** - UI components and shared schema
- **MOBILE_RADIO_CODE.md** - Complete mobile radio player component

## 🎯 Key Features

- **Working Audio Player** - Real HTML5 audio with SoundHelix streams
- **Mobile-First Design** - NTS-style interface optimized for mobile
- **Real-time Updates** - WebSocket integration for live playback info
- **Complete API** - Working endpoints for stations, shows, and tracks
- **TypeScript Throughout** - Full type safety across the entire stack

## 🚀 What Opens When You Run It

When you run `npm run dev`, you get:
- **Backend server** running on port 5000
- **Frontend** served by Vite through the same port
- **WebSocket server** for real-time updates
- **Hot reload** for development

The main mobile radio experience is at `http://localhost:5000/mobile` - this is the complete NTS-style radio player we built!

## 🔧 File to Open for Local Development

**Open `server/index.ts`** - this is the main server file that starts everything. The project uses a single server setup where:

1. Express server handles the API routes
2. Vite middleware serves the React frontend
3. WebSocket server provides real-time updates
4. Everything runs on port 5000

Just run `npm run dev` and visit `http://localhost:5000/mobile` to see the full radio player!