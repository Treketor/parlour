"use client";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useId,
  useState,
  useTransition,
  type KeyboardEventHandler,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { useShouldReduceMotion } from "@/components/Providers";
import { IconButton } from "@/components/ui/Button";
import { GameCover } from "@/components/ui/GameCover";
import { CloseIcon, GripIcon } from "@/components/ui/icons";
import { ProgressGlyph } from "@/components/ui/ProgressGlyph";
import { showsProgress } from "@/lib/data/edit-entry";
import type { QueueItem } from "@/lib/data/queue";
import { duration, easing } from "@/lib/motion";
import { progressLabel } from "@/lib/progress";
import { moveQueueItem, unqueueEntry } from "./actions";
import styles from "./queue.module.css";

/** How long a removed row takes to fade before it leaves the list. */
const LEAVE_MS = duration.fast;

/**
 * The queue, in order. Rows are dragged by their handle, or moved from the
 * keyboard: focus a handle, press Space, move with the arrow keys, Space
 * again to drop, Escape to cancel. Each move is shown at once and saved as
 * one row behind it (DECISIONS.md 047).
 */
export function QueueList({ initialItems }: { initialItems: QueueItem[] }) {
  const router = useRouter();
  const reduceMotion = useShouldReduceMotion();
  const [items, setItems] = useState(initialItems);
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startSaving] = useTransition();
  const dndId = useId();

  const sensors = useSensors(
    // A mouse drags from anywhere on a row after a few pixels, so a click is still a click.
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // A finger has to rest a moment first, so swiping through a long queue still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const titleOf = (id: string | number) => items.find((item) => item.id === id)?.title ?? "Game";
  const placeOf = (id: string | number) => items.findIndex((item) => item.id === id) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}, number ${placeOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is now at number ${placeOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${titleOf(active.id)} dropped at number ${placeOf(over.id)}.`
        : `${titleOf(active.id)} was not moved.`,
    onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled.`,
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    const previous = items;
    const next = arrayMove(items, from, to);
    setItems(next);
    setError(null);

    startSaving(async () => {
      const result = await moveQueueItem({
        itemId: String(active.id),
        beforeId: next[to - 1]?.id ?? null,
        afterId: next[to + 1]?.id ?? null,
      });
      if (result.status === "saved") return;
      setItems(previous);
      setError(result.message);
      if (result.status === "stale") router.refresh();
    });
  }

  function remove(item: QueueItem) {
    setError(null);
    setLeaving((current) => new Set(current).add(item.id));
    // The row fades first, then leaves; the server hears at once.
    window.setTimeout(
      () => setItems((current) => current.filter((candidate) => candidate.id !== item.id)),
      reduceMotion ? 0 : LEAVE_MS,
    );
    startSaving(async () => {
      const result = await unqueueEntry({ entryId: item.entryId });
      if (result.status === "saved") return;
      setItems((current) =>
        current.some((candidate) => candidate.id === item.id)
          ? current
          : [...current, item].sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1)),
      );
      setLeaving((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      setError(result.message);
    });
  }

  if (items.length === 0) return null;

  return (
    <div className={styles.queue}>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <DndContext
        // A stable id: dnd-kit otherwise numbers its descriptions with a global
        // counter, which differs between the server and the browser.
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "To move a game, press Space to pick it up, use the up and down arrow keys to move it, then press Space to drop it, or Escape to cancel.",
          },
        }}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ol className={styles.list}>
            {items.map((item, index) => (
              <QueueRow
                key={item.id}
                item={item}
                position={index + 1}
                leaving={leaving.has(item.id)}
                reduceMotion={reduceMotion}
                onRemove={() => remove(item)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

type QueueRowProps = {
  item: QueueItem;
  position: number;
  leaving: boolean;
  reduceMotion: boolean;
  onRemove: () => void;
};

function QueueRow({ item, position, leaving, reduceMotion, onRemove }: QueueRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    // Neighbours glide aside with the app's move easing; with reduced motion they jump.
    transition: reduceMotion
      ? null
      : { duration: duration.base, easing: `cubic-bezier(${easing.out.join(", ")})` },
  });

  // The row answers a mouse or a finger anywhere; the keyboard works through
  // the handle, which stays the one focusable control for moving.
  const { onKeyDown, ...pointer } = listeners ?? {};
  // The title and the remove button keep their own clicks rather than starting a drag.
  const own = {
    onMouseDown: (event: MouseEvent) => event.stopPropagation(),
    onTouchStart: (event: TouchEvent) => event.stopPropagation(),
  };

  return (
    <li
      ref={setNodeRef}
      className={styles.row}
      data-dragging={isDragging || undefined}
      data-leaving={leaving || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...pointer}
    >
      <span className={styles.position} aria-hidden="true">
        {position}
      </span>
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={styles.handle}
        aria-label={`Move ${item.title}, number ${position}`}
        {...attributes}
        // dnd-kit types its listeners loosely; this one is its keyboard sensor's handler.
        onKeyDown={onKeyDown as KeyboardEventHandler<HTMLButtonElement> | undefined}
      >
        <GripIcon />
      </button>
      <span className={styles.thumb}>
        <GameCover title={item.title} src={item.thumbUrl} size="thumb" />
      </span>
      <span className={styles.text}>
        <Link href={`/?entry=${item.entryId}`} className={styles.title} {...own}>
          {item.title}
        </Link>
        <span className={styles.meta}>
          {position === 1 && <span className={styles.upNext}>Up next</span>}
          <span>{item.platform}</span>
          {showsProgress(item.ownership) && (
            <span className={styles.progress}>
              <ProgressGlyph progress={item.progress} />
              {progressLabel[item.progress]}
            </span>
          )}
        </span>
      </span>
      <IconButton
        label={`Take ${item.title} off the queue`}
        variant="quiet"
        size="sm"
        onClick={onRemove}
        className={styles.remove}
        {...own}
      >
        <CloseIcon width={14} height={14} />
      </IconButton>
    </li>
  );
}
