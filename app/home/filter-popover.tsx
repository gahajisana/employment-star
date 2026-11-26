import { DownOutlined } from "@ant-design/icons";
import { Button, Flex, Popover, Typography } from "antd";
import { useRef, type ReactNode } from "react";

interface FilterPopoverProps {
  id: string;
  label: string;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function FilterPopover({
  id,
  label,
  title = label,
  open,
  onOpenChange,
  children,
}: FilterPopoverProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const mayAutofocus = useRef(false);

  return (
    <Popover
      title={title}
      trigger="click"
      placement="bottom"
      open={open}
      onOpenChange={(opened) => {
        mayAutofocus.current = opened;
        onOpenChange(opened);
      }}
      destroyOnHidden={false}
      fresh
      afterOpenChange={(opened) => {
        if (
          opened &&
          mayAutofocus.current &&
          document.activeElement === trigger.current
        ) {
          panel.current
            ?.querySelector<HTMLElement>("input:not([disabled])")
            ?.focus();
        }
      }}
      content={
        <Flex
          ref={panel}
          id={id}
          role="group"
          aria-label={title}
          vertical
          gap={16}
          className="home-filter-panel"
          // Opening animations must not steal focus from a field already in use.
          onPointerDownCapture={() => {
            mayAutofocus.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              onOpenChange(false);
              trigger.current?.focus();
            }
          }}
        >
          {children}
        </Flex>
      }
    >
      <Button
        ref={trigger}
        className="home-filter home-filter-trigger"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        title={label}
      >
        <Typography.Text ellipsis>{label}</Typography.Text>
        <DownOutlined className="home-filter-chevron" aria-hidden />
      </Button>
    </Popover>
  );
}
