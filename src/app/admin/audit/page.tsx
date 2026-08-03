"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Shield,
  Clock,
  User,
  FileText,
  Filter,
  Download,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  AlertCircle,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const actionColors: Record<string, string> = {
  "product.create": "bg-emerald-100 text-emerald-700",
  "product.update": "bg-blue-100 text-blue-700",
  "product.delete": "bg-red-100 text-red-700",
  "category.create": "bg-emerald-100 text-emerald-700",
  "category.update": "bg-blue-100 text-blue-700",
  "category.delete": "bg-red-100 text-red-700",
  "coupon.create": "bg-emerald-100 text-emerald-700",
  "coupon.update": "bg-blue-100 text-blue-700",
  "coupon.delete": "bg-red-100 text-red-700",
  "order.status_update": "bg-amber-100 text-amber-700",
  "user.role_change": "bg-violet-100 text-violet-700",
  "user.suspend": "bg-red-100 text-red-700",
  "user.activate": "bg-emerald-100 text-emerald-700",
  "settings.update": "bg-blue-100 text-blue-700",
  "settings.create": "bg-emerald-100 text-emerald-700",
  "settings.bulk_update": "bg-blue-100 text-blue-700",
  "http.post": "bg-indigo-100 text-indigo-700",
  "http.get": "bg-sky-100 text-sky-700",
  "download.revoke": "bg-red-100 text-red-700",
  "download.reset_limit": "bg-amber-100 text-amber-700",
  "invitation.resend": "bg-violet-100 text-violet-700",
  "invitation.revoke": "bg-red-100 text-red-700",
  "return.status_update": "bg-amber-100 text-amber-700",
  "media.upload": "bg-emerald-100 text-emerald-700",
  "media.delete": "bg-red-100 text-red-700",
  "resource.create": "bg-emerald-100 text-emerald-700",
  "resource.update": "bg-blue-100 text-blue-700",
  "resource.delete": "bg-red-100 text-red-700",
  "customer.create": "bg-emerald-100 text-emerald-700",
  "customer.update": "bg-blue-100 text-blue-700",
  "customer.delete": "bg-red-100 text-red-700",
  "subscriber.remove": "bg-red-100 text-red-700",
  "contact.delete": "bg-red-100 text-red-700",
};

const actionIcons: Record<string, typeof FileText> = {
  "product.create": ArrowUpRight,
  "product.update": FileText,
  "product.delete": ArrowDownRight,
  "category.create": ArrowUpRight,
  "category.update": FileText,
  "category.delete": ArrowDownRight,
  "coupon.create": ArrowUpRight,
  "coupon.update": FileText,
  "coupon.delete": ArrowDownRight,
  "order.status_update": Activity,
  "user.role_change": Shield,
  "user.suspend": Minus,
  "user.activate": ArrowUpRight,
  "settings.update": FileText,
  "settings.create": ArrowUpRight,
  "settings.bulk_update": FileText,
  "http.post": Activity,
  "http.get": Activity,
};

const levelColors: Record<string, string> = {
  info: "bg-sky-100 text-sky-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  critical: "bg-red-200 text-red-800 font-bold",
};

