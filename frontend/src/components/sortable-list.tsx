"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

interface SortableListProps<T extends { _id: string }> {
	items: T[];
	onReorder: (items: T[]) => void;
	renderItem: (item: T, index: number) => ReactNode;
	getId?: (item: T) => string;
}

export function SortableList<T extends { _id: string }>({
	items,
	onReorder,
	renderItem,
	getId = (item) => item._id,
}: SortableListProps<T>) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = items.findIndex((item) => getId(item) === active.id);
			const newIndex = items.findIndex((item) => getId(item) === over.id);
			const newItems = arrayMove(items, oldIndex, newIndex);
			onReorder(newItems);
		}
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={items.map(getId)}
				strategy={verticalListSortingStrategy}
			>
				<div className="space-y-2">
					{items.map((item, index) => (
						<SortableItem key={getId(item)} id={getId(item)}>
							{renderItem(item, index)}
						</SortableItem>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

interface SortableItemProps {
	id: string;
	children: ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`relative ${isDragging ? "z-50" : ""}`}
		>
			<div className="flex items-center gap-2">
				{/* Drag handle */}
				<button
					{...attributes}
					{...listeners}
					className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground hover:text-rose transition-colors touch-none"
					aria-label="Drag to reorder"
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
						<circle cx="3" cy="2" r="1.5" />
						<circle cx="9" cy="2" r="1.5" />
						<circle cx="3" cy="6" r="1.5" />
						<circle cx="9" cy="6" r="1.5" />
						<circle cx="3" cy="10" r="1.5" />
						<circle cx="9" cy="10" r="1.5" />
					</svg>
				</button>
				<div className="flex-1">{children}</div>
			</div>
		</div>
	);
}
