import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import vercel from 'vite-plugin-vercel';

// https://vite.dev/config/
export default defineConfig({
	plugins: [vercel(), vue(), tailwindcss()],
	server: {
		 port: process.env.PORT as unknown as number,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
