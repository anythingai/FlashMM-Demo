"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AgentStatusProps = {
  // Engine controls
  paused: boolean;
  setPaused: (v: boolean) => void;

  // Step states
  connected: boolean;
  ingesting: boolean;
  normalized: boolean;
  predicting: boolean;
  quoting: boolean;
  routerBound: boolean;
  telemetryOn: boolean;
  failsafeArmed: boolean;

  // Step actions (presenter clicks to advance)
  onConnect: () => void;
  onStartIngest: () => void;
  onNormalize: () => void;
  onStartPredict: () => void;
  onStartQuoting: () => void;
  onBindRouter: () => void;
  onEnableTelemetry: () => void;
  onArmFailsafe: () => void;
};

export function AgentStatus(props: AgentStatusProps) {
  const {
    paused,
    setPaused,
    connected,
    ingesting,
    normalized,
    predicting,
    quoting,
    routerBound,
    telemetryOn,
    failsafeArmed,
    onConnect,
    onStartIngest,
    onNormalize,
    onStartPredict,
    onStartQuoting,
    onBindRouter,
    onEnableTelemetry,
    onArmFailsafe,
  } = props;

  const [logs, setLogs] = React.useState<string[]>([]);

  function log(line: string) {
    setLogs((prev) => {
      const next = [`${new Date().toLocaleTimeString()} • ${line}`, ...prev];
      return next.slice(0, 80);
    });
  }

  // Button wrappers that log on click
  const act = (fn: () => void, msg: string) => () => {
    fn();
    log(msg);
  };

  function pauseAgent() {
    setPaused(true);
    log("Engine paused by operator");
  }

  function resumeAgent() {
    setPaused(false);
    log("Engine resumed by operator");
  }

  function stopAgent() {
    // Presenter can pause then toggle steps off using their buttons if desired.
    setPaused(true);
    log("Agent stopped (engine paused). Toggle steps to reset the flow.");
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
            {connected ? "WS: Connected" : "WS: Disconnected"}
          </Badge>
          <Badge variant="secondary" className="bg-sky-500/10 text-sky-300 border-sky-500/30">
            Engine: {paused ? "Paused" : "Running"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {paused ? (
            <Button variant="default" onClick={resumeAgent}>Resume</Button>
          ) : (
            <Button variant="secondary" onClick={pauseAgent}>Pause</Button>
          )}
          <Button variant="outline" onClick={stopAgent}>Stop</Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <StepItem
          done={connected}
          label="Connect to Sei CLOB (WS)"
          onClick={act(onConnect, "Connected to Sei CLOB")}
          action="Connect"
        />
        <StepItem
          done={ingesting}
          label="Start order‑book + trades stream"
          onClick={act(onStartIngest, "Real‑time ingestion started")}
          action="Start Stream"
          disabled={!connected}
        />
        <StepItem
          done={normalized}
          label="Normalize data for model input"
          onClick={act(onNormalize, "Normalization enabled")}
          action="Normalize"
          disabled={!connected || !ingesting}
        />
        <StepItem
          done={predicting}
          label="Start prediction loop (5 Hz)"
          onClick={act(onStartPredict, "Prediction loop started")}
          action="Start Prediction"
          disabled={!connected || !ingesting || !normalized}
        />
        <StepItem
          done={quoting}
          label="Generate quotes (3 levels/side)"
          onClick={act(onStartQuoting, "Quoting enabled")}
          action="Start Quoting"
          disabled={!connected || !ingesting || !predicting}
        />
        <StepItem
          done={routerBound}
          label="Bind order router"
          onClick={act(onBindRouter, "Order router bound")}
          action="Bind Router"
          disabled={!quoting}
        />
        <StepItem
          done={telemetryOn}
          label="Enable telemetry"
          onClick={act(onEnableTelemetry, "Telemetry enabled")}
          action="Enable Telemetry"
          disabled={!routerBound}
        />
        <StepItem
          done={failsafeArmed}
          label="Arm kill‑switch (extreme vol)"
          onClick={act(onArmFailsafe, "Failsafe armed")}
          action="Arm Failsafe"
          disabled={!predicting}
        />
      </div>

      <div className="rounded border">
        <div className="px-3 py-2 text-xs text-muted-foreground border-b">Logs</div>
        <div className="max-h-48 overflow-y-auto px-3 py-2 text-xs font-mono space-y-1">
          {logs.length === 0 ? (
            <div className="text-muted-foreground">No logs yet. Click steps above to proceed.</div>
          ) : (
            logs.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
      </div>
    </Card>
  );
}

function StepItem({
  done,
  label,
  action,
  onClick,
  disabled,
}: {
  done: boolean;
  label: string;
  action: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border px-3 py-2 bg-background/60">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            done ? "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]" : "bg-muted-foreground/40"
          }`}
        />
        <span className={`text-xs ${done ? "text-emerald-300" : "text-muted-foreground"}`}>{label}</span>
      </div>
      <Button size="sm" variant={done ? "secondary" : "default"} onClick={onClick} disabled={disabled || done}>
        {done ? "Done" : action}
      </Button>
    </div>
  );
}