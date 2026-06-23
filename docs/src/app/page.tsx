import { HomePage, CTASection } from "onedocs";
import config from "../../onedocs.config";

export default function Home() {
  return (
    <HomePage config={config}>
      <CTASection
        title="Generate Tailwind CSS from PHP."
        description="Install the Composer package and compile your first stylesheet in seconds — no Node.js required."
        cta={{ label: "Read the Docs", href: "/docs" }}
      />
    </HomePage>
  );
}
