import React from 'react';
import { PixelRatio } from 'react-native';
import {
  Canvas, Group, Rect, Text as SkText, matchFont, type CanvasRef,
} from '@shopify/react-native-skia';
import type { Slide } from './slideSplitter';
import type { CarouselTheme } from '../presets/themes';

/**
 * Renders one carousel card at full export resolution.
 *
 * 1080x1350 (4:5) is the tallest aspect Instagram and LinkedIn display without
 * cropping, so cards are composed at exactly that size and never scaled up
 * afterwards -- scaling a preview-sized canvas is what produces soft text on
 * export.
 */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

/**
 * Canvas size in points, so the snapshot lands at exactly CARD_WIDTH pixels.
 *
 * Skia snapshots at the device pixel ratio: a canvas sized 1080 points on a
 * @3x screen exports 3240px. Sizing the canvas at 1080/density points and
 * scaling the drawing to match keeps the design in 1080-unit coordinates while
 * the exported file comes out exactly 1080x1350 on every device. A card that is
 * 3x too large is not merely wasteful -- Instagram re-compresses it, which is
 * visible on text.
 */
export const cardPointSize = () => {
  const density = PixelRatio.get();
  // Snap to whole device pixels. Without this the layout can settle a fraction
  // of a point short and the snapshot comes out 1347px instead of 1350 -- one
  // card in a deck differing by three pixels is enough for Instagram to crop
  // or pad it away from the others.
  const width = PixelRatio.roundToNearestPixel(CARD_WIDTH / density);
  const height = PixelRatio.roundToNearestPixel(CARD_HEIGHT / density);
  return { width, height, scale: width / CARD_WIDTH };
};

const MARGIN = 96;
const TITLE_SIZE = 76;
const BODY_SIZE = 46;
const LINE_GAP = 1.42;

/** Greedy word wrap against the measured width of the actual font. */
export const wrapLines = (
  text: string,
  font: { measureText: (s: string) => { width: number } },
  maxWidth: number,
): string[] => {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
};

interface Props {
  slide: Slide;
  index: number;
  total: number;
  theme: CarouselTheme;
}

/**
 * The card's drawing, independent of any canvas.
 *
 * Export renders this off-screen at the full 1080x1350 rather than snapshotting
 * the preview: a snapshot only captures what the view actually rendered, so a
 * card scrolled partly out of sight exported three pixels short, and a deck
 * longer than the screen would export whatever happened to be visible.
 */
export const CardScene: React.FC<Props> = ({ slide, index, total, theme }) => {
  const titleFont = matchFont({ fontFamily: 'Helvetica', fontSize: TITLE_SIZE, fontWeight: 'bold' });
  const bodyFont = matchFont({ fontFamily: 'Helvetica', fontSize: BODY_SIZE });

  const maxWidth = CARD_WIDTH - MARGIN * 2;
  let y = MARGIN + TITLE_SIZE;

  const titleLines = slide.title ? wrapLines(slide.title, titleFont, maxWidth) : [];
  const bodyBlocks = slide.body.map((p) => wrapLines(p, bodyFont, maxWidth));

  return (
    <Group>
      <Rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} color={theme.background} />
      {/* Accent bar anchors the eye and makes the deck read as one set. */}
      <Rect x={0} y={0} width={CARD_WIDTH} height={14} color={theme.accent} />
      <Group>
        {titleLines.map((line, i) => {
          const at = y + i * TITLE_SIZE * LINE_GAP;
          return <SkText key={`t${i}`} x={MARGIN} y={at} text={line} font={titleFont} color={theme.title} />;
        })}
        {(() => {
          let cursor = y + titleLines.length * TITLE_SIZE * LINE_GAP + (titleLines.length ? BODY_SIZE : 0);
          return bodyBlocks.flatMap((lines, b) =>
            lines.map((line, i) => {
              const at = cursor + i * BODY_SIZE * LINE_GAP;
              if (i === lines.length - 1) cursor = at + BODY_SIZE * LINE_GAP * 1.4;
              return <SkText key={`b${b}-${i}`} x={MARGIN} y={at} text={line} font={bodyFont} color={theme.body} />;
            })
          );
        })()}
      </Group>
      {/* Position marker: a carousel is read as a sequence, so each card says
          where it sits without the reader counting dots. */}
      <SkText
        x={MARGIN}
        y={CARD_HEIGHT - MARGIN}
        text={`${index + 1} / ${total}`}
        font={bodyFont}
        color={theme.muted}
      />
    </Group>
  );
};

/** Live preview of a card, scaled down from the export design size. */
export const CarouselCard: React.FC<Props> = (props) => {
  const { width, height, scale } = cardPointSize();
  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ scale }]}>
        <CardScene {...props} />
      </Group>
    </Canvas>
  );
};
