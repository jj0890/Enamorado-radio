import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sparkles,
  Radio,
  FileText,
  Star,
  Grid3x3,
  Image,
  Layout,
  Save,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContentSlot {
  id: string;
  label: string;
  description: string;
  section: "editorial" | "radio" | "featured";
  contentType?: string[];
  contentId?: number;
  contentTitle?: string;
  contentImage?: string;
}

interface PublishedContent {
  id: number;
  title: string;
  type: string;
  coverImage?: string;
  status: string;
  publishedAt: string;
  externalUrl?: string;
  externalType?: string;
}

export default function EditorialContentMapper() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Content slots configuration
  const [slots, setSlots] = useState<ContentSlot[]>([
    {
      id: "editorial-hero",
      label: "Editorial Hero",
      description: "Main featured editorial piece (left side of homepage)",
      section: "editorial",
      contentType: ["photoshoot", "interview", "essay"],
    },
    {
      id: "radio-hero",
      label: "Radio Hero",
      description: "Now Playing / Featured show (right side of homepage)",
      section: "radio",
      contentType: ["episode", "mix"],
    },
    {
      id: "featured-editorial-1",
      label: "Featured Editorial #1",
      description: "Secondary featured editorial content",
      section: "featured",
      contentType: ["photoshoot", "interview", "essay"],
    },
    {
      id: "featured-editorial-2",
      label: "Featured Editorial #2",
      description: "Tertiary featured editorial content",
      section: "featured",
      contentType: ["photoshoot", "interview", "essay"],
    },
    {
      id: "featured-radio-1",
      label: "Featured Radio #1",
      description: "Featured episode or mix",
      section: "featured",
      contentType: ["episode", "mix"],
    },
    {
      id: "featured-radio-2",
      label: "Featured Radio #2",
      description: "Featured episode or mix",
      section: "featured",
      contentType: ["episode", "mix"],
    },
  ]);

  // Fetch published editorial content
  const { data: editorialContent = [] } = useQuery<PublishedContent[]>({
    queryKey: ["/api/editorial/published"],
  });

  // Fetch published radio content
  const { data: radioContent = [] } = useQuery<PublishedContent[]>({
    queryKey: ["/api/content/published"],
  });

  // Fetch existing content mapping
  const { data: existingMapping } = useQuery<{ slots?: ContentSlot[] } | null>({
    queryKey: ["/api/editorial/content-mapping"],
  });

  // Load existing mapping into slots when data arrives
  useEffect(() => {
    if (existingMapping?.slots) {
      setSlots(existingMapping.slots);
    }
  }, [existingMapping]);

  // Save content mapping mutation
  const saveMappingMutation = useMutation({
    mutationFn: async (mapping: ContentSlot[]) => {
      const response = await fetch("/api/editorial/content-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slots: mapping }),
      });
      if (!response.ok) throw new Error("Failed to save mapping");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/editorial/content-mapping"] });
      toast({
        title: "Mapping saved",
        description: "Homepage content placement has been updated.",
      });
    },
  });

  const handleAssignContent = (slotId: string, contentId: number, contentTitle: string, contentImage?: string) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? { ...slot, contentId, contentTitle, contentImage }
          : slot
      )
    );
  };

  const handleClearSlot = (slotId: string) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? { ...slot, contentId: undefined, contentTitle: undefined, contentImage: undefined }
          : slot
      )
    );
  };

  const handleSaveMapping = () => {
    saveMappingMutation.mutate(slots);
  };

  const getAvailableContent = (slot: ContentSlot) => {
    if (slot.section === "editorial") {
      return editorialContent.filter((c) => slot.contentType?.includes(c.type));
    } else if (slot.section === "radio") {
      return radioContent.filter((c) => slot.contentType?.includes(c.type));
    } else {
      return [...editorialContent, ...radioContent].filter((c) =>
        slot.contentType?.includes(c.type)
      );
    }
  };

  const getSectionIcon = (section: ContentSlot["section"]) => {
    switch (section) {
      case "editorial":
        return <FileText className="w-5 h-5" />;
      case "radio":
        return <Radio className="w-5 h-5" />;
      case "featured":
        return <Star className="w-5 h-5" />;
    }
  };

  const getSectionColor = (section: ContentSlot["section"]) => {
    switch (section) {
      case "editorial":
        return "bg-purple-500";
      case "radio":
        return "bg-navy";
      case "featured":
        return "bg-yellow-500";
    }
  };

  return (
    <AdminShell
      title="Content Mapper"
      subtitle="Assign editorial and radio content to homepage display slots"
      breadcrumbs={[{ label: "Editorial Production" }, { label: "Content Mapper" }]}
      actions={
        <Button
          onClick={handleSaveMapping}
          disabled={saveMappingMutation.isPending}
          className="bg-navy hover:bg-navy-dark"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMappingMutation.isPending ? "Saving..." : "Save Mapping"}
        </Button>
      }
    >
      {/* Homepage Preview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Homepage Layout Preview
          </CardTitle>
          <CardDescription>Visual representation of your homepage content placement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-6">
            {/* Split Hero Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Editorial Hero */}
              {(() => {
                const editorialHero = slots.find((s) => s.id === "editorial-hero");
                const content = editorialHero?.contentId
                  ? editorialContent.find(c => c.id === editorialHero.contentId)
                  : null;

                return (
                  <div className="relative bg-white border-2 border-purple-500 rounded-lg overflow-hidden aspect-[16/9]">
                    {editorialHero?.contentImage ? (
                      <>
                        <img
                          src={editorialHero.contentImage}
                          alt={editorialHero.contentTitle}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-purple-400" />
                            {content?.externalUrl && (
                              <Badge variant="outline" className="bg-purple-600 text-white border-0 text-xs gap-1">
                                <ExternalLink className="w-3 h-3" />
                                {content.externalType || 'External'}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-sm text-white line-clamp-2">
                            {editorialHero.contentTitle}
                          </h3>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6">
                        <div className="text-purple-600 mb-2">
                          <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-sm mb-1">Editorial Hero</h3>
                        <p className="text-xs text-gray-500">No content assigned</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Radio Hero */}
              {(() => {
                const radioHero = slots.find((s) => s.id === "radio-hero");

                return (
                  <div className="relative bg-navy text-white rounded-lg overflow-hidden aspect-[16/9]">
                    {radioHero?.contentImage ? (
                      <>
                        <img
                          src={radioHero.contentImage}
                          alt={radioHero.contentTitle}
                          className="w-full h-full object-cover opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Radio className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-sm line-clamp-2">
                            {radioHero.contentTitle}
                          </h3>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6">
                        <div className="mb-2">
                          <Radio className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-sm mb-1">Now Playing</h3>
                        <p className="text-xs text-gray-300">No content assigned</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Featured Grid */}
            <div className="grid grid-cols-4 gap-3">
              {["featured-editorial-1", "featured-editorial-2", "featured-radio-1", "featured-radio-2"].map(
                (slotId) => {
                  const slot = slots.find((s) => s.id === slotId);
                  const content = slot?.contentId
                    ? [...editorialContent, ...radioContent].find(c => c.id === slot.contentId)
                    : null;

                  return (
                    <div
                      key={slotId}
                      className="relative bg-white border border-gray-300 rounded overflow-hidden aspect-square"
                    >
                      {slot?.contentImage ? (
                        <>
                          <img
                            src={slot.contentImage}
                            alt={slot.contentTitle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute top-1 right-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          </div>
                          {content?.externalUrl && (
                            <div className="absolute top-1 left-1">
                              <div className="bg-black/60 rounded px-1 py-0.5">
                                <ExternalLink className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-[9px] text-white font-medium line-clamp-2">
                              {slot.contentTitle}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-3">
                          <Star className="w-5 h-5 text-yellow-500 mb-1" />
                          <p className="text-[10px] text-center font-medium text-gray-600">
                            {slot?.label?.replace('Featured ', '')}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Slot Management */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Grid3x3 className="w-5 h-5" />
          Content Slots
        </h2>

        {/* Group by section */}
        {["editorial", "radio", "featured"].map((section) => (
          <div key={section}>
            <h3 className="text-sm font-semibold uppercase text-gray-600 mb-3 flex items-center gap-2">
              {getSectionIcon(section as ContentSlot["section"])}
              {section} Slots
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {slots
                .filter((slot) => slot.section === section)
                .map((slot) => {
                  const availableContent = getAvailableContent(slot);

                  return (
                    <Card key={slot.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 ${getSectionColor(slot.section)} rounded-lg text-white`}>
                              {getSectionIcon(slot.section)}
                            </div>
                            <div>
                              <CardTitle className="text-sm">{slot.label}</CardTitle>
                              <CardDescription className="text-xs">{slot.description}</CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {slot.contentId ? (
                          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {slot.contentImage && (
                                <img
                                  src={slot.contentImage}
                                  alt={slot.contentTitle}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium text-sm">{slot.contentTitle}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  Assigned
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClearSlot(slot.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Select
                              onValueChange={(value) => {
                                const content = availableContent.find((c) => c.id === parseInt(value));
                                if (content) {
                                  handleAssignContent(slot.id, content.id, content.title, content.coverImage);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select content to assign..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableContent.length === 0 ? (
                                  <div className="p-2 text-sm text-gray-500 text-center">
                                    No published content available
                                  </div>
                                ) : (
                                  availableContent.map((content) => (
                                    <SelectItem key={content.id} value={content.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        {content.coverImage && (
                                          <img
                                            src={content.coverImage}
                                            alt={content.title}
                                            className="w-8 h-8 rounded object-cover"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium">{content.title}</p>
                                            {content.externalUrl && (
                                              <Badge variant="outline" className="text-xs gap-1">
                                                <ExternalLink className="w-2.5 h-2.5" />
                                                {content.externalType}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500">{content.type}</p>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
