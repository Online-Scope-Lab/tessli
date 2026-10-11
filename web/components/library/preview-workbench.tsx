"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  PREVIEW_THEME_LABELS,
  PREVIEW_THEMES,
  PREVIEW_WIDTHS,
  previewPath,
  type PreviewTheme,
} from "@/lib/library";

import styles from "./library.module.css";

type Width = (typeof PREVIEW_WIDTHS)[number];

const MIN_HEIGHT = 320;

function stateLabel(state: string) {
  const words = state.replace(/-/g, " ");
  return words[0].toUpperCase() + words.slice(1);
}
const DEFAULT_HEIGHT = 720;

function Segmented<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
}: Readonly<{
  legend: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}>) {
  return (
    <fieldset className={styles.segmented}>
      <legend>{legend}</legend>
      <div className={styles.segmentedOptions}>
        {options.map((option) => (
          <label key={String(option.value)}>
            <input
              type="radio"
              name={name}
              value={String(option.value)}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PreviewWorkbench({
  slug,
  title,
  states,
}: Readonly<{ slug: string; title: string; states: readonly string[] }>) {
  const [theme, setTheme] = useState<PreviewTheme>("tessli");
  const [width, setWidth] = useState<Width>(1440);
  const [state, setState] = useState(states[0]);
  const [stageWidth, setStageWidth] = useState<number | null>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const contentObserver = useRef<ResizeObserver | null>(null);

  const src = previewPath(slug, {
    theme,
    state: state === states[0] ? undefined : state,
  });
  const scale = stageWidth ? Math.min(1, stageWidth / width) : 1;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageWidth(entry.contentRect.width);
    });
    observer.observe(stage);
    // On a phone, start with the phone-width preview rather than a tiny
    // desktop one; the reader can still switch.
    if (stage.clientWidth < 600) setWidth(390);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => contentObserver.current?.disconnect(), []);

  // The preview is same-origin, so its natural height can be measured. The
  // wrapper fills the viewport, so measure <main>, not the document.
  const measure = useCallback(() => {
    contentObserver.current?.disconnect();
    const frameWindow = frameRef.current?.contentWindow;
    const main = frameWindow?.document.querySelector("main");
    if (!frameWindow || !main) return;
    const update = () => {
      setHeight(Math.max(MIN_HEIGHT, Math.ceil(main.scrollHeight)));
    };
    update();
    const observer = new (
      frameWindow as Window & typeof globalThis
    ).ResizeObserver(update);
    observer.observe(main);
    contentObserver.current = observer;
  }, []);

  // The iframe can finish loading before hydration attaches onLoad.
  useEffect(() => {
    if (frameRef.current?.contentDocument?.readyState === "complete") {
      measure();
    }
  }, [measure]);

  const percent = Math.round(scale * 100);

  return (
    <div className={styles.workbench} data-preview-workbench>
      <div className={styles.toolbar}>
        <Segmented
          legend="Theme"
          name={`${slug}-theme`}
          options={PREVIEW_THEMES.map((value) => ({
            value,
            label: PREVIEW_THEME_LABELS[value],
          }))}
          value={theme}
          onChange={setTheme}
        />
        <Segmented
          legend="Width"
          name={`${slug}-width`}
          options={PREVIEW_WIDTHS.map((value) => ({
            value,
            label: `${value} px`,
          }))}
          value={width}
          onChange={setWidth}
        />
        {states.length > 1 ? (
          <Segmented
            legend="State"
            name={`${slug}-state`}
            options={states.map((value) => ({
              value,
              label: stateLabel(value),
            }))}
            value={state}
            onChange={setState}
          />
        ) : null}
      </div>

      <div
        ref={stageRef}
        className={styles.stage}
        style={{ height: Math.ceil(height * scale) }}
      >
        <iframe
          ref={frameRef}
          className={styles.stageFrame}
          src={src}
          title={`${title}: ${state.replace(/-/g, " ")} state, ${PREVIEW_THEME_LABELS[theme]} theme, ${width} px wide`}
          onLoad={measure}
          style={{
            width,
            height,
            // Scaled down to fit the column, or centred when it already fits.
            ...(scale < 1
              ? { transform: `scale(${scale})` }
              : { left: `calc(50% - ${width / 2}px)` }),
          }}
        />
      </div>
      <p className={styles.stageNote}>
        {width} px wide{scale < 1 ? `, shown at ${percent}%` : ""}.{" "}
        <a href={src} target="_blank" rel="noopener noreferrer">
          Open this preview on its own ↗
        </a>
      </p>
    </div>
  );
}
