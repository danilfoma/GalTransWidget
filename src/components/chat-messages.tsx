import { ArrowRightIcon, BotIcon } from "@/components/icons";
import type { ChatMessage, TripResult } from "@/types/chat";

function BotAvatar() {
  return (
    <span className="mt-0.5 flex size-[26px] shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
      <BotIcon className="size-[15px]" />
    </span>
  );
}

function TripResultCard({ trips }: { trips: TripResult[] }) {
  return (
    <div className="mt-2.5 flex flex-col gap-2 rounded-md border border-border bg-card p-2.5">
      {trips.map((trip) => (
        <div key={trip.id} className="flex items-center gap-2 text-[12.5px]">
          <span className="font-bold tabular-nums text-card-foreground">
            {trip.departTime}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="font-bold tabular-nums text-card-foreground">
            {trip.arriveTime}
          </span>
          {typeof trip.seatsLeft === "number" && (
            <span className="text-[11px] text-muted-foreground">
              {trip.seatsLeft} loc.
            </span>
          )}
          <span className="ml-auto font-extrabold text-brand">
            {trip.priceLabel}
          </span>
        </div>
      ))}
      <a
        href={trips[0]?.bookUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-brand text-[13px] font-bold text-brand-foreground transition-colors hover:bg-brand-hover"
      >
        <ArrowRightIcon className="size-[15px]" />
        View &amp; book
      </a>
    </div>
  );
}

export function MessageRow({ message }: { message: ChatMessage }) {
  const isBot = message.sender === "assistant";

  return (
    <div
      className={`flex max-w-[88%] gap-2.5 ${
        isBot ? "self-start" : "flex-row-reverse self-end"
      }`}
      style={{ animation: "wgt-in .22s ease-out" }}
    >
      {isBot && <BotAvatar />}
      <div className={isBot ? "" : "flex flex-col items-end"}>
        <div
          className={
            isBot
              ? "rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-[13.5px] leading-relaxed text-card-foreground"
              : "rounded-2xl rounded-br-sm bg-brand px-3.5 py-2.5 text-[13.5px] leading-relaxed text-brand-foreground"
          }
        >
          {message.text}
          {message.trips && message.trips.length > 0 && (
            <TripResultCard trips={message.trips} />
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingRow() {
  return (
    <div className="flex max-w-[88%] gap-2.5 self-start">
      <BotAvatar />
      <span className="inline-flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className="inline-block size-[7px] rounded-full bg-muted-foreground"
            style={{ animation: `wgt-bounce 1.3s ${i * 0.18}s infinite ease-in-out` }}
          />
        ))}
      </span>
    </div>
  );
}
