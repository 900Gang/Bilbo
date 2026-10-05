import "dotenv/config";
import { app } from "./app.js";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
