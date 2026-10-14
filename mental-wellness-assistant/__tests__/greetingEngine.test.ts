import { routeIntent, screenIntro, welcomeLine, SCREEN_INTROS } from "@/engine/greetingEngine";
import { FEATURES } from "@/config/features";

describe("greeting engine", () => {
  it("greets by name and always asks what to do together", () => {
    const line = welcomeLine("سارا", new Date("2026-09-23T09:00:00"), () => 0);
    expect(line).toContain("سارا");
    expect(line).toMatch(/چی کار کنیم/);
  });

  it("works without a name", () => {
    expect(welcomeLine("", new Date(), () => 0.99)).not.toContain("undefined");
  });

  it("routes casual Persian requests to the right section", () => {
    expect(routeIntent("میخوام یه غذا درست کنم")).toBe("recipes");
    expect(routeIntent("میخوام سیگارو ترک کنم")).toBe("quitCoach");
    expect(routeIntent("برای بچه‌م قصه بگو")).toBe("storytelling");
    expect(routeIntent("با همسرم دعوام شده")).toBe("counseling");
    expect(routeIntent("يه سوال حقوقي دارم")).toBe("legal"); // Arabic ye/kaf
    expect(routeIntent("سلام")).toBeNull();
  });

  it("puts crisis ahead of everything else", () => {
    expect(routeIntent("حالم بده و میخوام خودکشی کنم")).toBe("crisis");
  });

  it("has an intro for every home-screen feature route", () => {
    for (const f of FEATURES.filter((x) => !x.demoOnly && x.route !== "Music")) {
      expect(SCREEN_INTROS[f.route]).toBeDefined();
    }
    expect(screenIntro("NoSuchRoute")).toBeNull();
  });
});
