"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";

interface ModelSelectorProps {
  models: string[];
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
}

export function ModelSelector({
  models,
  selectedModels,
  onModelsChange,
}: ModelSelectorProps) {
  const [tempSelectedModels, setTempSelectedModels] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setTempSelectedModels(selectedModels);
    }
  }, [open, selectedModels]);

  const handleSelectAll = () => {
    setTempSelectedModels(["all"]);
  };

  const handleDeselectAll = () => {
    setTempSelectedModels([]);
  };

  const handleApply = () => {
    onModelsChange(tempSelectedModels);
    setOpen(false);
  };

  // Handle model selection logic - when selecting a model, remove "all" if it exists
  const handleModelSelection = (checked: boolean, model: string) => {
    if (model === "all") {
      setTempSelectedModels(checked ? ["all"] : []);
      return;
    }

    setTempSelectedModels((prev) => {
      // If we're selecting a specific model, remove "all" from the selection
      const newSelection = prev.filter((m) => m !== "all");

      // Then add or remove the specific model
      if (checked) {
        return [...newSelection, model];
      } else {
        return newSelection.filter((m) => m !== model);
      }
    });
  };

  // Add the "all" option to the models list
  const displayModels = ["all", ...models];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-gray-900/60 border-gray-700/50 text-gray-200 hover:bg-gray-800/60"
        >
          Models
          {selectedModels.includes("all") ? (
            <span className="ml-2 text-purple-400">(All)</span>
          ) : selectedModels.length > 0 ? (
            <span className="ml-2 text-purple-400">
              ({selectedModels.length})
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-4 bg-gray-900/95 border-gray-700/50 backdrop-blur-sm">
        <div className="flex justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            Deselect All
          </Button>
        </div>
        <ScrollArea className="h-[200px] mb-4">
          <div className="space-y-2">
            {displayModels.map((model) => (
              <label
                key={model}
                className="flex items-center px-4 py-2 hover:bg-gray-800/60 cursor-pointer rounded group"
              >
                <Checkbox
                  checked={
                    tempSelectedModels.includes(model) ||
                    (model !== "all" && tempSelectedModels.includes("all"))
                  }
                  onCheckedChange={(checked) =>
                    handleModelSelection(!!checked, model)
                  }
                  className="mr-2 border-gray-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                />
                <span className="text-sm text-gray-200 group-hover:text-gray-100">
                  {model === "all" ? "All Models" : model}
                </span>
              </label>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-300"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
          >
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
