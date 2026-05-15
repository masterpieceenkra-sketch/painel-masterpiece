interface Props {
  number: number | string;
  title?: string;
  children: React.ReactNode;
}

export function Step({ number, title, children }: Props) {
  return (
    <div className="my-6 flex gap-5">
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--border-strong)] bg-[var(--navy-light)] font-display text-[var(--gold)]">
          {number}
        </div>
      </div>
      <div className="flex-1 pt-1">
        {title && (
          <h3 className="font-display text-base text-[var(--gold)] mb-2">
            {title}
          </h3>
        )}
        <div className="text-sm text-[var(--white)]/85">{children}</div>
      </div>
    </div>
  );
}
