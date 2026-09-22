import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	server: {
		port: 3001,
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: false,
			},
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes("node_modules")) {
						return;
					}

					if (id.includes("/react-dom/") || id.includes("/react/")) {
						return "react-vendor";
					}

					if (id.includes("@tanstack")) {
						return "tanstack-vendor";
					}

					if (id.includes("@trpc")) {
						return "trpc-vendor";
					}

					if (id.includes("recharts")) {
						return "charts-vendor";
					}

					if (
						id.includes("@base-ui") ||
						id.includes("lucide-react") ||
						id.includes("motion") ||
						id.includes("next-themes") ||
						id.includes("sonner")
					) {
						return "ui-vendor";
					}
				},
			},
		},
	},
	resolve: {
		extensions: [".tsx", ".ts", ".jsx", ".js"],
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@vault/ui/globals.css": path.resolve(
				__dirname,
				"../../packages/ui/src/styles/globals.css",
			),
			"@vault/ui": path.resolve(__dirname, "../../packages/ui/src"),
		},
		tsconfigPaths: true,
	},
	plugins: [
		VitePWA({
			strategies: "injectManifest",
			srcDir: "src",
			filename: "sw.ts",
			manifest: false,
			injectRegister: false,
			registerType: "prompt",
			injectManifest: {
				globPatterns: ["**/*.{js,css,svg,png,ico,woff2,html}"],
				globIgnores: ["index.html"],
			},
		}),
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
	],
});