const levelIcons: Record<string, typeof FileText> = {
  info: Activity,
  warning: AlertTriangle,
  error: AlertCircle,
  critical: AlertCircle,
};

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [detailLog, setDetailLog] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<"all" | "errors" | "performance">("all");

  const startDate = useMemo(() => Date.now() - days * 24 * 60 * 60 * 1000, [days]);

  const stats = useQuery(api.auditLogs.stats, { startDate });
  const performanceData = useQuery(api.auditLogs.performance, { startDate, limit: 20 });
  const errorsData = useQuery(api.auditLogs.errors, {
    startDate,
    limit: 50,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
  });
  const entityTypes = useQuery(api.auditLogs.uniqueEntityTypes);
  const { logs, total } = useQuery(api.auditLogs.list, {
    entityType: entityFilter !== "all" ? entityFilter : undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    level: levelFilter !== "all" ? levelFilter : undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    search: search || undefined,
    startDate,
    limit: 200,
  }) ?? { logs: [], total: 0 };

  const perPage = 20;
  const totalPages = Math.ceil(total / perPage);
  const paginated = logs.slice((page - 1) * perPage, page * perPage);

  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    for (const log of logs) actions.add(log.action);
    return [...actions].sort();
  }, [logs]);

  return (
    <div>
      <AdminPageHeader
        title="Audit & System Health"
        description="Track all system changes, user actions, performance metrics, and errors."
      />

      {/* Primary Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Total Events</p>
                <p className="mt-1 font-heading text-2xl font-bold text-primary">{stats?.total ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Errors</p>
                <p className="mt-1 font-heading text-2xl font-bold text-red-600">{stats?.errorCount ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Avg Latency</p>
                <p className="mt-1 font-heading text-2xl font-bold text-primary">
                  {stats?.avgLatencyMs ? formatLatency(stats.avgLatencyMs) : "—"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Zap className="h-5 w-5 text-accent-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Slow Operations</p>
                <p className="mt-1 font-heading text-2xl font-bold text-amber-600">{stats?.slowOpsCount ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      {performanceData && performanceData.total > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-medium uppercase text-muted">P50 Latency</p>
              <p className="mt-1 font-heading text-lg font-bold text-primary">{formatLatency(performanceData.p50)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-medium uppercase text-muted">P95 Latency</p>
              <p className="mt-1 font-heading text-lg font-bold text-amber-600">{formatLatency(performanceData.p95)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-medium uppercase text-muted">P99 Latency</p>
              <p className="mt-1 font-heading text-lg font-bold text-red-600">{formatLatency(performanceData.p99)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-medium uppercase text-muted">Tracked Operations</p>
              <p className="mt-1 font-heading text-lg font-bold text-primary">{performanceData.total}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Bar */}
      <div className="mb-4 flex gap-1 rounded-lg bg-surface p-1">
        {(["all", "errors", "performance"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-background shadow-sm text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab === "all" && "All Events"}
            {tab === "errors" && `Errors${(stats?.errorCount ?? 0) > 0 ? ` (${stats!.errorCount})` : ""}`}
            {tab === "performance" && "Performance"}
          </button>
        ))}
      </div>

      {/* Errors Tab */}
      {activeTab === "errors" && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Error Log ({errorsData?.total ?? 0} errors)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(errorsData?.errors ?? []).length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<Shield className="h-8 w-8" />}
                  title="No errors found"
                  description="No errors recorded in this time period."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Time</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(errorsData?.errors ?? []).map((err) => {
                      const LevelIcon = levelIcons[err.level ?? "error"] ?? AlertCircle;
                      return (
                        <TableRow
                          key={err._id}
                          className="cursor-pointer hover:bg-surface/50"
                          onClick={() => setDetailLog(err)}
                        >
                          <TableCell className="text-xs text-muted whitespace-nowrap">
                            {formatTimeAgo(err.createdAt)}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelColors[err.level ?? "error"] ?? "bg-gray-100 text-gray-700"}`}>
                              <LevelIcon className="h-3 w-3" />
                              {err.level ?? "error"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono">{err.action}</span>
                          </TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate">{err.summary}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{err.source ?? "—"}</Badge>
                          </TableCell>
                          <TableCell>
                            <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && performanceData && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              Slow Operations ({performanceData.slowOps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {performanceData.slowOps.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<Zap className="h-8 w-8" />}
                  title="No slow operations"
                  description="No operations exceeded the 2s threshold in this time period."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead className="w-[100px]">Latency</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Actor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.slowOps.map((op) => (
                      <TableRow
                        key={op._id}
                        className="cursor-pointer hover:bg-surface/50"
                        onClick={() => setDetailLog(op)}
                      >
                        <TableCell className="text-xs text-muted whitespace-nowrap">
                          {formatTimeAgo(op.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">{op.action}</span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">{op.summary}</TableCell>
                        <TableCell>
                          <span className={`font-mono text-sm font-bold ${
                            (op.latencyMs ?? 0) > 5000 ? "text-red-600" : (op.latencyMs ?? 0) > 2000 ? "text-amber-600" : "text-primary"
                          }`}>
                            {formatLatency(op.latencyMs ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{op.source ?? "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted">{op.actorEmail}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Events Tab — Filters */}
      {activeTab === "all" && (
        <>
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9"
                  />
                </div>
                <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v ?? "all"); setPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="mr-2 h-3.5 w-3.5" />
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {(entityTypes ?? []).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v ?? "all"); setPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <Activity className="mr-2 h-3.5 w-3.5" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v ?? "all"); setPage(1); }}>
                  <SelectTrigger className="w-[130px]">
                    <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v ?? "all"); setPage(1); }}>
                  <SelectTrigger className="w-[130px]">
                    <Zap className="mr-2 h-3.5 w-3.5" />
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="mutation">Mutation</SelectItem>
                    <SelectItem value="query">Query</SelectItem>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="scheduler">Scheduler</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={String(days)} onValueChange={(v) => { setDays(Number(v ?? 30)); setPage(1); }}>
                  <SelectTrigger className="w-[130px]">
                    <Clock className="mr-2 h-3.5 w-3.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activity Log ({total.toLocaleString()} events)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {paginated.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={<Shield className="h-8 w-8" />}
                    title="No audit logs found"
                    description="No events match your current filters."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Time</TableHead>
                        <TableHead className="w-[80px]">Level</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead className="w-[80px]">Source</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead className="w-[100px]">Entity</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((log) => {
                        const Icon = actionIcons[log.action] ?? FileText;
                        const colorClass = actionColors[log.action] ?? "bg-gray-100 text-gray-700";
                        const level = log.level ?? "info";
                        const LevelIcon = levelIcons[level] ?? Activity;
                        return (
                          <TableRow
                            key={log._id}
                            className="cursor-pointer hover:bg-surface/50"
                            onClick={() => setDetailLog(log)}
                          >
                            <TableCell className="text-xs text-muted whitespace-nowrap">
                              {formatTimeAgo(log.createdAt)}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelColors[level] ?? "bg-gray-100 text-gray-700"}`}>
                                <LevelIcon className="h-3 w-3" />
                                {level}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorClass}`}>
                                <Icon className="h-3 w-3" />
                                {log.action}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm max-w-[300px] truncate">{log.summary}</TableCell>
                            <TableCell>
                              {log.source && (
                                <Badge variant="outline" className="text-[10px]">{log.source}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted">{log.actorEmail}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] font-mono">{log.entityType}</Badge>
                            </TableCell>
                            <TableCell>
                              <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <span className="text-xs text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailLog} onOpenChange={() => setDetailLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Detail</DialogTitle>
          </DialogHeader>
          {detailLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Action</p>
                  <p className="mt-1 text-sm font-medium">{detailLog.action}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Time</p>
                  <p className="mt-1 text-sm">{new Date(detailLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Actor</p>
                  <p className="mt-1 text-sm">{detailLog.actorName ?? detailLog.actorEmail}</p>
                  <p className="text-xs text-muted">{detailLog.actorEmail}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Entity</p>
                  <p className="mt-1 text-sm font-mono">{detailLog.entityType}</p>
                  <p className="text-xs text-muted font-mono">{detailLog.entityId}</p>
                </div>
              </div>

              {/* Level & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Level</p>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${levelColors[detailLog.level ?? "info"] ?? "bg-gray-100 text-gray-700"}`}>
                    {detailLog.level ?? "info"}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Source</p>
                  <Badge variant="outline" className="mt-1">{detailLog.source ?? "—"}</Badge>
                </div>
              </div>

              {/* Latency */}
              {detailLog.latencyMs != null && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Latency</p>
                  <p className={`mt-1 font-mono text-lg font-bold ${
                    detailLog.latencyMs > 5000 ? "text-red-600" : detailLog.latencyMs > 2000 ? "text-amber-600" : "text-primary"
                  }`}>
                    {formatLatency(detailLog.latencyMs)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[11px] font-medium uppercase text-muted">Summary</p>
                <p className="mt-1 text-sm">{detailLog.summary}</p>
              </div>

              {detailLog.changes && Object.keys(detailLog.changes).length > 0 && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Changes</p>
                  <pre className="mt-2 rounded-lg bg-surface p-3 text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(detailLog.changes, null, 2)}
                  </pre>
                </div>
              )}

              {detailLog.metadata && Object.keys(detailLog.metadata).length > 0 && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Metadata</p>
                  <pre className="mt-2 rounded-lg bg-surface p-3 text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(detailLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {detailLog.stackTrace && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">Stack Trace</p>
                  <pre className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs overflow-x-auto max-h-60 text-red-800">
                    {detailLog.stackTrace}
                  </pre>
                </div>
              )}

              {detailLog.ipAddress && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-muted">IP Address</p>
                  <p className="mt-1 text-sm font-mono">{detailLog.ipAddress}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
