import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export type ContributorAssignment = {
  contributorId: number;
  role: string;
  position: number;
};

type ContributorSummary = {
  id: number;
  displayName: string;
  handle: string;
  avatarUrl?: string | null;
};

const CONTRIBUTOR_ROLES = [
  { value: "author", label: "Author" },
  { value: "photographer", label: "Photographer" },
  { value: "interviewer", label: "Interviewer" },
  { value: "subject", label: "Subject" },
  { value: "curator", label: "Curator" },
  { value: "editor", label: "Editor" },
];

interface ContributorPickerProps {
  value: ContributorAssignment[];
  onChange: (contributors: ContributorAssignment[]) => void;
  label?: string;
}

export default function ContributorPicker({ value, onChange, label = "Contributors" }: ContributorPickerProps) {
  const [addingId, setAddingId] = useState<string>("");

  const { data: allContributors = [] } = useQuery<ContributorSummary[]>({
    queryKey: ["/api/contributors"],
  });

  const selectedIds = new Set(value.map((a) => a.contributorId));
  const availableToAdd = allContributors.filter((c) => !selectedIds.has(c.id));

  const handleAdd = () => {
    if (!addingId) return;
    const id = parseInt(addingId);
    onChange([
      ...value,
      { contributorId: id, role: "author", position: value.length },
    ]);
    setAddingId("");
  };

  const handleRemove = (contributorId: number) => {
    onChange(
      value
        .filter((a) => a.contributorId !== contributorId)
        .map((a, i) => ({ ...a, position: i }))
    );
  };

  const handleRoleChange = (contributorId: number, role: string) => {
    onChange(
      value.map((a) =>
        a.contributorId === contributorId ? { ...a, role } : a
      )
    );
  };

  const getContributor = (id: number) =>
    allContributors.find((c) => c.id === id);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Selected contributors */}
      {value.length > 0 && (
        <div className="space-y-1 rounded-md border border-input p-2">
          {value.map((assignment) => {
            const contributor = getContributor(assignment.contributorId);
            if (!contributor) return null;
            return (
              <div
                key={assignment.contributorId}
                className="flex items-center gap-2"
              >
                <span className="flex-1 text-sm font-medium truncate">
                  {contributor.displayName}
                  <span className="text-xs text-muted-foreground ml-1">
                    @{contributor.handle}
                  </span>
                </span>
                <Select
                  value={assignment.role}
                  onValueChange={(role) =>
                    handleRoleChange(assignment.contributorId, role)
                  }
                >
                  <SelectTrigger className="w-36 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRIBUTOR_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(assignment.contributorId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add contributor row */}
      {availableToAdd.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={addingId} onValueChange={setAddingId}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Add contributor…" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                  {c.displayName}{" "}
                  <span className="text-muted-foreground">@{c.handle}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs px-3"
            onClick={handleAdd}
            disabled={!addingId}
          >
            Add
          </Button>
        </div>
      )}

      {value.length === 0 && availableToAdd.length === 0 && allContributors.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No contributors found. Create contributors in the Contributors section first.
        </p>
      )}

      {value.length === 0 && availableToAdd.length === 0 && allContributors.length > 0 && (
        <p className="text-xs text-muted-foreground italic">
          All contributors already added.
        </p>
      )}
    </div>
  );
}
