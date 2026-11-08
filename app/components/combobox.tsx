"use client";

import {
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  children?: ReactNode;
};

const defaultInputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className,
  children,
}: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    const unique = Array.from(new Set(options.filter(Boolean)));

    if (!query) return unique;

    return unique.filter((option) => option.toLowerCase().includes(query));
  }, [options, value]);

  function select(option: string) {
    onChange(option);
    setOpen(false);
    setHighlight(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => Math.min(current + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      if (open && suggestions.length > 0) {
        event.preventDefault();
        select(suggestions[highlight >= 0 ? highlight : 0]);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
      return;
    }

    if (event.key === "Tab") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  return (
    <div className="relative">
      {children}
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setHighlight(-1);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={className ?? defaultInputClass}
      />

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {suggestions.map((option, index) => (
            <li key={option} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(option)}
                onMouseEnter={() => setHighlight(index)}
                className={`block w-full px-3 py-1.5 text-left transition ${
                  index === highlight
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
