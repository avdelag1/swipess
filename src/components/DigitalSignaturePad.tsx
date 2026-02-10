import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface DigitalSignaturePadProps {
  onSignatureCapture: (signatureData: string, signatureType: 'drawn' | 'typed' | 'uploaded') => void;
  onClear?: () => void;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  onSignatureCapture,
  onClear
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState('font-serif');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;

    // Set drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear?.();
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    onSignatureCapture(signatureData, 'drawn');
  };

  const saveTypedSignature = () => {
    if (!typedSignature.trim()) return;

    // Create a canvas for the typed signature
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#000';
    ctx.font = selectedFont.includes('serif') ? '32px serif' : 
               selectedFont.includes('sans') ? '32px sans-serif' : 
               '32px cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

    const signatureData = canvas.toDataURL('image/png');
    onSignatureCapture(signatureData, 'typed');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedSignature(result);
      onSignatureCapture(result, 'uploaded');
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Digital Signature</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="draw" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                className="border border-gray-200 rounded cursor-crosshair mx-auto block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <p className="text-sm text-gray-500 text-center mt-2">
                Draw your signature above
              </p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={clearCanvas}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button onClick={saveDrawnSignature}>
                <Download className="w-4 h-4 mr-2" />
                Save Signature
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="signature-text">Your Signature</Label>
                <Input
                  id="signature-text"
                  placeholder="Type your name"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Font Style</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { value: 'font-serif', label: 'Serif', style: 'serif' },
                    { value: 'font-sans', label: 'Sans', style: 'sans-serif' },
                    { value: 'font-mono', label: 'Script', style: 'cursive' }
                  ].map((font) => (
                    <Button
                      key={font.value}
                      variant={selectedFont === font.value ? 'default' : 'outline'}
                      onClick={() => setSelectedFont(font.value)}
                      className="h-12"
                      style={{ fontFamily: font.style }}
                    >
                      {font.label}
                    </Button>
                  ))}
                </div>
              </div>

              {typedSignature && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div 
                    className={`text-2xl ${selectedFont} text-center`}
                    style={{ 
                      fontFamily: selectedFont.includes('serif') ? 'serif' : 
                                 selectedFont.includes('sans') ? 'sans-serif' : 'cursive'
                    }}
                  >
                    {typedSignature}
                  </div>
                </div>
              )}
            </div>
            <Button 
              onClick={saveTypedSignature} 
              disabled={!typedSignature.trim()}
              className="w-full"
            >
              Save Typed Signature
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <Label htmlFor="signature-upload" className="cursor-pointer">
                  <span className="text-lg font-medium">Upload Signature Image</span>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </Label>
                <Input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {uploadedSignature && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Uploaded Signature:</p>
                <img 
                  src={uploadedSignature} 
                  alt="Uploaded signature" 
                  className="max-w-full h-auto mx-auto"
                  style={{ maxHeight: '100px' }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};