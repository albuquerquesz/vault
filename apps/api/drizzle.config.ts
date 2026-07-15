import { defineConfig } from "drizzle-kit";
import "./src/db/load-env";

export default defineConfig({
	schema: "./src/db/schema",
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
});
