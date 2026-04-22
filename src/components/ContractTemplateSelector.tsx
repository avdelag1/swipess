import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, Home, Car, Bike, Briefcase, ShoppingCart,
  FileSignature, ChevronRight
} from 'lucide-react';
import { ContractTemplate, ownerTemplates, clientTemplates } from '@/data/contractTemplates';

interface ContractTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: ContractTemplate) => void;
  userRole: 'owner' | 'client';
}

const categoryIcons: Record<string, React.ReactNode> = {
  lease: <Home className="w-5 h-5" />,
  rental: <Home className="w-5 h-5" />,
  rental_agreement: <Home className="w-5 h-5" />,
  purchase: <ShoppingCart className="w-5 h-5" />,
  service: <Briefcase className="w-5 h-5" />,
  bicycle: <Bike className="w-5 h-5" />,
  moto: <Car className="w-5 h-5" />,
  promise: <FileSignature className="w-5 h-5" />
};

const categoryColors: Record<string, string> = {
  lease: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  rental: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  rental_agreement: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  purchase: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  service: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  bicycle: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  moto: 'bg-red-500/10 text-red-700 dark:text-red-300',
  promise: 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
};

export const ContractTemplateSelector: React.FC<ContractTemplateSelectorProps> = ({
  open,
  onOpenChange,
  onSelectTemplate,
  userRole
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const templates = userRole === 'owner' ? ownerTemplates : clientTemplates;

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Choose a Contract Template
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted p-1">
              {categories.map(cat => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs capitalize"
                >
                  {cat === 'all' ? 'All Templates' : cat.replace('_', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <div className="grid gap-3 pb-4">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${categoryColors[template.category]}`}>
                          {categoryIcons[template.category] || <FileText className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                            <Badge variant="outline" className="text-xs capitalize shrink-0">
                              {template.category.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        <div className="shrink-0 p-4 border-t bg-muted/50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


