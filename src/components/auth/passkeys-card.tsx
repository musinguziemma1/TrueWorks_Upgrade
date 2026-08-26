"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { deletePasskey, listPasskeys, registerPasskey, type PasskeySummary } from "@/lib/auth/passkeys";

function fmtDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Passkey (WebAuthn) management: register new passkeys, list and revoke
 * existing ones. Rendered inside the account security page.
 */
export function PasskeysCard() {
  const [passkeys, setPasskeys] = useState<PasskeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setPasskeys(await listPasskeys());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRegister = async () => {
    setRegistering(true);
    const result = await registerPasskey(newName.trim() || undefined);
    if (result.ok) {
      toast.success("Passkey registered");
      setNewName("");
      setShowForm(false);
      await refresh();
    } else {
      toast.error(result.error ?? "Could not register passkey");
    }
    setRegistering(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deletePasskey(id);
    if (result.ok) {
      toast.success("Passkey removed");
      await refresh();
    } else {
      toast.error(result.error ?? "Could not remove passkey");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Passkeys
          </CardTitle>
          <CardDescription>
            Sign in with your fingerprint, face, or device PIN — phishing-resistant and faster than passwords.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          Add passkey
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 sm:flex-row">
            <Input
              placeholder="Passkey name (e.g. MacBook Touch ID)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={64}
            />
            <Button onClick={handleRegister} disabled={registering} className="shrink-0">
              {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {registering ? "Waiting for authenticator…" : "Register"}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No passkeys registered yet. Add one for a faster, safer sign-in.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pk.name || "Passkey"}</p>
                  <p className="text-xs text-muted-foreground">
                    Added {fmtDate(pk.createdAt)}
                    {pk.lastUsedAt ? ` · Last used ${fmtDate(pk.lastUsedAt)}` : ""}
                    {pk.backedUp ? " · Synced" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {pk.deviceType === "multiDevice" && (
                    <Badge variant="outline" className="hidden sm:inline-flex">
                      Synced
                    </Badge>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(pk.id)} aria-label="Remove passkey">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
