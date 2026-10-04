import { Composition, Folder } from "remotion";
import { FLASH_SALE_FRAMES, FlashSale } from "./FlashSale/FlashSale";
import { flashSaleSchema } from "./FlashSale/schema";
import {
  calculateKineticTypeMetadata,
  KineticType,
} from "./KineticType/KineticType";
import { kineticTypeSchema } from "./KineticType/schema";
import { statStorySchema } from "./StatStory/schema";
import { calculateStatStoryMetadata, StatStory } from "./StatStory/StatStory";
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
      <Folder name="FlashSale">
        <Composition
          id="FlashSale"
          component={FlashSale}
          schema={flashSaleSchema}
          durationInFrames={FLASH_SALE_FRAMES}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline: "Flash Sale",
            tickerText: "48 hours only",
            hero: {
              image: "products/sneaker.svg",
              name: "Velocity Runner 2",
              oldPrice: 2999,
              newPrice: 1799,
            },
            discountLabel: "-40%",
            more: [
              {
                image: "products/headphones.svg",
                name: "Pulse Buds",
                price: 1299,
              },
              {
                image: "products/watch.svg",
                name: "Stride Watch",
                price: 2499,
              },
              {
                image: "products/backpack.svg",
                name: "Daypack 20L",
                price: 999,
              },
            ],
            moreTitle: "More deals",
            currency: "INR",
            locale: "en-IN",
            timerSeconds: 86382,
            timerLabel: "Ends in",
            cta: "Shop now",
            code: "FLASH40",
            colors: {
              background: "#111111",
              sale: "#FF2E2E",
              highlight: "#FFD400",
              text: "#FFFFFF",
            },
          }}
        />
        <Composition
          id="FlashSale-Feed"
          component={FlashSale}
          schema={flashSaleSchema}
          durationInFrames={FLASH_SALE_FRAMES}
          fps={30}
          width={1080}
          height={1350}
          defaultProps={{
            headline: "Flash Sale",
            tickerText: "48 hours only",
            hero: {
              image: "products/sneaker.svg",
              name: "Velocity Runner 2",
              oldPrice: 2999,
              newPrice: 1799,
            },
            discountLabel: "-40%",
            more: [
              {
                image: "products/headphones.svg",
                name: "Pulse Buds",
                price: 1299,
              },
              {
                image: "products/watch.svg",
                name: "Stride Watch",
                price: 2499,
              },
              {
                image: "products/backpack.svg",
                name: "Daypack 20L",
                price: 999,
              },
            ],
            moreTitle: "More deals",
            currency: "INR",
            locale: "en-IN",
            timerSeconds: 86382,
            timerLabel: "Ends in",
            cta: "Shop now",
            code: "FLASH40",
            colors: {
              background: "#111111",
              sale: "#FF2E2E",
              highlight: "#FFD400",
              text: "#FFFFFF",
            },
          }}
        />
      </Folder>
      <Folder name="KineticType">
        <Composition
          id="KineticType"
          component={KineticType}
          schema={kineticTypeSchema}
          calculateMetadata={calculateKineticTypeMetadata}
          durationInFrames={450}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            beats: [
              { text: "Every", style: "slam" as const, seconds: 1.3 },
              { text: "Every / single", style: "stack" as const, seconds: 1.2 },
              { text: "Day.", style: "invert" as const, seconds: 1.2 },
              {
                text: "You open / 14 tabs / to do / 1 thing",
                style: "wipe" as const,
                seconds: 2.8,
              },
              { text: "14", style: "shatter" as const, seconds: 1.8 },
              {
                text: "One tab. / One plan. / Zero noise.",
                style: "highlight" as const,
                accentWord: "Zero",
                seconds: 3.2,
              },
            ],
            brandName: "Execute",
            cta: "Join the waitlist",
            outroSeconds: 3.5,
            colors: {
              background: "#0A0A0A",
              text: "#FFFFFF",
              accent: "#FF3B30",
            },
          }}
        />
        <Composition
          id="KineticType-Square"
          component={KineticType}
          schema={kineticTypeSchema}
          calculateMetadata={calculateKineticTypeMetadata}
          durationInFrames={450}
          fps={30}
          width={1080}
          height={1080}
          defaultProps={{
            beats: [
              { text: "Every", style: "slam" as const, seconds: 1.3 },
              { text: "Every / single", style: "stack" as const, seconds: 1.2 },
              { text: "Day.", style: "invert" as const, seconds: 1.2 },
              {
                text: "You open / 14 tabs / to do / 1 thing",
                style: "wipe" as const,
                seconds: 2.8,
              },
              { text: "14", style: "shatter" as const, seconds: 1.8 },
              {
                text: "One tab. / One plan. / Zero noise.",
                style: "highlight" as const,
                accentWord: "Zero",
                seconds: 3.2,
              },
            ],
            brandName: "Execute",
            cta: "Join the waitlist",
            outroSeconds: 3.5,
            colors: {
              background: "#0A0A0A",
              text: "#FFFFFF",
              accent: "#FF3B30",
            },
          }}
        />
      </Folder>
      <Folder name="StatStory">
        <Composition
          id="StatStory"
          component={StatStory}
          schema={statStorySchema}
          calculateMetadata={calculateStatStoryMetadata}
          durationInFrames={1110}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            brandName: "Northwind Research",
            headline: "Remote teams ship 31% faster than office-first teams",
            highlight: "31% faster",
            slides: [
              {
                type: "bigNumber" as const,
                value: 31,
                suffix: "%",
                context:
                  "faster median cycle time across 1,200 product teams in 2026",
              },
              {
                type: "bar" as const,
                title: "Median days from first commit to release",
                unit: "d",
                data: [
                  { label: "Fully remote", value: 6.2 },
                  { label: "Remote-first", value: 7.1 },
                  { label: "Hybrid", value: 8.4 },
                  { label: "Office-first", value: 9.0 },
                  { label: "Fully in office", value: 9.8 },
                ],
                highlightIndex: 0,
              },
              {
                type: "line" as const,
                title: "Share of teams working remote-first",
                unit: "%",
                points: [
                  { x: "2019", y: 9 },
                  { x: "2020", y: 41 },
                  { x: "2021", y: 47 },
                  { x: "2022", y: 44 },
                  { x: "2023", y: 46 },
                  { x: "2024", y: 52 },
                  { x: "2025", y: 57 },
                  { x: "2026", y: 61 },
                ],
                annotation: { index: 1, text: "the great office exodus" },
              },
              {
                type: "iconGrid" as const,
                filled: 3,
                total: 5,
                caption: "engineers say async reviews are the biggest speed-up",
              },
            ],
            takeaway: "Async by default is now a competitive advantage.",
            source: "Northwind State of Delivery Survey 2026 (n = 1,200 teams)",
            colors: {
              paper: "#F6F4EF",
              ink: "#111111",
              highlight: "#2F5BEA",
              muted: "#BDB9B1",
            },
          }}
        />
        <Composition
          id="StatStory-Vertical"
          component={StatStory}
          schema={statStorySchema}
          calculateMetadata={calculateStatStoryMetadata}
          durationInFrames={1110}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            brandName: "Northwind Research",
            headline: "Remote teams ship 31% faster than office-first teams",
            highlight: "31% faster",
            slides: [
              {
                type: "bigNumber" as const,
                value: 31,
                suffix: "%",
                context:
                  "faster median cycle time across 1,200 product teams in 2026",
              },
              {
                type: "bar" as const,
                title: "Median days from first commit to release",
                unit: "d",
                data: [
                  { label: "Fully remote", value: 6.2 },
                  { label: "Remote-first", value: 7.1 },
                  { label: "Hybrid", value: 8.4 },
                  { label: "Office-first", value: 9.0 },
                  { label: "Fully in office", value: 9.8 },
                ],
                highlightIndex: 0,
              },
              {
                type: "line" as const,
                title: "Share of teams working remote-first",
                unit: "%",
                points: [
                  { x: "2019", y: 9 },
                  { x: "2020", y: 41 },
                  { x: "2021", y: 47 },
                  { x: "2022", y: 44 },
                  { x: "2023", y: 46 },
                  { x: "2024", y: 52 },
                  { x: "2025", y: 57 },
                  { x: "2026", y: 61 },
                ],
                annotation: { index: 1, text: "the great office exodus" },
              },
              {
                type: "iconGrid" as const,
                filled: 3,
                total: 5,
                caption: "engineers say async reviews are the biggest speed-up",
              },
            ],
            takeaway: "Async by default is now a competitive advantage.",
            source: "Northwind State of Delivery Survey 2026 (n = 1,200 teams)",
            colors: {
              paper: "#F6F4EF",
              ink: "#111111",
              highlight: "#2F5BEA",
              muted: "#BDB9B1",
            },
          }}
        />
      </Folder>
    </>
  );
};
