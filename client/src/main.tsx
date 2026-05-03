import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force light mode — dark mode removed from design system
document.documentElement.classList.remove("dark");
document.documentElement.classList.add("light");

createRoot(document.getElementById("root")!).render(<App />);
