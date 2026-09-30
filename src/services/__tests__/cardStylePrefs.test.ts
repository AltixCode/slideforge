import {
  DEFAULT_CARD_STYLE,
  parseCardStyle,
  serialiseCardStyle,
} from "../cardStylePrefs";

describe("parseCardStyle", () => {
  it("reads back what serialiseCardStyle wrote", () => {
    const prefs = {
      fontId: "serif",
      textColor: "#F8FAFC",
      backgroundColor: "#0F172A",
    };
    expect(parseCardStyle(serialiseCardStyle(prefs))).toEqual(prefs);
  });

  it.each([
    ["missing file", null],
    ["empty string", ""],
    ["truncated write", '{"fontId":'],
    ["an array", "[1,2]"],
    ["a bare number", "42"],
    ["null literal", "null"],
  ])("treats %s as defaults", (_label, raw) => {
    expect(parseCardStyle(raw)).toEqual(DEFAULT_CARD_STYLE);
  });

  it("falls back to the default font for an unknown or non-string fontId", () => {
    expect(parseCardStyle('{"fontId":"comic-sans"}').fontId).toBe(
      DEFAULT_CARD_STYLE.fontId,
    );
    expect(parseCardStyle('{"fontId":42}').fontId).toBe(
      DEFAULT_CARD_STYLE.fontId,
    );
    expect(parseCardStyle("{}").fontId).toBe(DEFAULT_CARD_STYLE.fontId);
  });

  it("falls back to null (theme default) for a color not in the curated palette", () => {
    // A hand-edited or future-version file could carry an arbitrary string;
    // only hexes from the known palette are trusted, same as the app's
    // pacing counters fail toward a safe default rather than a bad value.
    expect(parseCardStyle('{"textColor":"#FF00FF"}').textColor).toBeNull();
    expect(
      parseCardStyle('{"backgroundColor":"javascript:alert(1)"}')
        .backgroundColor,
    ).toBeNull();
    expect(parseCardStyle('{"textColor":123}').textColor).toBeNull();
  });

  it("accepts a color that is in the curated palette", () => {
    expect(parseCardStyle('{"textColor":"#F8FAFC"}').textColor).toBe("#F8FAFC");
    expect(
      parseCardStyle('{"backgroundColor":"#052E2B"}').backgroundColor,
    ).toBe("#052E2B");
  });
});

describe("serialiseCardStyle", () => {
  it("never writes a color outside the curated palette", () => {
    expect(
      serialiseCardStyle({
        fontId: "mono",
        textColor: "#FF00FF",
        backgroundColor: null,
      }),
    ).toBe('{"fontId":"mono","textColor":null,"backgroundColor":null}');
  });

  it("never writes an unknown fontId", () => {
    expect(
      JSON.parse(
        serialiseCardStyle({
          fontId: "nope",
          textColor: null,
          backgroundColor: null,
        }),
      ).fontId,
    ).toBe(DEFAULT_CARD_STYLE.fontId);
  });
});
