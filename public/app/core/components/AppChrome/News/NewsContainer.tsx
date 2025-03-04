import { ToolbarButton } from '@grafana/ui';

interface NewsContainerProps {
  className?: string;
}

export function NewsContainer({ className }: NewsContainerProps) {
  return (
    <>
      <ToolbarButton className={className} iconOnly icon="rss" aria-label="News" />
    </>
  );
}
