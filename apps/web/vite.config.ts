import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3001,
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
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		tsconfigPaths: true,
	},
	plugins: [
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
	],
});
