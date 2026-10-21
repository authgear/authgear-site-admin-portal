import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import cn from "classnames";
import { Badge, Popover, TextField } from "@radix-ui/themes";
// Radix Themes 3.3.0's Popover.Anchor drops its children, which hid the
// search box, so use the primitive's Anchor. Themes is built on this same
// radix-ui package, so it shares the Popover.Root context.
import { Popover as PopoverPrimitive } from "radix-ui";
import { Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { COUNTRIES } from "../../data/countries";
import styles from "./CountryTagPicker.module.css";

export interface CountryTagPickerProps {
  /** Selected ISO 3166-1 alpha-2 codes, in selection order. */
  selectedCodes: string[];
  disabled?: boolean;
  onChange: (codes: string[]) => void;
}

const MAX_SUGGESTIONS = 20;

function countryLabel(code: string): string {
  const country = COUNTRIES.find((c) => c.code === code);
  return country ? `${country.name} (${code})` : code;
}

/**
 * A small country combobox: a search input with a suggestion list, plus the
 * current selection rendered as removable chips. Matching mirrors the old
 * Fluent TagPicker's resolver -- code prefix or name substring, excluding
 * already-selected codes, capped at 20 suggestions, shown only once the user
 * has typed something.
 */
const CountryTagPicker: React.VFC<CountryTagPickerProps> =
  function CountryTagPicker({ selectedCodes, disabled, onChange }) {
    const listboxId = useId();
    const optionIdPrefix = useId();
    const anchorRef = useRef<HTMLDivElement>(null);
    const [filter, setFilter] = useState("");
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const suggestions = useMemo(() => {
      const trimmed = filter.trim();
      if (trimmed === "") return [];
      const selected = new Set(selectedCodes);
      const lower = trimmed.toLowerCase();
      return COUNTRIES.filter(
        (c) =>
          !selected.has(c.code) &&
          (c.code.toLowerCase().startsWith(lower) ||
            c.name.toLowerCase().includes(lower))
      ).slice(0, MAX_SUGGESTIONS);
    }, [filter, selectedCodes]);

    const showList = open && !disabled && suggestions.length > 0;
    const clampedActive = Math.min(activeIndex, suggestions.length - 1);

    const selectCode = useCallback(
      (code: string) => {
        onChange([...selectedCodes, code]);
        setFilter("");
        setActiveIndex(0);
      },
      [onChange, selectedCodes]
    );

    const removeCode = useCallback(
      (code: string) => {
        onChange(selectedCodes.filter((c) => c !== code));
      },
      [onChange, selectedCodes]
    );

    const onInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter(e.currentTarget.value);
        setActiveIndex(0);
        setOpen(true);
      },
      []
    );

    const onInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
          case "ArrowDown":
            if (suggestions.length === 0) return;
            e.preventDefault();
            setOpen(true);
            setActiveIndex((i) => (i + 1) % suggestions.length);
            break;
          case "ArrowUp":
            if (suggestions.length === 0) return;
            e.preventDefault();
            setOpen(true);
            setActiveIndex(
              (i) => (i - 1 + suggestions.length) % suggestions.length
            );
            break;
          case "Enter":
            if (showList && clampedActive >= 0) {
              e.preventDefault();
              selectCode(suggestions[clampedActive].code);
            }
            break;
          case "Escape":
            setOpen(false);
            break;
          case "Backspace":
            if (filter === "" && selectedCodes.length > 0) {
              removeCode(selectedCodes[selectedCodes.length - 1]);
            }
            break;
          default:
            break;
        }
      },
      [
        suggestions,
        showList,
        clampedActive,
        selectCode,
        filter,
        selectedCodes,
        removeCode,
      ]
    );

    const onOpenChange = useCallback((next: boolean) => {
      if (!next) setOpen(false);
    }, []);

    const onOpenAutoFocus = useCallback((e: Event) => {
      // Keep focus in the search input while the list is shown.
      e.preventDefault();
    }, []);

    const onInteractOutside = useCallback((e: Event) => {
      const target = e.target as Node | null;
      if (target != null && anchorRef.current?.contains(target)) {
        e.preventDefault();
      }
    }, []);

    return (
      <div className={styles.root}>
        {selectedCodes.length > 0 && (
          <ul className={styles.chips} aria-label="Selected countries">
            {selectedCodes.map((code) => (
              <li key={code}>
                <Badge size="2" variant="soft" color="gray">
                  {countryLabel(code)}
                  <button
                    type="button"
                    className={styles.chipRemove}
                    aria-label={`Remove ${countryLabel(code)}`}
                    disabled={disabled}
                    onClick={() => removeCode(code)}
                  >
                    <Cross2Icon width="12" height="12" />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <Popover.Root open={showList} onOpenChange={onOpenChange} modal={false}>
          <PopoverPrimitive.Anchor ref={anchorRef} className={styles.anchor}>
            <TextField.Root
              size="2"
              variant="surface"
              placeholder="Search countries"
              value={filter}
              disabled={disabled}
              role="combobox"
              aria-label="Search countries"
              aria-expanded={showList}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                showList ? `${optionIdPrefix}-${clampedActive}` : undefined
              }
              onChange={onInputChange}
              onKeyDown={onInputKeyDown}
              onFocus={() => setOpen(true)}
            >
              <TextField.Slot side="left">
                <MagnifyingGlassIcon />
              </TextField.Slot>
            </TextField.Root>
          </PopoverPrimitive.Anchor>
          <Popover.Content
            size="1"
            align="start"
            sideOffset={4}
            className={styles.popover}
            onOpenAutoFocus={onOpenAutoFocus}
            onInteractOutside={onInteractOutside}
          >
            <ul id={listboxId} role="listbox" className={styles.listbox}>
              {suggestions.map((c, index) => (
                <li
                  key={c.code}
                  id={`${optionIdPrefix}-${index}`}
                  role="option"
                  aria-selected={index === clampedActive}
                  className={cn(
                    styles.option,
                    index === clampedActive && styles.optionActive
                  )}
                  // mousedown (not click) so the input keeps focus.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCode(c.code);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {countryLabel(c.code)}
                </li>
              ))}
            </ul>
          </Popover.Content>
        </Popover.Root>
      </div>
    );
  };

export default CountryTagPicker;
