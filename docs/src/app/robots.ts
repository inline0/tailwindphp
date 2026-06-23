import { generateRobots } from "onedocs/seo";

const baseUrl = "https://tailwindphp.com";

export default function robots() {
  return generateRobots({ baseUrl });
}
