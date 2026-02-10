import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  lease: 'bg-blue-100 text-blue-800',
  rental: 'bg-green-100 text-green-800',
  rental_agreement: 'bg-emerald-100 text-emerald-800',
  purchase: 'bg-purple-100 text-purple-800',
  service: 'bg-orange-100 text-orange-800',
  bicycle: 'bg-cyan-100 text-cyan-800',
  moto: 'bg-red-100 text-red-800',
  promise: 'bg-amber-100 text-amber-800'
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
            <FileText className="w-5 h-5 text-blue-600" />
            Choose a Contract Template
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-gray-100 p-1">
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
                    className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
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
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        <div className="shrink-0 p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
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
