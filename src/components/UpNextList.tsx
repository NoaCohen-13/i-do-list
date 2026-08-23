"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TodoCheckbox, BudgetBookedCheckbox } from "@/components/TodoCheckbox";
import { tagColor } from "@/lib/tag-color";

type UpNextItem = {
  kind: "todo" | "vendor";
  id: string;
  title: string;
  tag: string | null;
  done: boolean;
};

function GripIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-none">
      <circle cx="7" cy="4" r="1.3" />
      <circle cx="13" cy="4" r="1.3" />
      <circle cx="7" cy="10" r="1.3" />
      <circle cx="13" cy="10" r="1.3" />
      <circle cx="7" cy="16" r="1.3" />
      <circle cx="13" cy="16" r="1.3" />
    </svg>
  );
}

function UpNextRow({ item, canEdit }: { item: UpNextItem; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEdit,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3.5 border-b border-border bg-surface px-4.5 py-3.5 last:border-b-0 ${
        isDragging ? "relative z-10 opacity-90 shadow-lg" : ""
      }`}
    >
      {canEdit && (
        <button
          type="button"
          className="flex-none cursor-grab touch-none text-text-muted hover:text-text active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
      )}
      {item.kind === "todo" ? (
        <TodoCheckbox id={item.id} done={item.done} readOnly={!canEdit} />
      ) : (
        <BudgetBookedCheckbox id={item.id} booked={item.done} readOnly={!canEdit} />
      )}
      <div dir="auto" className="flex-1 font-bold">
        {item.title}
      </div>
      {item.tag && (
        <span
          dir="auto"
          className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${tagColor(item.tag)}`}
        >
          {item.tag}
        </span>
      )}
    </div>
  );
}

export function UpNextList({ items, canEdit }: { items: UpNextItem[]; canEdit: boolean }) {
  const [ordered, setOrdered] = useState(items);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (ordered.length === 0) {
    return (
      <p className="p-6 text-text-muted">No open tasks yet — add some on the To-Dos page.</p>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrdered((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      import("@/app/(app)/actions").then(({ reorderUpNext }) =>
        reorderUpNext(next.map((i) => ({ id: i.id, kind: i.kind })))
      );
      return next;
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ordered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {ordered.map((item) => (
          <UpNextRow key={item.id} item={item} canEdit={canEdit} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
