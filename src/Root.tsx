import { Composition } from "remotion";
import {
  calculateLaunchPromoMetadata,
  LaunchPromo,
} from "./LaunchPromo/LaunchPromo";
import { launchPromoSchema } from "./LaunchPromo/schema";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LaunchPromo"
        component={LaunchPromo}
        schema={launchPromoSchema}
        calculateMetadata={calculateLaunchPromoMetadata}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          brandName: "Execute",
          headline: "Stop planning. Start executing.",
          features: [
            { title: "Daily focus blocks", icon: "focus" as const },
            { title: "Streak tracking", icon: "streak" as const },
            { title: "Zero-clutter tasks", icon: "tasks" as const },
          ],
          phoneTitle: "Today",
          tasks: [
            "Ship landing page",
            "Review pull requests",
            "45 min deep work",
            "Plan tomorrow",
            "Inbox zero",
          ],
          tagline: "The to-do app that gets out of your way.",
          cta: "Join the waitlist",
          colors: {
            background: "#0B0B0F",
            accent: "#7C5CFF",
            text: "#FFFFFF",
          },
          durationInSeconds: 30,
        }}
      />
    </>
  );
};
